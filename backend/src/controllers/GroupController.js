import Group from "../models/GroupModel.js";
import Message from "../models/MessageModel.js";
import User from "../models/UserModel.js";
import { io, getReceiverSocketId, getReceiverSocketIds, isUserInConversation } from "../lib/socket.js";

export const createGroup = async (req, res) => {
  try {
    const owner = req.user._id;
    const { name, members = [], avatar, description = "" } = req.body;
    const uniqueMembers = Array.from(new Set([...(members || []), owner.toString()]));
    const group = await Group.create({ name, owner, members: uniqueMembers, avatar: avatar || "", description });

    // notify online members about new group (optional)
    uniqueMembers.forEach((memberId) => {
      const socketIds = getReceiverSocketIds(memberId);
      socketIds.forEach((sid) => io.to(sid).emit("newGroup", group));
    });

    res.status(201).json(group);
  } catch (err) {
    console.log("createGroup:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupsForUser = async (req, res) => {
  try {
    const me = req.user._id;
    const meStr = (me?._id || me)?.toString();

    const groups = await Group.find({
      members: { $in: [me, meStr] },
    })
      .populate("members", "fullName profilePic")
      .populate("owner", "fullName profilePic");

    const groupIds = groups.map((group) => group._id);
    const unreadGroupMessages = await Message.find({
      groupId: { $in: groupIds },
      senderId: { $nin: [me, meStr] },
      seenBy: { $nin: [me, meStr] },
      deletedFor: { $nin: [me, meStr] },
    });

    const unreadCounts = {};
    unreadGroupMessages.forEach((message) => {
      const groupId = (message.groupId?._id || message.groupId)?.toString();
      if (groupId) unreadCounts[groupId] = (unreadCounts[groupId] || 0) + 1;
    });

    res.json({ groups, unreadCounts });
  } catch (err) {
    console.log("getGroupsForUser:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const me = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some((m) => m.equals(me))) return res.status(403).json({ message: "Not a group member" });

    const now = new Date();
    await Message.updateMany(
      { groupId, senderId: { $ne: me } },
      {
        $set: { seen: true, seenAt: now },
        $addToSet: { readBy: me, seenBy: me },
      }
    );

    // Notify group members
    group.members.forEach((memberId) => {
      const sids = getReceiverSocketIds(memberId.toString());
      sids.forEach((sid) => io.to(sid).emit("groupMessagesRead", {
        groupId,
        readerId: me.toString(),
        seenAt: now,
      }));
    });

    const messages = await Message.find({ groupId, deletedFor: { $nin: [me] } })
      .populate("senderId", "fullName profilePic")
      .populate("pinnedBy", "fullName profilePic")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.log("getGroupMessages:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markGroupMessagesAsRead = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const me = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some((memberId) => memberId.equals(me))) {
      return res.status(403).json({ message: "Not a group member" });
    }

    const now = new Date();
    await Message.updateMany(
      { groupId, senderId: { $ne: me } },
      {
        $set: { seen: true, seenAt: now },
        $addToSet: { readBy: me, seenBy: me },
      }
    );

    group.members.forEach((memberId) => {
      const sids = getReceiverSocketIds(memberId.toString());
      sids.forEach((sid) => io.to(sid).emit("groupMessagesRead", {
        groupId,
        readerId: me.toString(),
        seenAt: now,
      }));
    });

    res.json({ success: true });
  } catch (err) {
    console.log("markGroupMessagesAsRead:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markGroupMessagesSeen = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const me = req.user._id;
    const meStr = (me?._id || me)?.toString();
    const group = await Group.findById(groupId).select("members");
    if (!group) return res.status(404).json({ message: "Group not found" });
    const isMember = Array.isArray(group.members) && group.members.some((memberId) => {
      const memberStr = (memberId?._id || memberId)?.toString();
      return memberStr === meStr;
    });
    if (!isMember) {
      return res.status(403).json({ message: "Not a group member" });
    }

    const seenAt = new Date();
    await Message.updateMany(
      { groupId, senderId: { $nin: [me, meStr] } },
      {
        $set: { seen: true, seenAt },
        $addToSet: { readBy: me, seenBy: me },
      }
    );

    group.members.forEach((memberId) => {
      const memberStr = (memberId?._id || memberId)?.toString();
      if (memberStr === meStr) return;
      getReceiverSocketIds(memberStr).forEach((sid) => {
        io.to(sid).emit("groupMessagesSeen", {
          groupId: groupId.toString(),
          seenBy: meStr,
          seenAt,
        });
      });
    });

    res.json({ success: true, groupId, seenAt });
  } catch (err) {
    console.log("markGroupMessagesSeen:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { name, avatar, description } = req.body;
    const me = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.owner.equals(me)) return res.status(403).json({ message: "Only the group owner can update name or avatar" });

    if (typeof name === "string" && name.trim().length) group.name = name.trim();
    if (typeof avatar === "string" && avatar.length) group.avatar = avatar;
    if (typeof description === "string") group.description = description;
    await group.save();

    const updated = await Group.findById(groupId)
      .populate("members", "fullName profilePic")
      .populate("owner", "fullName profilePic");

    // Notify online group members about the updated group data.
    updated.members.forEach((member) => {
      const memberId = typeof member === "string" ? member : member._id?.toString();
      const sid = getReceiverSocketId(memberId);
      if (sid) io.to(sid).emit("groupUpdated", updated);
    });

    res.json(updated);
  } catch (err) {
    console.log("updateGroup:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { members } = req.body;
    const me = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some((m) => m.equals(me))) return res.status(403).json({ message: "Not a group member" });

    if (!Array.isArray(members) || members.length === 0)
      return res.status(400).json({ message: "No members provided" });

    const normalized = [...new Set(members.map((id) => id.toString()))];
    group.members = Array.from(new Set([...group.members.map((m) => m.toString()), ...normalized]));
    await group.save();

    const updated = await Group.findById(groupId)
      .populate("members", "fullName profilePic")
      .populate("owner", "fullName profilePic");
    res.json(updated);
  } catch (err) {
    console.log("addGroupMembers:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroupConversation = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const me = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some((m) => m.equals(me))) return res.status(403).json({ message: "Not a group member" });

    await Message.updateMany({ groupId, deletedFor: { $ne: me } }, { $addToSet: { deletedFor: me } });
    res.json({ message: "Group conversation cleared for you." });
  } catch (err) {
    console.log("deleteGroupConversation:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;
    if (!text && !image) return res.status(400).json({ message: "Message is empty" });

    const group = await Group.findById(groupId).select("members");
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some((m) => m.equals(senderId))) return res.status(403).json({ message: "Not a group member" });

    const otherMembers = group.members.filter((m) => !m.equals(senderId));
    const now = new Date();
    const readBy = [senderId];
    let anyOtherOnline = false;

    otherMembers.forEach((m) => {
      const mId = (m?._id || m).toString();
      if (getReceiverSocketIds(mId).length > 0) {
        anyOtherOnline = true;
      }
      if (isUserInConversation(mId, groupId.toString(), "group")) {
        readBy.push(m);
      }
    });

    let status = "sent";
    let deliveredAt = null;
    let readAt = null;

    if (readBy.length > 1) {
      status = "read";
      deliveredAt = now;
      readAt = now;
    } else if (anyOtherOnline) {
      status = "delivered";
      deliveredAt = now;
    }

    let newMessage = await Message.create({
      senderId,
      receiverId: null,
      text: text || "",
      image: image || "",
      groupId,
      status,
      deliveredAt,
      readAt,
      readBy,
    });
    newMessage = await newMessage.populate("senderId", "fullName profilePic");

    // emit to all online group members
    group.members.forEach((memberId) => {
      const sids = getReceiverSocketIds(memberId.toString());
      sids.forEach((sid) => io.to(sid).emit("newGroupMessage", newMessage));
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.log("sendGroupMessage:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const me = req.user._id;
    const { id: groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // remove member
    group.members = group.members.filter((m) => !m.equals(me));

    // if no members left, delete group
    if (group.members.length === 0) {
      // notify any (now empty) members nothing to notify, delete and return
      await Group.deleteOne({ _id: groupId });
      return res.json({ message: "Group removed" });
    }

    // if owner left, set new owner to first member
    if (group.owner.equals(me)) group.owner = group.members[0];

    await group.save();
    // notify remaining members about updated group
    const updated = await Group.findById(groupId)
      .populate("members", "fullName profilePic")
      .populate("owner", "fullName profilePic");
    updated.members.forEach((member) => {
      const memberId = typeof member === "string" ? member : member._id?.toString();
      const sid = getReceiverSocketId(memberId);
      if (sid) io.to(sid).emit("groupUpdated", updated);
    });

    res.json({ message: "Left group" });
  } catch (err) {
    console.log("leaveGroup:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const me = req.user._id;
    const { id: groupId } = req.params;
    const group = await Group.findById(groupId).populate("members", "_id");
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.owner.equals(me)) return res.status(403).json({ message: "Only the group owner can delete the group" });

    // notify members that the group was deleted
    (group.members || []).forEach((member) => {
      const memberId = typeof member === "string" ? member : member._id?.toString();
      const sid = getReceiverSocketId(memberId);
      if (sid) io.to(sid).emit("groupDeleted", groupId);
    });

    await Group.deleteOne({ _id: groupId });
    res.json({ message: "Group deleted" });
  } catch (err) {
    console.log("deleteGroup:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
