import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    about:    { type: String, default: "Hey there! I am using Chatty." },
    lastSeen: { type: Date, default: () => new Date() },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    verificationOtp: { type: String, default: "" },
    verificationOtpExpires: { type: Date },
    resetOtp: { type: String, default: "" },
    resetOtpExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);