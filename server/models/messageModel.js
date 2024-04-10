import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },

    chat: {
      type: mongoose.ObjectId,
      ref: "chat",
    },
  },
  { timestamps: true }
);

export default mongoose.model("message", messageSchema);
