import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { comparePassword } from "../utils/authUtils.js";
import bcrypt from "bcrypt";

// Register function
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User exists" });
    }

    // HASH THE PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);
    // CREATE A NEW USER AND SAVE TO DB
    const newUser = await new userModel({
      username,
      email,
      password: hashedPassword,
    }).save();

    // GENERATE COOKIE TOKEN AND SEND TO THE USER
    const age = 100 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: newUser.id,
        isAdmin: false,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        // secure:true,
        maxAge: age,
      })
      .status(200)
      .send({ user: newUser, message: "User created successfully" });
  } catch (err) {
    res.status(500).send({ message: "Failed to create user!" });
  }
};

// Login function
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // CHECK IF THE USER EXISTS
    const user = await userModel.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

    // CHECK IF THE PASSWORD IS CORRECT
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid Credentials!" });

    // GENERATE COOKIE TOKEN AND SEND TO THE USER
    const age = 100 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: user.id,
        isAdmin: false,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    const { password: userPassword, ...userInfo } = user;
    res
      .cookie("token", token, {
        httpOnly: true,
        // secure:true,
        maxAge: age,
      })
      .status(200)
      .send(userInfo?._doc);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to login!" });
  }
};

// Logout function
export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};

// checkAdmin function
export const checkAdmin = async (req, res) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "Not Authenticated!" });

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
    if (err) return res.status(403).json({ message: "Token is not Valid!" });
    if (!payload.isAdmin || payload.isAdmin === undefined) {
      return res.status(403).json({ message: "Not authorized!" });
    }
    res.status(200).json({ message: "You are Authenticated" });
  });
};
