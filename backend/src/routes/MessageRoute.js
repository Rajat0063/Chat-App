import express from "express";
import { protectRoute } from "../middleware/AuthMiddleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  toggleBlockUser,
  deleteConversation,
} from "../controllers/MessageContoller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/block/:id", protectRoute, toggleBlockUser);
router.delete("/conversation/:id", protectRoute, deleteConversation);

export default router;