import bcrypt from "bcrypt";
import crypto from "crypto";
import JWT from "jsonwebtoken";

const SALT_ROUNDS = 10;
const OTP_TTL_MINUTES = 10;

// Password hashing function
export const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return hashedPassword;
};

// Password comparing function
export const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  return bcrypt.compare(password, hashedPassword);
};

// Signs a short-lived access token
export const generateAccessToken = (user) => {
  return JWT.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_ACCESS_TIME || "15m" },
  );
};

// Signs a long-lived refresh token. Returned to the client as an httpOnly
// cookie and also stored (hashed-lite) on the user for revocation.
// The jti keeps every issued token unique — without it, two tokens minted in
// the same second would be byte-identical and rotation could not detect reuse.
export const generateRefreshToken = (user) => {
  const token = JWT.sign(
    { id: user._id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET_KEY,
    {
      expiresIn: process.env.JWT_REFRESH_TIME || "7d",
    },
  );

  const decoded = JWT.decode(token);
  return { token, expiresAt: new Date(decoded.exp * 1000) };
};

// Generates a 6-digit one-time password for phone/email verification
export const generateOtp = () =>
  String(crypto.randomInt(0, 1000000)).padStart(6, "0");

// One-way hash so a raw OTP is never written to the database
export const hashOtp = (otp) =>
  crypto
    .createHash("sha256")
    .update(`${otp}${process.env.OTP_SECRET_KEY}`)
    .digest("hex");

export const verifyOtpHash = (otp, hash) => hashOtp(otp) === hash;

// Verifies the access token from the cookie or Authorization header and
// attaches the user to the request.
export const requireSignIn = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const token = req.cookies.accessToken || bearerToken;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not Authenticated!" });
    }

    const payload = JWT.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = payload.id;
    req.userRole = payload.role;

    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: "Token is not Valid!" });
  }
};

// Restricts a route to the given roles, e.g. requireRole("agent", "landlord").
// Runs requireSignIn itself when the route has not already authenticated, so
// a forgotten middleware turns into a 401 rather than a confusing 403.
export const requireRole =
  (...roles) =>
  async (req, res, next) => {
    if (!req.userId) {
      return requireSignIn(req, res, () => checkRole(req, res, next, roles));
    }
    return checkRole(req, res, next, roles);
  };

const checkRole = (req, res, next, roles) => {
  if (!req.userRole || !roles.includes(req.userRole)) {
    return res.status(403).json({ success: false, message: "Not authorized!" });
  }
  next();
};
