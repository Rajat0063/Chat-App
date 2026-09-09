import mongoose from "mongoose";
import { createBridgeModel } from "./modelBridge.js";
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
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const MongooseMessage = mongoose.models.Message || mongoose.model("Message", messageSchema);
export default createBridgeModel(MongooseMessage, createMemoryModel("messages"));
