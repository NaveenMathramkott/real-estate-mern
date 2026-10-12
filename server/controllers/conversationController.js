import conversationModel from "../models/conversationModel.js";
import { errorResponse } from "../utils/errorUtils.js";
import messageModel from "../models/messageModel.js";
import notificationModel from "../models/notificationModel.js";
import { getIo } from "../config/socket.js";

// Broadcasts a stored message to the thread and notifies other participants,
// so messages sent over REST reach the same sockets as socket-originated ones.
const deliverMessage = async (message, conversation) => {
  const io = getIo();
  if (!io) return;

  io.to(`conversation:${conversation._id}`).emit("message:new", message);

  for (const participantId of conversation.participants) {
    if (participantId.toString() === message.senderId.toString()) continue;

    const notification = await notificationModel.create({
      userId: participantId,
      type: "message",
      payload: {
        conversationId: conversation._id,
        messageId: message._id,
        preview: message.body.slice(0, 120),
      },
    });

    io.to(participantId.toString()).emit("notification:new", notification);
  }
};

const isParticipant = (conversation, userId) =>
  conversation.participants.some((id) => id.toString() === userId.toString());

// GET /conversations
export const getConversations = async (req, res) => {
  try {
    const conversations = await conversationModel
      .find({ participants: req.userId })
      .populate("participants", "email avatar")
      .populate("propertyId", "title address price currency")
      .sort({ lastMessageAt: -1 });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    console.log(error);
    errorResponse(res, error, "Failed to fetch conversations");
  }
};

// GET /conversations/:id
export const getConversation = async (req, res) => {
  try {
    const conversation = await conversationModel
      .findById(req.params.id)
      .populate("participants", "email avatar")
      .populate("propertyId", "title address price currency");

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    if (!isParticipant(conversation, req.userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch conversation" });
  }
};

// POST /conversations
export const createConversation = async (req, res) => {
  try {
    const { participantId, propertyId } = req.body;

    if (!participantId) {
      return res
        .status(400)
        .json({ success: false, message: "participantId is required" });
    }

    if (participantId.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot start a conversation with yourself",
      });
    }

    // Reuse an existing thread between the two users
    const existing = await conversationModel.findOne({
      participants: { $all: [req.userId, participantId] },
      ...(propertyId ? { propertyId } : {}),
    });

    if (existing) {
      return res
        .status(200)
        .json({ success: true, conversation: existing, existing: true });
    }

    const conversation = await conversationModel.create({
      participants: [req.userId, participantId],
      propertyId,
    });

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    console.log(error);
    errorResponse(res, error, "Failed to create conversation");
  }
};

// GET /conversations/:id/messages
export const getMessages = async (req, res) => {
  try {
    const conversation = await conversationModel.findById(req.params.id);

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    if (!isParticipant(conversation, req.userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const before = req.query.before ? new Date(req.query.before) : null;

    const filter = { conversationId: conversation._id };
    if (before) filter.createdAt = { $lt: before };

    const messages = await messageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch messages" });
  }
};

// POST /conversations/:id/messages
export const sendMessage = async (req, res) => {
  try {
    const { body, attachments } = req.body;

    if (!body) {
      return res
        .status(400)
        .json({ success: false, message: "Message body is required" });
    }

    const conversation = await conversationModel.findById(req.params.id);

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    if (!isParticipant(conversation, req.userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const message = await messageModel.create({
      conversationId: conversation._id,
      senderId: req.userId,
      body,
      attachments,
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    await deliverMessage(message, conversation);

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

// POST /conversations/:id/read
export const markConversationRead = async (req, res) => {
  try {
    const conversation = await conversationModel.findById(req.params.id);

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    if (!isParticipant(conversation, req.userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await messageModel.updateMany(
      {
        conversationId: conversation._id,
        senderId: { $ne: req.userId },
        readAt: null,
      },
      { $set: { readAt: new Date() } },
    );

    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};
