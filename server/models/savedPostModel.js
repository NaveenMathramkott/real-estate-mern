import mongoose from "mongoose";

const savedPostSchema = new mongoose.Schema(
  {
    user: {
      type: String,
    },
    postId: {
      type: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model("savedPost", savedPostSchema);
