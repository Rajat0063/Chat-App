import express from "express";
import { protectRoute } from "../middleware/AuthMiddleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  toggleBlockUser,
  deleteConversation,
  togglePinMessage,
  markMessagesSeen,
  toggleMessageReaction,
} from "../controllers/MessageContoller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/block/:id", protectRoute, toggleBlockUser);
router.delete("/conversation/:id", protectRoute, deleteConversation);
router.post("/pin/:id", protectRoute, togglePinMessage);
router.post("/reaction/:id", protectRoute, toggleMessageReaction);
router.post("/mark-seen/:id", protectRoute, markMessagesSeen);

export default router;