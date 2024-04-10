import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    // posts: {
    //   type: mongoose.objectId,
    //   ref: "post",
    // },
    // savedPosts: {
    //   type: mongoose.objectId,
    //   ref: "savedPost",
    // },
    // chat: {
    //   type: mongoose.objectId,
    //   ref: "savedPost",
    // },
  },
  { timestamps: true }
);

export default mongoose.model("user", userSchema);
