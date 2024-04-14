import userModel from "../models/userModel.js";
import { hashPassword } from "../utils/authUtils.js";

// Get users controller
export const getUsers = async (req, res) => {
  try {
    const users = await userModel.find();
    res.status(200).send(users);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to get users!" });
  }
};

// Update user controller
export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const { password, ...inputs } = req.body;

  if (id !== tokenUserId) {
    return res.status(403).send({ message: "Not Authorized!" });
  }

  let updatedPassword = null;
  // checking for password and if have, hash and update
  try {
    if (password) {
      updatedPassword = await hashPassword(password);
    }

    const updatedUser = await userModel.findByIdAndUpdate(id, {
      ...inputs,
      ...(updatedPassword && { password: updatedPassword }),
    });

    const { password: userPassword, ...rest } = updatedUser;

    res.status(200).send({ user: rest, message: "Profile Updated" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to update user!" });
  }
};

// Delete user controller
export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).send({ message: "Not Authorized!" });
  }

  try {
    await userModel.findByIdAndDelete(id);
    res.status(200).send({ message: "User deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to delete users!" });
  }
};
