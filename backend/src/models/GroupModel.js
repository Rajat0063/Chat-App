import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  joinRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
    requestedAt: { type: Date, default: Date.now },
  }],
  avatar: { type: String, default: "" },
  description: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Group", groupSchema);
