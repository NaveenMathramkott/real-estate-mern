import messageModel from "../models/messageModel.js";
import chatModel from "../models/chatModel.js";

export const addMessage = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.chatId;
  const text = req.body.text;

  try {
    const chat = await chatModel.findOne({
      id: chatId,
      userIDs: { $in: [tokenUserId] },
    });

    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    const message = await messageModel.create({
      data: {
        text,
        chatId,
        userId: tokenUserId,
      },
    });

    await chatModel.updateOne(
      { id: chatId }, // Filter
      {
        $set: {
          lastMessage: text,
        },
        $addToSet: {
          seenBy: tokenUserId, // Add `tokenUserId` to `seenBy` only if it's not already present
        },
      }
    );
    res.status(200).json(message);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "failed to add message" });
  }
};
