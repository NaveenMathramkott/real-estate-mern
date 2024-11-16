import chatModel from "../models/chatModel.js";

export const getChats = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chats = await chatModel.find({
      userIDs: { $in: [tokenUserId] },
    });

    for (const chat of chats) {
      const receiverId = chat.userIds.find((id) => id !== tokenUserId);

      const receiver = await User.findById(receiverId).select(
        "id username avatar"
      );
      if (receiver) {
        chat.receiver = receiver;
      }
      res.status(200).json(chats);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "failed to get chats" });
  }
};

export const getChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await chatModel
      .findOne(
        {
          id: req.params.id,
          userIDs: { $in: [tokenUserId] },
        },
        {
          messages: { $slice: [0, 1000] }, // To optimize, optionally limit results if needed
        }
      )
      .lean(); // Use .lean() if no modification of the result is required.

    if (chat) {
      chat.messages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    }

    await chatModel.updateOne(
      { id: req.params.id },
      { $push: { seenBy: tokenUserId } }
    );
    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get chat!" });
  }
};

export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const newChat = await chatModel.create({
      userIDs: [tokenUserId, req.body.receiverId],
    });
    res.status(200).json(newChat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add chat!" });
  }
};

export const readChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await chatModel.updateOne(
      {
        id: req.params.id,
        userIDs: tokenUserId, // MongoDB will check if this user ID exists in the array
      },
      {
        $set: { seenBy: [tokenUserId] }, // Replace the `seenBy` array with a new one
      }
    );
    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to read chat!" });
  }
};
