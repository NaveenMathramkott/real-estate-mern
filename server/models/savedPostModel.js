import mongoose from "mongoose";

const savedPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.ObjectId,
      ref: "user",
      unique: true,
    },
    postId: {
      type: mongoose.ObjectId,
      ref: "post",
      unique: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("savedPost", savedPostSchema);
