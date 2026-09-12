import mongoose from "mongoose";
import { createBridgeModel } from "./ModelBridge.js";
import { createMemoryModel } from "../lib/memoryStore.js";

const messageSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    text:  { type: String, default: "" },
    image: { type: String, default: "" }, // base64 data URL stored in MongoDB
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    readAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    seen: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: { type: Object, default: {} },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date, default: null },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    pinDuration: { type: String, default: null },
    pinExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const MongooseMessage = mongoose.models.Message || mongoose.model("Message", messageSchema);
export default createBridgeModel(MongooseMessage, createMemoryModel("messages"));
