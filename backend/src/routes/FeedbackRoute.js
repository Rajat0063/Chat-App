import express from "express";
import { submitFeedback, getMyFeedback } from "../controllers/FeedbackContoller.js";
import { protectRoute } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/submit", protectRoute, submitFeedback);
router.get("/my", protectRoute, getMyFeedback);

export default router;
