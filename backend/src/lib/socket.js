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

export const getReceiverSocketIds = (userId) => {
  if (!userId) return [];
  const idStr = (userId?._id || userId)?.toString();
  return Array.from(userSocketMap[idStr] || []);
};

export const getReceiverSocketId = (userId) => {
  if (!userId) return undefined;
  const idStr = (userId?._id || userId)?.toString();
  const ids = userSocketMap[idStr];
  return ids && ids.size ? Array.from(ids)[0] : undefined;
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = userSocketMap[userId] || new Set();
    userSocketMap[userId].add(socket.id);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typingStart", ({ type, receiverId, groupId, userName }) => {
    if (!userId) return;
    const senderId = userId.toString();

    if (type === "direct") {
      const targetId = receiverId?.toString();
      if (!targetId) return;
      const sids = getReceiverSocketIds(targetId);
      sids.forEach((sid) => {
        io.to(sid).emit("userTyping", {
          userId: senderId,
          conversationId: senderId,
          userName: userName || "Contact",
          type: "direct",
        });
      });
      return;
    }

    if (type === "group") {
      const targetGroupId = groupId?.toString();
      if (!targetGroupId) return;
      import("../models/GroupModel.js")
        .then(({ default: Group }) => Group.findById(targetGroupId))
        .then((group) => {
          if (!group || !Array.isArray(group.members)) return;
          group.members.forEach((memberId) => {
            const memberSocketIds = getReceiverSocketIds(memberId.toString());
            memberSocketIds.forEach((sid) => {
              io.to(sid).emit("userTyping", {
                userId: senderId,
                groupId: targetGroupId,
                conversationId: targetGroupId,
                userName: userName || "Member",
                type: "group",
              });
            });
          });
        })
        .catch(() => {});
    }
  });

  socket.on("typingStop", ({ type, receiverId, groupId }) => {
    if (!userId) return;
    const senderId = userId.toString();

    if (type === "direct") {
      const targetId = receiverId?.toString();
      if (!targetId) return;
      const sids = getReceiverSocketIds(targetId);
      sids.forEach((sid) => {
        io.to(sid).emit("userStopTyping", {
          userId: senderId,
          conversationId: senderId,
          type: "direct",
        });
      });
      return;
    }

    if (type === "group") {
      const targetGroupId = groupId?.toString();
      if (!targetGroupId) return;
      import("../models/GroupModel.js")
        .then(({ default: Group }) => Group.findById(targetGroupId))
        .then((group) => {
          if (!group || !Array.isArray(group.members)) return;
          group.members.forEach((memberId) => {
            const memberSocketIds = getReceiverSocketIds(memberId.toString());
            memberSocketIds.forEach((sid) => {
              io.to(sid).emit("userStopTyping", {
                userId: senderId,
                groupId: targetGroupId,
                conversationId: targetGroupId,
                type: "group",
              });
            });
          });
        })
        .catch(() => {});
    }
  });

  socket.on("markSeen", ({ conversationWith, seenBy }) => {
    const now = new Date();
    const targetUserId = conversationWith?.toString();
    if (targetUserId) {
      const sids = getReceiverSocketIds(targetUserId);
      sids.forEach((sid) => {
        io.to(sid).emit("messagesRead", {
          readerId: seenBy?.toString() || userId,
          readAt: now,
        });
      });
    }
  });

  socket.on("markAsRead", async ({ senderId, receiverId }) => {
    if (!senderId || !receiverId) return;
    const now = new Date();
    const senderIdStr = senderId.toString();
    const receiverIdStr = receiverId.toString();
    const { default: Message } = await import("../models/MessageModel.js");
    await Message.updateMany(
      {
        senderId: { $in: [senderId, senderIdStr] },
        receiverId: { $in: [receiverId, receiverIdStr] },
        status: { $ne: "read" },
      },
      {
        $set: { status: "read", readAt: now, seen: true, seenAt: now },
        $addToSet: { seenBy: receiverIdStr },
      }
    );

    const senderSocketIds = getReceiverSocketIds(senderIdStr);
    senderSocketIds.forEach((sid) => {
      io.to(sid).emit("messagesRead", {
        readerId: receiverIdStr,
        readAt: now,
      });
    });
  });

  socket.on("markGroupAsRead", async ({ groupId, readerId }) => {
    if (!groupId || !readerId) return;
    const now = new Date();
    const { default: Message } = await import("../models/MessageModel.js");
    await Message.updateMany(
      {
        groupId,
        senderId: { $ne: readerId },
        readBy: { $nin: [readerId] },
      },
      {
        $addToSet: { readBy: readerId },
        $set: { status: "read", readAt: now },
      }
    );

    const { default: Group } = await import("../models/GroupModel.js");
    const group = await Group.findById(groupId).catch(() => null);
    if (group) {
      group.members.forEach((memberId) => {
        const memberSocketIds = getReceiverSocketIds(memberId.toString());
        memberSocketIds.forEach((sid) => {
          io.to(sid).emit("groupMessagesRead", {
            groupId: groupId.toString(),
            readerId,
            readAt: now,
          });
        });
      });
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
