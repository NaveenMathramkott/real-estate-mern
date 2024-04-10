import mongoose from "mongoose";

const postDetailSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    utilities: {
      type: String,
    },
    pet: {
      type: String,
    },
    income: {
      type: String,
    },
    size: {
      type: Number,
    },
    school: {
      type: Number,
    },
    bus: {
      type: Number,
    },
    restaurant: {
      type: Number,
    },

    postId: {
      type: mongoose.ObjectId,
      ref: "post",
    },
  },
  { timestamps: true }
);

export default mongoose.model("postDetail", postDetailSchema);
