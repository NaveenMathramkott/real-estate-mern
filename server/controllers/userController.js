import chatModel from "../models/chatModel.js";
import postModel from "../models/postModel.js";
import savedPostModel from "../models/savedPostModel.js";
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

// Save the liked post

export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const user = req.userId;
  console.log(user);
  try {
    const userPost = await savedPostModel.findOne({ user });

    // if we have post then we'll remove from the save post list
    if (userPost) {
      const filterData = userPost.postId.filter((itm) => itm === postId);
      if (filterData.length === 0) {
        const newData = [...userPost.postId, postId];
        await savedPostModel.findOneAndUpdate(
          { user },
          {
            postId: newData,
          }
        );
      } else {
        const filterData = userPost.postId.filter((itm) => itm !== postId);
        await savedPostModel.findOneAndUpdate(
          { user },
          {
            postId: filterData,
          }
        );
      }
    } else {
      // need to work in next repo push ------------------xx
      // If post not found then create new saved post profile for new user
      await new savedPostModel({
        user,
        postId,
      }).save();
    }

    res.status(200).send({ message: "Post saved" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to save post!" });
  }
};

// Get profile posts

export const profilePosts = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const userPosts = await postModel.find({
      userId: tokenUserId,
    });
    const saved = await savedPostModel.find({
      userId: tokenUserId,
    });

    // const savedPosts = saved.map((item) => item.post);
    res.status(200).send({ userPosts, saved });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Failed to get profile posts!" });
  }
};

export const getNotificationNumber = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const number = await chatModel.countDocuments({
      userIDs: { $in: [tokenUserId] }, // Checks if tokenUserId is in userIDs
      seenBy: { $nin: [tokenUserId] }, // Excludes tokenUserId from seenBy
    });
    res.status(200).json(number);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get profile posts!" });
  }
};
