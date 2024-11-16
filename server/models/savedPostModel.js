import mongoose from "mongoose";

const savedPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Reference to the User model
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post", // Reference to the Post model
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Reference to the User model
      required: true,
      unique: true, // Unique userId for saved post
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post", // Reference to the Post model
      required: true,
      unique: true, // Unique postId for saved post
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

export default mongoose.model("savedPost", savedPostSchema);
