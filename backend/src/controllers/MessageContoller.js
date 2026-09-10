import User from "../models/UserModel.js";
import Message from "../models/MessageModel.js";
import Group from "../models/GroupModel.js";
import { io, getReceiverSocketId, getReceiverSocketIds } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const me = req.user._id;
    const meStr = (me?._id || me)?.toString();
    const [users, meUser, unreadMessages] = await Promise.all([
      User.find({ _id: { $ne: me }, isVerified: true }).select("-password"),
      User.findById(me).select("blockedUsers"),
      Message.find({
        receiverId: { $in: [me, meStr] },
        seen: { $ne: true },
        deletedFor: { $nin: [me, meStr] },
      }),
    ]);

    const unreadCounts = {};
    (unreadMessages || []).forEach((m) => {
      const sId = (m.senderId?._id || m.senderId)?.toString();
      if (sId) {
        unreadCounts[sId] = (unreadCounts[sId] || 0) + 1;
      }
    });

    res.json({
      users,
      blockedUsers: meUser?.blockedUsers || [],
      unreadCounts,
    });
  } catch (err) {
    console.log("getUsersForSidebar:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: otherId } = req.params;
    const me = req.user._id;
    const meStr = (me?._id || me)?.toString();
    const otherIdStr = (otherId?._id || otherId)?.toString();
    const now = new Date();

    // Mark unread messages sent by otherId to me as seen
    await Message.updateMany(
      {
        senderId: { $in: [otherId, otherIdStr] },
        receiverId: { $in: [me, meStr] },
        seen: { $ne: true },
      },
      {
        $set: { seen: true, seenAt: now, status: "read", readAt: now },
        $addToSet: { seenBy: me },
      }
    );

    // Notify the sender in real-time that their messages were seen
    const senderSocketIds = getReceiverSocketIds(otherIdStr);
    if (senderSocketIds.length > 0) {
      senderSocketIds.forEach((sid) => {
        io.to(sid).emit("messagesRead", {
          readerId: meStr,
          readAt: now,
        });
      });
    }

    const messages = await Message.find({
      $and: [
        { deletedFor: { $nin: [me, meStr] } },
        { $or: [
          { senderId: { $in: [me, meStr] }, receiverId: { $in: [otherId, otherIdStr] } },
          { senderId: { $in: [otherId, otherIdStr] }, receiverId: { $in: [me, meStr] } },
        ] },
      ],
    })
      .populate("pinnedBy", "fullName profilePic")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.log("getMessages:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markMessagesSeen = async (req, res) => {
  try {
    const { id: otherId } = req.params;
    const me = req.user._id;
    const meStr = (me?._id || me)?.toString();
    const otherIdStr = (otherId?._id || otherId)?.toString();
    const now = new Date();

    const result = await Message.updateMany(
      {
        senderId: { $in: [otherId, otherIdStr] },
        receiverId: { $in: [me, meStr] },
        seen: { $ne: true },
      },
      {
        $set: { seen: true, seenAt: now, status: "read", readAt: now },
        $addToSet: { seenBy: me },
      }
    );

    // Realtime broadcast to sender
    const senderSocketIds = getReceiverSocketIds(otherIdStr);
    senderSocketIds.forEach((sid) => {
      io.to(sid).emit("messagesRead", {
        readerId: meStr,
        readAt: now,
      });
    });

    res.json({ success: true, modifiedCount: result?.modifiedCount || 0, seenAt: now });
  } catch (err) {
    console.log("markMessagesSeen:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    if (!text && !image)
      return res.status(400).json({ message: "Message is empty" });

    const [receiver, sender] = await Promise.all([
      User.findById(receiverId).select("blockedUsers"),
      User.findById(senderId).select("blockedUsers"),
    ]);

    if (!receiver) return res.status(404).json({ message: "Receiver not found" });
    if (receiver.blockedUsers.some((id) => id.equals(senderId))) {
      return res.status(403).json({ message: "You are blocked by this user." });
    }
    if (sender.blockedUsers.some((id) => id.equals(receiverId))) {
      return res.status(403).json({ message: "You have blocked this user." });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text || "",
      image: image || "",
      status: "sent",
    });

    const receiverSocketIds = getReceiverSocketIds(receiverId);
    const messageDelivered = receiverSocketIds.length > 0;
    const deliveredAt = new Date();
    if (messageDelivered) {
      newMessage.status = "delivered";
      newMessage.deliveredAt = deliveredAt;
      await Message.updateOne({ _id: newMessage._id }, {
        $set: { status: "delivered", deliveredAt },
      });
    }

    receiverSocketIds.forEach((sid) => io.to(sid).emit("newMessage", newMessage));

    const senderSocketIds = getReceiverSocketIds(senderId);
    senderSocketIds.forEach((sid) => {
      io.to(sid).emit("messagesDelivered", {
        receiverId: receiverId.toString(),
        deliveredAt,
      });
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.log("sendMessage:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const me = req.user._id;
    const { id: otherId } = req.params;
    if (me.equals(otherId)) return res.status(400).json({ message: "Cannot block yourself." });

    const meUser = await User.findById(me).select("blockedUsers");
    const alreadyBlocked = meUser.blockedUsers.some((id) => id.equals(otherId));

    if (alreadyBlocked) {
      meUser.blockedUsers = meUser.blockedUsers.filter((id) => !id.equals(otherId));
      await meUser.save();
      return res.json({ message: "User unblocked.", blockedUsers: meUser.blockedUsers });
    }

    meUser.blockedUsers.push(otherId);
    await meUser.save();
    res.json({ message: "User blocked.", blockedUsers: meUser.blockedUsers });
  } catch (err) {
    console.log("toggleBlockUser:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const me = req.user._id;
    const { id: otherId } = req.params;
    // Mark messages as deleted for the requesting user
    await Message.updateMany({
      $or: [
        { senderId: me, receiverId: otherId },
        { senderId: otherId, receiverId: me },
      ],
      deletedFor: { $ne: me },
    }, { $addToSet: { deletedFor: me } });

    // Remove messages that both users have deleted
    await Message.deleteMany({
      $or: [
        { senderId: me, receiverId: otherId },
        { senderId: otherId, receiverId: me },
      ],
      deletedFor: { $all: [me, otherId] },
    });

    res.json({ message: "Conversation removed for you." });
  } catch (err) {
    console.log("deleteConversation:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const togglePinMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { duration = "7d" } = req.body || {}; // "24h", "7d", "30d", "forever"
    const me = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Validate permission
    if (message.groupId) {
      const group = await Group.findById(message.groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      const isMember = group.members.some((m) => (m.equals ? m.equals(me) : m.toString() === me.toString()));
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this group." });
      }
    } else {
      const isSender = message.senderId?.equals ? message.senderId.equals(me) : message.senderId?.toString() === me.toString();
      const isReceiver = message.receiverId?.equals ? message.receiverId.equals(me) : message.receiverId?.toString() === me.toString();
      if (!isSender && !isReceiver) {
        return res.status(403).json({ message: "You cannot pin messages in this conversation." });
      }
    }

    const wasPinned = !!message.isPinned;
    if (wasPinned) {
      message.isPinned = false;
      message.pinnedAt = null;
      message.pinnedBy = null;
      message.pinDuration = null;
      message.pinExpiresAt = null;
    } else {
      message.isPinned = true;
      message.pinnedAt = new Date();
      message.pinnedBy = me;
      message.pinDuration = duration;

      let expiresAt = null;
      if (duration === "24h") {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else if (duration === "7d") {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else if (duration === "30d") {
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (duration === "forever") {
        expiresAt = null;
      } else {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      message.pinExpiresAt = expiresAt;
    }

    await message.save();

    const populatedMsg = await Message.findById(messageId)
      .populate("pinnedBy", "fullName profilePic")
      .populate("senderId", "fullName profilePic");

    const resultDoc = populatedMsg || message;

    const payload = {
      messageId: message._id.toString(),
      isPinned: message.isPinned,
      message: resultDoc,
      updatedMessage: resultDoc,
      pinnedBy: {
        _id: req.user._id,
        fullName: req.user.fullName,
        profilePic: req.user.profilePic,
      },
      groupId: message.groupId ? message.groupId.toString() : null,
    };

    if (message.groupId) {
      const group = await Group.findById(message.groupId);
      if (group && Array.isArray(group.members)) {
        group.members.forEach((memberId) => {
          const sids = getReceiverSocketIds(memberId.toString());
          sids.forEach((sid) => {
            io.to(sid).emit("messagePinUpdated", payload);
            io.to(sid).emit("messagePinned", resultDoc);
          });
        });
      }
    } else {
      const otherId = (message.senderId?.equals ? message.senderId.equals(me) : message.senderId?.toString() === me.toString())
        ? message.receiverId
        : message.senderId;

      if (otherId) {
        const receiverSids = getReceiverSocketIds(otherId.toString());
        receiverSids.forEach((sid) => {
          io.to(sid).emit("messagePinUpdated", payload);
          io.to(sid).emit("messagePinned", resultDoc);
        });
      }

      const mySids = getReceiverSocketIds(me.toString());
      mySids.forEach((sid) => {
        io.to(sid).emit("messagePinUpdated", payload);
        io.to(sid).emit("messagePinned", resultDoc);
      });
    }

    res.json({
      message: message.isPinned ? "Message pinned successfully." : "Message unpinned.",
      isPinned: message.isPinned,
      updatedMessage: resultDoc,
      data: resultDoc,
    });
  } catch (err) {
    console.error("togglePinMessage:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};