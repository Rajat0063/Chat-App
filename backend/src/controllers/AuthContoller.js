import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import Otp from "../models/OtpModel.js";
import { generateToken, generateOtp, getCookieOptions } from "../lib/utils.js";
import { sendOtpEmail, sendResetEmail } from "../lib/mailer.js";

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

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const code = generateOtp();

    const newUser = await User.create({
      fullName,
      email,
      password: hashed,
      isVerified: false,
      verificationOtp: code,
      verificationOtpExpires: expiresAt,
    });

    await Otp.deleteMany({ email, purpose: "verify", isUsed: false });
    const otpDoc = await Otp.create({
      email,
      code,
      purpose: "verify",
      isUsed: false,
      expiresAt,
    });

    console.log(`✅ [DB OTP STORED] OTP '${code}' stored in MongoDB (Collection: 'otps' [id: ${otpDoc._id}], User field: 'verificationOtp') for ${email}`);

    let mailResult;
    try {
      mailResult = await sendOtpEmail(email, code);
    } catch (e) {
      console.warn("Mail send warning (using fallback code logger):", e.message);
    }

    const responsePayload = {
      message: "Account created. Check your email for the verification code.",
      email: newUser.email,
      otpStoredInDb: true,
    };

    if (!process.env.MAIL_USER || mailResult?.previewUrl || process.env.NODE_ENV !== "production") {
      responsePayload.devOtp = code;
      if (mailResult?.previewUrl) responsePayload.previewUrl = mailResult.previewUrl;
    }

    res.status(201).json(responsePayload);
  } catch (err) {
    console.log("signup error:", err.message);
    if (err.code === 11000)
      return res.status(409).json({ message: "An account with this email already exists." });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, code } = req.body;
  try {
    if (!email || !code) return res.status(400).json({ message: "Email and code required" });

    let otp = await Otp.findOne({ email, code, purpose: "verify", isUsed: false });
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isValidInUser = user.verificationOtp === code && user.verificationOtpExpires && user.verificationOtpExpires > new Date();

    if (!otp && !isValidInUser) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    if (otp && otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "Verification code has expired" });
    }

    // Mark OTP as used in database rather than deleting so audit logs remain in DB
    if (otp) {
      otp.isUsed = true;
      otp.verifiedAt = new Date();
      await otp.save();
    }

    user.isVerified = true;
    user.verificationOtp = "";
    await user.save();

    console.log(`✅ [DB OTP VERIFIED] Account verified for ${email}. OTP record marked as used in MongoDB.`);

    const token = generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      isVerified: true,
      token,
    });
  } catch (err) {
    console.log("verifyOtp error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account with that email" });
    if (user.isVerified) return res.status(400).json({ message: "Account already verified" });

    await Otp.updateMany({ email, purpose: "verify", isUsed: false }, { isUsed: true });
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpDoc = await Otp.create({
      email,
      code,
      purpose: "verify",
      isUsed: false,
      expiresAt,
    });

    user.verificationOtp = code;
    user.verificationOtpExpires = expiresAt;
    await user.save();

    console.log(`✅ [DB OTP STORED] New OTP '${code}' saved in MongoDB for ${email}`);

    let mailResult;
    try {
      mailResult = await sendOtpEmail(email, code);
    } catch (e) {
      console.warn("Resend OTP warning:", e.message);
    }

    const responsePayload = { message: "A new code has been sent.", otpStoredInDb: true };
    if (!process.env.MAIL_USER || mailResult?.previewUrl || process.env.NODE_ENV !== "production") {
      responsePayload.devOtp = code;
      if (mailResult?.previewUrl) responsePayload.previewUrl = mailResult.previewUrl;
    }

    res.json(responsePayload);
  } catch (err) {
    console.log("resendOtp error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email first.", needsVerification: true, email: user.email });

    const token = generateToken(user._id, res);
    res.status(200).json({
      _id: user._id, fullName: user.fullName, email: user.email,
      profilePic: user.profilePic, isVerified: user.isVerified,
      token,
    });
  } catch (err) {
    console.log("login error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (_req, res) => {
  res.cookie("jwt", "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
  res.status(200).json({ message: "Logged out" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "If that email exists, a reset code has been sent." });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await Otp.updateMany({ email, purpose: "reset", isUsed: false }, { isUsed: true });
    await Otp.create({
      email,
      code,
      purpose: "reset",
      isUsed: false,
      expiresAt,
    });

    user.resetOtp = code;
    user.resetOtpExpires = expiresAt;
    await user.save();

    console.log(`✅ [DB RESET OTP STORED] Reset OTP '${code}' saved in MongoDB for ${email}`);

    let mailResult;
    try { mailResult = await sendResetEmail(email, code); }
    catch (e) { console.log(`[DEV] Reset code for ${email}: ${code}`); }

    const responsePayload = { message: "If that email exists, a reset code has been sent.", otpStoredInDb: true };
    if (!process.env.MAIL_USER || mailResult?.previewUrl || process.env.NODE_ENV !== "production") {
      responsePayload.devOtp = code;
      if (mailResult?.previewUrl) responsePayload.previewUrl = mailResult.previewUrl;
    }

    res.json(responsePayload);
  } catch (err) {
    console.log("forgotPassword error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, code, password } = req.body;
  try {
    if (!email || !code || !password)
      return res.status(400).json({ message: "Missing fields" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const record = await Otp.findOne({ email, code, purpose: "reset", isUsed: false });
    const user = await User.findOne({ email });

    const isValidUserReset = user && user.resetOtp === code && user.resetOtpExpires && user.resetOtpExpires > new Date();

    if (!record && !isValidUserReset) {
      return res.status(400).json({ message: "Reset code is invalid or expired" });
    }

    if (record && record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Reset code has expired" });
    }

    if (record) {
      record.isUsed = true;
      record.verifiedAt = new Date();
      await record.save();
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    if (user) {
      user.password = hashed;
      user.resetOtp = "";
      await user.save();
    }

    console.log(`✅ [DB RESET OTP VERIFIED] Password reset for ${email}. Marked as used in MongoDB.`);

    res.json({ message: "Password updated. You can sign in now." });
  } catch (err) {
    console.log("resetPassword error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getOtpDebugStatus = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email parameter required" });

    const [otpRecords, userDoc] = await Promise.all([
      Otp.find({ email }).sort({ createdAt: -1 }).limit(10),
      User.findOne({ email }).select("email isVerified verificationOtp verificationOtpExpires resetOtp resetOtpExpires"),
    ]);

    res.json({
      email,
      otpRecordsCount: otpRecords.length,
      otpRecordsInDb: otpRecords,
      userFieldOtpInDb: {
        verificationOtp: userDoc?.verificationOtp,
        verificationOtpExpires: userDoc?.verificationOtpExpires,
        resetOtp: userDoc?.resetOtp,
        resetOtpExpires: userDoc?.resetOtpExpires,
        isVerified: userDoc?.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.cookie("jwt", "", {
      ...getCookieOptions(),
      maxAge: 0,
    });
    res.json({ message: "Account deleted" });
  } catch (err) {
    console.log("deleteAccount error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try { res.status(200).json(req.user); }
  catch (err) { res.status(500).json({ message: "Internal server error" }); }
};

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
