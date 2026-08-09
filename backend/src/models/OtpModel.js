import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email:     { type: String, required: true, lowercase: true, trim: true, index: true },
    code:      { type: String, required: true },
    purpose:   { type: String, enum: ["verify", "reset"], default: "verify" },
    isUsed:    { type: Boolean, default: false },
    verifiedAt:{ type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 }); // Keep record in DB for 24 hours after expiry for audit/db logs

export default mongoose.model("Otp", otpSchema);