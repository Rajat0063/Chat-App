import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    text:  { type: String, default: "" },
    image: { type: String, default: "" }, // base64 data URL stored in MongoDB
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);