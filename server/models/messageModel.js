import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [
      {
        type: String,
      },
    ],
    readAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model("message", messageSchema);
