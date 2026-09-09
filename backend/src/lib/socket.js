import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// { userId: Set<socketId> }
const userSocketMap = {};

export const getReceiverSocketIds = (userId) => Array.from(userSocketMap[userId] || []);

export const getReceiverSocketId = (userId) => {
  const ids = userSocketMap[userId];
  return ids && ids.size ? Array.from(ids)[0] : undefined;
};

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = userSocketMap[userId] || new Set();
    userSocketMap[userId].add(socket.id);

    // Update pending 'sent' direct messages to 'delivered' now that recipient is connected
    try {
      const Message = (await import("../models/MessageModel.js")).default;
      const pending = await Message.find({ receiverId: userId, status: "sent" });
      if (pending && pending.length > 0) {
        const now = new Date();
        await Message.updateMany(
          { receiverId: userId, status: "sent" },
          { $set: { status: "delivered", deliveredAt: now } }
        );

        const senderIds = [...new Set(pending.map((m) => (m.senderId?._id || m.senderId)?.toString()))];
        senderIds.forEach((sId) => {
          const sids = getReceiverSocketIds(sId);
          sids.forEach((sid) => io.to(sid).emit("messagesDelivered", { receiverId: userId, deliveredAt: now }));
        });
      }
    } catch (e) {
      console.log("Error updating delivered status on connect:", e.message);
    }
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("markAsRead", async ({ senderId, receiverId }) => {
    try {
      if (!senderId || !receiverId) return;
      const Message = (await import("../models/MessageModel.js")).default;
      const now = new Date();
      await Message.updateMany(
        { senderId, receiverId, status: { $ne: "read" } },
        { $set: { status: "read", readAt: now }, $addToSet: { readBy: receiverId } }
      );
      const sids = getReceiverSocketIds(senderId.toString());
      sids.forEach((sid) => {
        io.to(sid).emit("messagesRead", {
          readerId: receiverId.toString(),
          otherId: senderId.toString(),
          readAt: now,
        });
      });
    } catch (e) {
      console.log("markAsRead socket error:", e.message);
    }
  });

  socket.on("markGroupAsRead", async ({ groupId, readerId }) => {
    try {
      if (!groupId || !readerId) return;
      const Message = (await import("../models/MessageModel.js")).default;
      const Group = (await import("../models/GroupModel.js")).default;
      await Message.updateMany(
        { groupId, senderId: { $ne: readerId } },
        { $addToSet: { readBy: readerId } }
      );
      const group = await Group.findById(groupId).select("members");
      if (group) {
        group.members.forEach((mId) => {
          const sids = getReceiverSocketIds(mId.toString());
          sids.forEach((sid) => io.to(sid).emit("groupMessagesRead", { groupId, readerId }));
        });
      }
    } catch (e) {
      console.log("markGroupAsRead socket error:", e.message);
    }
  });

  socket.on("disconnect", () => {
    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
