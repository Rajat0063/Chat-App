import User from "../models/UserModel.js";
import Message from "../models/MessageModel.js";
import { io, getReceiverSocketId, getReceiverSocketIds, isUserInConversation } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const me = req.user._id;
    const [users, meUser] = await Promise.all([
      User.find({ _id: { $ne: me }, isVerified: true }).select("-password"),
      User.findById(me).select("blockedUsers"),
    ]);
    res.json({ users, blockedUsers: meUser?.blockedUsers || [] });
  } catch (err) {
    console.log("getUsersForSidebar:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: otherId } = req.params;
    const me = req.user._id;

    // Automatically mark all unread messages from otherId to me as read
    const now = new Date();
    await Message.updateMany(
      {
        senderId: otherId,
        receiverId: me,
        status: { $ne: "read" },
      },
      {
        $set: { status: "read", readAt: now },
        $addToSet: { readBy: me },
      }
    );

    // Notify the other user in real-time that their messages were read
    const senderSocketIds = getReceiverSocketIds(otherId.toString());
    senderSocketIds.forEach((sid) => {
      io.to(sid).emit("messagesRead", {
        readerId: me.toString(),
        otherId: otherId.toString(),
        readAt: now,
      });
    });

    const messages = await Message.find({
      $and: [
        { deletedFor: { $nin: [me] } },
        { $or: [
          { senderId: me, receiverId: otherId },
          { senderId: otherId, receiverId: me },
        ] },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.log("getMessages:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: otherId } = req.params;
    const me = req.user._id;
    const now = new Date();

    await Message.updateMany(
      {
        senderId: otherId,
        receiverId: me,
        status: { $ne: "read" },
      },
      {
        $set: { status: "read", readAt: now },
        $addToSet: { readBy: me },
      }
    );

    const senderSocketIds = getReceiverSocketIds(otherId.toString());
    senderSocketIds.forEach((sid) => {
      io.to(sid).emit("messagesRead", {
        readerId: me.toString(),
        otherId: otherId.toString(),
        readAt: now,
      });
    });

    res.json({ success: true, message: "Messages marked as read" });
  } catch (err) {
    console.log("markMessagesAsRead:", err.message);
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

    const sId = senderId.toString();
    const rId = receiverId.toString();
    const receiverSocketIds = getReceiverSocketIds(rId);
    const isReceiverOnline = receiverSocketIds.length > 0;
    const isReceiverInChat = isUserInConversation(rId, sId, "direct");

    const now = new Date();
    let status = "sent";
    let deliveredAt = null;
    let readAt = null;
    const readBy = [senderId];

    if (isReceiverInChat) {
      status = "read";
      deliveredAt = now;
      readAt = now;
      readBy.push(receiverId);
    } else if (isReceiverOnline) {
      status = "delivered";
      deliveredAt = now;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text || "",
      image: image || "",
      status,
      deliveredAt,
      readAt,
      readBy,
    });

    receiverSocketIds.forEach((sid) => {
      io.to(sid).emit("newMessage", newMessage);
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