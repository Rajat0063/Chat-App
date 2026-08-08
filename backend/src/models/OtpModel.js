import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email:  { type: String, required: true, lowercase: true, trim: true, index: true },
    code:   { type: String, required: true },
    purpose:{ type: String, enum: ["verify", "reset"], default: "verify" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);