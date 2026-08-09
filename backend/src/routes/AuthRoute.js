import express from "express";
import {
  signup, login, logout, verifyOtp, resendOtp,
  forgotPassword, resetPassword,
  updateProfile, deleteAccount, checkAuth,
  changePassword, getOtpDebugStatus,
} from "../controllers/AuthContoller.js";
import { protectRoute } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.get("/debug-otp", getOtpDebugStatus);
router.post("/login", login);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.put("/update-profile", protectRoute, updateProfile);
router.put("/change-password", protectRoute, changePassword);
router.delete("/delete-account", protectRoute, deleteAccount);
router.get("/check", protectRoute, checkAuth);

export default router;