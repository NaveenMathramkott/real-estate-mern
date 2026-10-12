import JWT from "jsonwebtoken";
import { errorResponse } from "../utils/errorUtils.js";
import userModel from "../models/userModel.js";
import { redis } from "../config/redis.js";
import {
  comparePassword,
  generateAccessToken,
  generateOtp,
  generateRefreshToken,
  hashOtp,
  hashPassword,
  verifyOtpHash,
} from "../utils/authUtils.js";

const OTP_KEY_PREFIX = "otp:";
const OTP_ATTEMPTS_KEY_PREFIX = "otp-attempts:";
const OTP_TTL_SECONDS = 10 * 60;
const MAX_OTP_ATTEMPTS = 5;

const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: maxAgeMs,
});

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Concurrent-device cap on stored refresh tokens
const MAX_REFRESH_TOKENS = 10;

const publicUser = (user) => ({
  _id: user._id,
  email: user.email,
  phone: user.phone,
  role: user.role,
  verified: user.verified,
  locale: user.locale,
  currency: user.currency,
});

const issueTokens = async (res, user) => {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, expiresAt } = generateRefreshToken(user);

  await userModel.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: { token: refreshToken, expiresAt } } },
  );

  // Keep only the most recent sessions so the array cannot grow without bound
  await userModel.updateOne(
    { _id: user._id },
    { $slice: { refreshTokens: -MAX_REFRESH_TOKENS } },
  );

  res.cookie("refreshToken", refreshToken, cookieOptions(REFRESH_TTL_MS));
  res.cookie("accessToken", accessToken, cookieOptions(15 * 60 * 1000));

  return accessToken;
};

// Register function
export const register = async (req, res) => {
  try {
    const { email, phone, password, role, locale, currency, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const existingUser = await userModel.findOne({
      $or: [{ email: email.toLowerCase() }, ...(phone ? [{ phone }] : [])],
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User exists" });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await userModel.create({
      email,
      phone,
      passwordHash,
      role: role || "buyer",
      locale,
      currency,
    });

    if (name) {
      const profileModel = (await import("../models/profileModel.js")).default;
      await profileModel.create({ userId: newUser._id, name });
    }

    const accessToken = await issueTokens(res, newUser);

    res.status(201).json({
      success: true,
      user: publicUser(newUser),
      accessToken,
      message: "User created successfully",
    });
  } catch (error) {
    console.log(error);
    errorResponse(res, error, "Failed to create user!");
  }
};

// Login function
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials!" });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials!" });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials!" });
    }

    const accessToken = await issueTokens(res, user);

    res
      .status(200)
      .json({ success: true, user: publicUser(user), accessToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to login!" });
  }
};

// Refresh function — rotates the refresh token and mints a new access token
export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token" });
    }

    const payload = JWT.verify(token, process.env.JWT_REFRESH_SECRET_KEY);

    const user = await userModel.findOne({ _id: payload.id });

    if (!user) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const isStored = user.refreshTokens.some((entry) => entry.token === token);

    if (!isStored) {
      // Token is validly signed but not ours — treat as reuse and revoke all
      await userModel.updateOne(
        { _id: user._id },
        { $set: { refreshTokens: [] } },
      );
      return res
        .status(403)
        .json({ success: false, message: "Refresh token revoked" });
    }

    // Rotate: drop the used token, then discard any already-expired ones
    // (separate statements — Mongo rejects $pull and $set on the same path)
    await userModel.updateOne(
      { _id: user._id },
      { $pull: { refreshTokens: { token } } },
    );

    await userModel.updateOne(
      { _id: user._id },
      { $pull: { refreshTokens: { expiresAt: { $lte: new Date() } } } },
    );

    const accessToken = await issueTokens(res, user);

    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    console.log(error);
    res.status(403).json({ success: false, message: "Token is not Valid!" });
  }
};

// Logout function
export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await userModel.updateOne(
        { "refreshTokens.token": token },
        { $pull: { refreshTokens: { token } } },
      );
    }

    res.clearCookie("refreshToken").clearCookie("accessToken");
    res.status(200).json({ success: true, message: "Logout Successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to logout!" });
  }
};

// Request an OTP — stores only a hash, never the raw code
export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otp = generateOtp();

    if (redis) {
      await redis.set(`${OTP_KEY_PREFIX}${user._id}`, hashOtp(otp), {
        ex: OTP_TTL_SECONDS,
      });
      await redis.set(`${OTP_ATTEMPTS_KEY_PREFIX}${user._id}`, "0", {
        ex: OTP_TTL_SECONDS,
      });
    } else {
      console.log(`[otp] Redis unconfigured — OTP for ${user.email} is ${otp}`);
    }

    res.status(200).json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.log(error);
    errorResponse(res, error, "Failed to send OTP!");
  }
};

// Verify an OTP and mark the account verified
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!redis) {
      return res
        .status(503)
        .json({ success: false, message: "OTP verification requires Redis" });
    }

    const attemptsKey = `${OTP_ATTEMPTS_KEY_PREFIX}${user._id}`;
    const attempts = Number((await redis.get(attemptsKey)) || 0);

    if (attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Request a new OTP.",
      });
    }

    const storedHash = await redis.get(`${OTP_KEY_PREFIX}${user._id}`);

    if (!storedHash || !verifyOtpHash(otp, storedHash)) {
      await redis.set(attemptsKey, attempts + 1, { ex: OTP_TTL_SECONDS });
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    await redis.del(`${OTP_KEY_PREFIX}${user._id}`);
    await redis.del(attemptsKey);

    user.verified = true;
    await user.save();

    const accessToken = await issueTokens(res, user);

    res
      .status(200)
      .json({ success: true, user: publicUser(user), accessToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to verify OTP!" });
  }
};

// Current session
export const me = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user!" });
  }
};
