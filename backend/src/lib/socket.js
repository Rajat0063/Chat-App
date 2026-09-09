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
// { userId: { type: 'direct' | 'group', id: string } }
const userActiveChatMap = {};
// { socketId: { type: 'direct' | 'group', id: string, userId: string } }
const socketActiveChatMap = {};

export const getReceiverSocketIds = (userId) => {
  if (!userId) return [];
  const key = (userId?._id || userId).toString();
  return Array.from(userSocketMap[key] || []);
};

export const getReceiverSocketId = (userId) => {
  if (!userId) return undefined;
  const key = (userId?._id || userId).toString();
  const ids = userSocketMap[key];
  return ids && ids.size ? Array.from(ids)[0] : undefined;
};

export const isUserInConversation = (userId, targetId, type = "direct") => {
  if (!userId || !targetId) return false;
  const uKey = (userId?._id || userId).toString();
  const tKey = (targetId?._id || targetId).toString();
  const active = userActiveChatMap[uKey];
  return Boolean(active && active.type === type && active.id === tKey);
};

io.on("connection", async (socket) => {
  const rawUserId = socket.handshake.query.userId;
  const userId = rawUserId && rawUserId !== "undefined" ? rawUserId.toString() : null;

  if (userId) {
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

  // User enters a specific conversation (direct message or group)
  socket.on("enterChat", async ({ type, id }) => {
    if (!userId || !type || !id) return;
    const cleanTargetId = (id?._id || id).toString();
    userActiveChatMap[userId] = { type, id: cleanTargetId };
    socketActiveChatMap[socket.id] = { type, id: cleanTargetId, userId };

    if (type === "direct") {
      try {
        const Message = (await import("../models/MessageModel.js")).default;
        const now = new Date();
        await Message.updateMany(
          { senderId: cleanTargetId, receiverId: userId, status: { $ne: "read" } },
          { $set: { status: "read", readAt: now }, $addToSet: { readBy: userId } }
        );

        const sids = getReceiverSocketIds(cleanTargetId);
        sids.forEach((sid) => {
          io.to(sid).emit("messagesRead", {
            readerId: userId,
            otherId: cleanTargetId,
            readAt: now,
          });
        });
      } catch (e) {
        console.log("enterChat error:", e.message);
      }
    } else if (type === "group") {
      try {
        const Message = (await import("../models/MessageModel.js")).default;
        const Group = (await import("../models/GroupModel.js")).default;
        await Message.updateMany(
          { groupId: cleanTargetId, senderId: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );

        const group = await Group.findById(cleanTargetId).select("members");
        if (group && group.members) {
          group.members.forEach((mId) => {
            const sids = getReceiverSocketIds((mId?._id || mId).toString());
            sids.forEach((sid) => io.to(sid).emit("groupMessagesRead", { groupId: cleanTargetId, readerId: userId }));
          });
        }
      } catch (e) {
        console.log("enterGroupChat error:", e.message);
      }
    }
  });

  socket.on("leaveChat", () => {
    if (userId) {
      delete userActiveChatMap[userId];
    }
    delete socketActiveChatMap[socket.id];
  });

  socket.on("markAsRead", async ({ senderId, receiverId }) => {
    try {
      if (!senderId || !receiverId) return;
      const Message = (await import("../models/MessageModel.js")).default;
      const now = new Date();
      const sId = (senderId?._id || senderId).toString();
      const rId = (receiverId?._id || receiverId).toString();

      await Message.updateMany(
        { senderId: sId, receiverId: rId, status: { $ne: "read" } },
        { $set: { status: "read", readAt: now }, $addToSet: { readBy: rId } }
      );

      // Notify the sender
      const senderSids = getReceiverSocketIds(sId);
      senderSids.forEach((sid) => {
        io.to(sid).emit("messagesRead", {
          readerId: rId,
          otherId: sId,
          readAt: now,
        });
      });

      // Also notify receiver's other active devices/tabs
      const receiverSids = getReceiverSocketIds(rId);
      receiverSids.forEach((sid) => {
        if (sid !== socket.id) {
          io.to(sid).emit("messagesRead", {
            readerId: rId,
            otherId: sId,
            readAt: now,
          });
        }
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
      const gId = (groupId?._id || groupId).toString();
      const rId = (readerId?._id || readerId).toString();

      await Message.updateMany(
        { groupId: gId, senderId: { $ne: rId } },
        { $addToSet: { readBy: rId } }
      );
      const group = await Group.findById(gId).select("members");
      if (group && group.members) {
        group.members.forEach((mId) => {
          const sids = getReceiverSocketIds((mId?._id || mId).toString());
          sids.forEach((sid) => io.to(sid).emit("groupMessagesRead", { groupId: gId, readerId: rId }));
        });
      }
    } catch (e) {
      console.log("markGroupAsRead socket error:", e.message);
    }
  });

  socket.on("disconnect", () => {
    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) {
        delete userSocketMap[userId];
        delete userActiveChatMap[userId];
      }
    }
    delete socketActiveChatMap[socket.id];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
