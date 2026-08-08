import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import Otp from "../models/OtpModel.js";
import { generateToken, generateOtp } from "../lib/utils.js";
import { sendOtpEmail, sendResetEmail } from "../lib/mailer.js";

/* ---------- Signup: create OTP, send email ---------- */
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password)
      return res.status(400).json({ message: "All fields are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "An account with this email already exists. Please sign in instead." });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName, email, password: hashed, isVerified: false,
    });

    // create + email OTP
    await Otp.deleteMany({ email, purpose: "verify" });
    const code = generateOtp();
    await Otp.create({
      email,
      code,
      purpose: "verify",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
      await sendOtpEmail(email, code);
    } catch (e) {
      await User.findByIdAndDelete(newUser._id);
      await Otp.deleteMany({ email, purpose: "verify" });
      console.error("Mail send failed:", e.message);
      return res.status(500).json({ message: "Failed to send verification email. Please try again later." });
    }

    res.status(201).json({
      message: "Account created. Check your email for the verification code.",
      email: newUser.email,
    });
  } catch (err) {
    console.log("signup error:", err.message);
    if (err.code === 11000)
      return res.status(409).json({ message: "An account with this email already exists." });
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------- Verify OTP, then auto-login ---------- */
export const verifyOtp = async (req, res) => {
  const { email, code } = req.body;
  try {
    if (!email || !code) return res.status(400).json({ message: "Email and code required" });
    const otp = await Otp.findOne({ email, code, purpose: "verify" });
    if (!otp) return res.status(400).json({ message: "Invalid or expired code" });
    if (otp.expiresAt < new Date()) {
      await otp.deleteOne();
      return res.status(400).json({ message: "Code has expired" });
    }

    const user = await User.findOneAndUpdate(
      { email }, { isVerified: true }, { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await Otp.deleteMany({ email, purpose: "verify" });
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      isVerified: true,
    });
  } catch (err) {
    console.log("verifyOtp error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------- Resend OTP ---------- */
export const resendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account with that email" });
    if (user.isVerified) return res.status(400).json({ message: "Account already verified" });

    await Otp.deleteMany({ email, purpose: "verify" });
    const code = generateOtp();
    await Otp.create({
      email, code, purpose: "verify",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    try {
      await sendOtpEmail(email, code);
      res.json({ message: "A new code has been sent." });
    } catch (e) {
      console.error("Resend OTP mail failed:", e.message);
      return res.status(500).json({ message: "Failed to send verification email. Please try again later." });
    }
  } catch (err) {
    console.log("resendOtp error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------- Login ---------- */
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email first.", needsVerification: true, email: user.email });

    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id, fullName: user.fullName, email: user.email,
      profilePic: user.profilePic, isVerified: user.isVerified,
    });
  } catch (err) {
    console.log("login error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------- Logout ---------- */
export const logout = (_req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out" });
};

/* ---------- Forgot password: send reset code ---------- */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    // respond the same way to avoid email enumeration
    if (!user) return res.json({ message: "If that email exists, a reset code has been sent." });

    const code = generateOtp();
    await Otp.deleteMany({ email, purpose: "reset" });
    await Otp.create({
      email, code, purpose: "reset",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const clientUrl =
      process.env.CLIENT_URL || req.get("origin") || "http://localhost:5173";
    const normalizedUrl = clientUrl.replace(/\/+$/, "");
    const link = `${normalizedUrl}/reset-password?email=${encodeURIComponent(email)}`;
    try { await sendResetEmail(email, code, link); }
    catch (e) { console.log(`[DEV] Reset code for ${email}: ${code}`); }

    res.json({ message: "If that email exists, a reset code has been sent." });
  } catch (err) {
    console.log("forgotPassword error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------- Reset password ---------- */
export const resetPassword = async (req, res) => {
  const { email, code, password } = req.body;
  try {
    if (!email || !code || !password)
      return res.status(400).json({ message: "Missing fields" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const record = await Otp.findOne({ email, code, purpose: "reset" });
    if (!record || record.expiresAt < new Date())
      return res.status(400).json({ message: "Reset code is invalid or expired" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    await User.findOneAndUpdate({ email }, { password: hashed });
    await Otp.deleteMany({ email, purpose: "reset" });

    res.json({ message: "Password updated. You can sign in now." });
  } catch (err) {
    console.log("resetPassword error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------- Update profile (avatar + name only; NOT email) ---------- */
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName } = req.body;
    const update = {};
    if (typeof profilePic === "string" && profilePic.length) update.profilePic = profilePic;
    if (typeof fullName === "string" && fullName.trim().length) update.fullName = fullName.trim();
    if (!Object.keys(update).length)
      return res.status(400).json({ message: "Nothing to update" });

    const updated = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("-password");
    res.json(updated);
  } catch (err) {
    console.log("updateProfile error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------- Delete account ---------- */
export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.cookie("jwt", "", { maxAge: 0 });
    res.json({ message: "Account deleted" });
  } catch (err) {
    console.log("deleteAccount error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------- Check auth (re-hydrate on refresh) ---------- */
export const checkAuth = (req, res) => {
  try { res.status(200).json(req.user); }
  catch (err) { res.status(500).json({ message: "Internal server error" }); }
};

/* ---------- Change password (authenticated) ---------- */
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Missing fields" });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    console.log("changePassword error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};