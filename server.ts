import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

import { connectDB } from "./server/lib/db.js";
import authRoutes from "./server/routes/AuthRoute.js";
import messageRoutes from "./server/routes/MessageRoute.js";
import groupRoutes from "./server/routes/GroupRoute.js";
import { app, server } from "./server/lib/socket.js";

dotenv.config();

const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
}));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

// Error middleware for Mongo/DB offline fallback
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.name === "MongooseError" || err?.name === "MongoNetworkError" || err?.message?.includes("buffering timed out")) {
    console.warn("[AI Studio] Database query failed — MongoDB is offline or disconnected.");
    if (req.method === "GET") {
      return res.json(req.path.endsWith("s") || req.path.endsWith("s/") ? [] : {});
    }
    return res.status(503).json({ message: "Service temporarily unavailable — MongoDB is offline." });
  }
  next(err);
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Chatty Server running on http://0.0.0.0:${PORT}`);
    connectDB();
  });
}

start();
