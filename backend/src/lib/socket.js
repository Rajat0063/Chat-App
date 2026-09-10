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

  socket.on("markSeen", ({ conversationWith, seenBy }) => {
    const now = new Date();
    const targetUserId = conversationWith?.toString();
    if (targetUserId) {
      const sids = getReceiverSocketIds(targetUserId);
      sids.forEach((sid) => {
        io.to(sid).emit("messagesSeen", {
          conversationWith: seenBy?.toString() || userId,
          seenBy: seenBy?.toString() || userId,
          seenAt: now,
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
