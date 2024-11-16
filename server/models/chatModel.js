import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userIds: {
      type: [mongoose.ObjectId],
      ref: "user",
    },
    seenBy: {
      type: [mongoose.ObjectId],
    },
    messages: {
      type: mongoose.ObjectId,
      ref: "message",
    },
    lastMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("chat", chatSchema);
