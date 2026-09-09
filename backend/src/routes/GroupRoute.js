import express from "express";
import { protectRoute } from "../middleware/AuthMiddleware.js";
import {
  createGroup,
  getGroupsForUser,
  getGroupMessages,
  sendGroupMessage,
  updateGroup,
  addGroupMembers,
  deleteGroupConversation,
  leaveGroup,
  deleteGroup,
  markGroupMessagesAsRead,
} from "../controllers/GroupController.js";

const router = express.Router();

router.post("/", protectRoute, createGroup);
router.delete("/:id", protectRoute, deleteGroup);
router.get("/", protectRoute, getGroupsForUser);
router.get("/:id/messages", protectRoute, getGroupMessages);
router.post("/:id/send", protectRoute, sendGroupMessage);
router.post("/:id/read", protectRoute, markGroupMessagesAsRead);
router.post("/:id/update", protectRoute, updateGroup);
router.post("/:id/members", protectRoute, addGroupMembers);
router.post("/:id/leave", protectRoute, leaveGroup);
router.delete("/:id/conversation", protectRoute, deleteGroupConversation);

export default router;
