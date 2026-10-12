import { Server } from "socket.io";
import JWT from "jsonwebtoken";
import conversationModel from "../models/conversationModel.js";
import messageModel from "../models/messageModel.js";
import notificationModel from "../models/notificationModel.js";

// Holds the live Socket.IO server so non-socket code paths (e.g. the REST
// message endpoint) can push events to connected clients too. Populated by
// initSocket at boot.
let ioInstance = null;

export const getIo = () => ioInstance;

// Each user joins a room named after their id so notifications can be
// delivered regardless of which conversation or tab is open.
export const initSocket = (httpServer, clientOrigin) => {
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
  });

  ioInstance = io;

  // Authenticate the handshake before allowing any events
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) return next(new Error("Unauthorized"));

      const payload = JWT.verify(token, process.env.JWT_SECRET_KEY);
      socket.userId = payload.id;
      socket.userRole = payload.role;

      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.userId);

    // Send: client sends a message over the socket
    socket.on(
      "message:send",
      async ({ conversationId, body, attachments }, ack) => {
        try {
          const conversation = await conversationModel.findById(conversationId);

          if (!conversation) throw new Error("Conversation not found");

          const isParticipant = conversation.participants.some(
            (id) => id.toString() === socket.userId.toString(),
          );

          if (!isParticipant) throw new Error("Not authorized");

          const message = await messageModel.create({
            conversationId,
            senderId: socket.userId,
            body,
            attachments,
          });

          conversation.lastMessageAt = new Date();
          await conversation.save();

          // Deliver to everyone in the thread
          io.to(`conversation:${conversationId}`).emit("message:new", message);

          // Offline users get a persisted notification instead
          for (const participantId of conversation.participants) {
            if (participantId.toString() === socket.userId.toString()) continue;

            const notification = await notificationModel.create({
              userId: participantId,
              type: "message",
              payload: {
                conversationId,
                messageId: message._id,
                preview: body.slice(0, 120),
              },
            });

            io.to(participantId.toString()).emit(
              "notification:new",
              notification,
            );
          }

          if (typeof ack === "function") ack({ success: true, message });
        } catch (error) {
          if (typeof ack === "function")
            ack({ success: false, message: error.message });
        }
      },
    );

    socket.on("conversation:join", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("typing", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing", {
        userId: socket.userId,
        conversationId,
      });
    });
  });

  return io;
};

export default initSocket;
