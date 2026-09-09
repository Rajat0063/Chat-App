import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const toIdStr = (id) => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (id._id) return toIdStr(id._id);
  if (id.val) return String(id.val);
  if (typeof id.toString === "function" && id.toString() !== "[object Object]") return id.toString();
  return String(id);
};

const appendUniqueMessage = (messages, nextMessage) => {
  if (!nextMessage) return messages;
  const list = Array.isArray(messages) ? messages : [];

  const nextId = toIdStr(nextMessage._id);
  const nextTempId = toIdStr(nextMessage.clientTempId);

  const existsIndex = list.findIndex((m) => {
    const mId = toIdStr(m._id);
    const mTempId = toIdStr(m.clientTempId);

    if (nextId && mId === nextId) return true;
    if (nextTempId && (mTempId === nextTempId || mId === nextTempId)) return true;
    if (mTempId && nextId && mTempId === nextId) return true;

    // Strict deduplication for duplicate text sent by same user within 3 seconds
    if (m.text && nextMessage.text && m.text.trim() === nextMessage.text.trim()) {
      const mSender = toIdStr(m.senderId);
      const nSender = toIdStr(nextMessage.senderId);
      if (mSender && nSender && mSender === nSender) {
        const timeDiff = Math.abs(new Date(m.createdAt || Date.now()).getTime() - new Date(nextMessage.createdAt || Date.now()).getTime());
        if (timeDiff < 3000) return true;
      }
    }
    return false;
  });

  if (existsIndex >= 0) {
    const updated = [...list];
    const existing = updated[existsIndex];

    // Preserve status progression: sent -> delivered -> read (never downgrade)
    let finalStatus = nextMessage.status || existing.status || "sent";
    if (existing.status === "read") {
      finalStatus = "read";
    } else if (existing.status === "delivered" && nextMessage.status === "sent") {
      finalStatus = "delivered";
    }

    const existingReadBy = Array.isArray(existing.readBy) ? existing.readBy.map(toIdStr) : [];
    const nextReadBy = Array.isArray(nextMessage.readBy) ? nextMessage.readBy.map(toIdStr) : [];
    const combinedReadBy = Array.from(new Set([...existingReadBy, ...nextReadBy]));

    updated[existsIndex] = {
      ...existing,
      ...nextMessage,
      status: finalStatus,
      readAt: nextMessage.readAt || existing.readAt,
      deliveredAt: nextMessage.deliveredAt || existing.deliveredAt,
      readBy: combinedReadBy,
      isSending: false,
    };
    return updated;
  }

  return [...list, { ...nextMessage, isSending: false }];
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedUser: null,
  selectedGroup: null,
  blockedUsers: [],
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      const nextUsers = Array.isArray(res.data?.users) ? res.data.users : (Array.isArray(res.data) ? res.data : []);
      const nextBlockedUsers = (Array.isArray(res.data?.blockedUsers) ? res.data.blockedUsers : []).map((id) => id.toString());
      const currentSelectedUser = get().selectedUser;

      set({
        users: nextUsers,
        blockedUsers: nextBlockedUsers,
        selectedUser: currentSelectedUser && nextUsers.some((u) => u._id === currentSelectedUser._id)
          ? currentSelectedUser
          : nextUsers.length ? nextUsers[0] : null,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load users");
      set({ users: [] });
    } finally { set({ isUsersLoading: false }); }
  },

  getGroups: async () => {
    try {
      const res = await axiosInstance.get("/groups");
      const groupsData = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.groups) ? res.data.groups : []);
      set({ groups: groupsData });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load groups");
      set({ groups: [] });
    }
  },

  createGroup: async (payload) => {
    try {
      const res = await axiosInstance.post("/groups", payload);
      const currentGroups = Array.isArray(get().groups) ? get().groups : [];
      set({ groups: [...currentGroups, res.data], selectedGroup: res.data, selectedUser: null });
      await get().getGroups();
      const refreshed = (Array.isArray(get().groups) ? get().groups : []).find((g) => g._id === res.data._id);
      if (refreshed) set({ selectedGroup: refreshed });
      toast.success("Group created");
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create group");
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.messages) ? res.data.messages : []) });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load messages");
      set({ messages: [] });
    } finally { set({ isMessagesLoading: false }); }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ messages: Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.messages) ? res.data.messages : []) });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load messages");
      set({ messages: [] });
    } finally { set({ isMessagesLoading: false }); }
  },

  updateGroup: async (groupId, payload) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/update`, payload);
      const currentGroups = Array.isArray(get().groups) ? get().groups : [];
      const groups = currentGroups.map((group) => group._id === groupId ? res.data : group);
      set({ groups, selectedGroup: res.data });
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update group");
    }
  },

  addGroupMembers: async (groupId, memberIds) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { members: memberIds });
      const currentGroups = Array.isArray(get().groups) ? get().groups : [];
      const groups = currentGroups.map((group) => group._id === groupId ? res.data : group);
      set({ groups, selectedGroup: res.data });
      toast.success("Members added");
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add members");
    }
  },

  deleteGroupConversation: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}/conversation`);
      set({ messages: [] });
      toast.success("Group conversation cleared");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to clear conversation");
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, selectedGroup, messages } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;

    const clientTempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tempMessage = {
      _id: clientTempId,
      clientTempId,
      senderId: authUser._id,
      receiverId: selectedUser?._id,
      groupId: selectedGroup?._id,
      text: messageData.text || "",
      image: messageData.image || "",
      createdAt: new Date().toISOString(),
      isSending: true,
    };

    set({ messages: appendUniqueMessage(messages, tempMessage) });

    try {
      if (selectedGroup) {
        const res = await axiosInstance.post(`/groups/${selectedGroup._id}/send`, { ...messageData, clientTempId });
        set({ messages: appendUniqueMessage(get().messages, { ...res.data, clientTempId }) });
      } else if (selectedUser) {
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, { ...messageData, clientTempId });
        set({ messages: appendUniqueMessage(get().messages, { ...res.data, clientTempId }) });
      }
    } catch (err) {
      set({ messages: get().messages.filter((m) => m._id !== clientTempId && m.clientTempId !== clientTempId) });
      toast.error(err?.response?.data?.message || "Failed to send");
    }
  },

  toggleBlockUser: async () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    try {
      const res = await axiosInstance.post(`/messages/block/${selectedUser._id}`);
      set({ blockedUsers: res.data.blockedUsers || get().blockedUsers });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update block status");
    }
  },

  deleteConversation: async () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    try {
      await axiosInstance.delete(`/messages/conversation/${selectedUser._id}`);
      set({ messages: [] });
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete conversation");
    }
  },

  markMessagesAsRead: async (userId) => {
    if (!userId) return;
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const cleanUserId = toIdStr(userId);
    const cleanAuthUserId = toIdStr(authUser?._id);

    if (socket && socket.connected && cleanAuthUserId) {
      socket.emit("markAsRead", { senderId: cleanUserId, receiverId: cleanAuthUserId });
    }
    try {
      await axiosInstance.post(`/messages/read/${cleanUserId}`);
    } catch {}
  },

  markGroupMessagesAsRead: async (groupId) => {
    if (!groupId) return;
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const cleanGroupId = toIdStr(groupId);
    const cleanAuthUserId = toIdStr(authUser?._id);

    if (socket && socket.connected && cleanAuthUserId) {
      socket.emit("markGroupAsRead", { groupId: cleanGroupId, readerId: cleanAuthUserId });
    }
    try {
      await axiosInstance.post(`/groups/${cleanGroupId}/read`);
    } catch {}
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      const selected = get().selectedUser;
      if (!selected) return;
      const sSelectedId = toIdStr(selected._id);
      const msgSenderId = toIdStr(newMessage.senderId);
      const msgReceiverId = toIdStr(newMessage.receiverId);
      const authUser = useAuthStore.getState().authUser;
      const myId = toIdStr(authUser?._id);

      const isFromSelected = msgSenderId === sSelectedId && msgReceiverId === myId;
      const isFromMe = msgSenderId === myId && msgReceiverId === sSelectedId;

      if (!isFromSelected && !isFromMe) return;

      set({ messages: appendUniqueMessage(get().messages, newMessage) });

      // Automatically mark as read since recipient is currently actively looking at this conversation
      if (isFromSelected && myId) {
        socket.emit("markAsRead", { senderId: sSelectedId, receiverId: myId });
        try { axiosInstance.post(`/messages/read/${sSelectedId}`); } catch {}
      }
    });

    socket.off("messagesRead");
    socket.on("messagesRead", ({ readerId, readAt }) => {
      const currentSelected = get().selectedUser;
      const authUser = useAuthStore.getState().authUser;
      if (!currentSelected || !authUser) return;

      const cId = toIdStr(currentSelected._id);
      const rId = toIdStr(readerId);
      if (cId !== rId) return;

      const myId = toIdStr(authUser._id);
      const updatedMessages = get().messages.map((m) => {
        const mSender = toIdStr(m.senderId);
        if (mSender === myId) {
          return { ...m, status: "read", readAt: readAt || m.readAt || new Date().toISOString() };
        }
        return m;
      });
      set({ messages: updatedMessages });
    });

    socket.off("messagesDelivered");
    socket.on("messagesDelivered", ({ receiverId, deliveredAt }) => {
      const currentSelected = get().selectedUser;
      const authUser = useAuthStore.getState().authUser;
      if (!currentSelected || !authUser) return;

      const cId = toIdStr(currentSelected._id);
      const rId = toIdStr(receiverId);
      if (cId !== rId) return;

      const myId = toIdStr(authUser._id);
      const updatedMessages = get().messages.map((m) => {
        const mSender = toIdStr(m.senderId);
        if (mSender === myId && m.status === "sent") {
          return { ...m, status: "delivered", deliveredAt: deliveredAt || m.deliveredAt || new Date().toISOString() };
        }
        return m;
      });
      set({ messages: updatedMessages });
    });
  },

  subscribeToGroupMessages: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newGroupMessage");
    socket.on("newGroupMessage", (newMessage) => {
      const selected = get().selectedGroup;
      if (!selected) return;
      const currentGroupId = toIdStr(selected._id);
      const msgGroupId = toIdStr(newMessage.groupId);
      if (currentGroupId !== msgGroupId) return;

      set({ messages: appendUniqueMessage(get().messages, newMessage) });

      const authUser = useAuthStore.getState().authUser;
      const myId = toIdStr(authUser?._id);
      const msgSenderId = toIdStr(newMessage.senderId);

      if (myId && msgSenderId !== myId) {
        socket.emit("markGroupAsRead", { groupId: currentGroupId, readerId: myId });
        try { axiosInstance.post(`/groups/${currentGroupId}/read`); } catch {}
      }
    });

    socket.off("groupMessagesRead");
    socket.on("groupMessagesRead", ({ groupId, readerId }) => {
      const currentGroup = get().selectedGroup;
      if (!currentGroup) return;
      const currentGroupId = toIdStr(currentGroup._id);
      const evGroupId = toIdStr(groupId);
      if (currentGroupId !== evGroupId) return;

      const rId = toIdStr(readerId);
      const updatedMessages = get().messages.map((m) => {
        const readBy = Array.isArray(m.readBy) ? m.readBy : [];
        if (!readBy.some((id) => toIdStr(id) === rId)) {
          const newReadBy = [...readBy, readerId];
          return { ...m, readBy: newReadBy, status: newReadBy.length > 1 ? "read" : m.status };
        }
        return m;
      });
      set({ messages: updatedMessages });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("newGroupMessage");
      socket.off("messagesRead");
      socket.off("messagesDelivered");
      socket.off("groupMessagesRead");
    }
  },

  setSelectedUser: (user) => {
    const socket = useAuthStore.getState().socket;
    set({ selectedUser: user, selectedGroup: null });
    if (user) {
      const uId = toIdStr(user._id);
      if (socket && socket.connected) {
        socket.emit("enterChat", { type: "direct", id: uId });
      }
      get().markMessagesAsRead(uId);
    } else {
      if (socket && socket.connected) {
        socket.emit("leaveChat");
      }
    }
  },
  setSelectedGroup: (group) => {
    const socket = useAuthStore.getState().socket;
    set({ selectedGroup: group, selectedUser: null });
    if (group) {
      const gId = toIdStr(group._id);
      if (socket && socket.connected) {
        socket.emit("enterChat", { type: "group", id: gId });
      }
      get().markGroupMessagesAsRead(gId);
    } else {
      if (socket && socket.connected) {
        socket.emit("leaveChat");
      }
    }
  },
  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      const currentGroups = Array.isArray(get().groups) ? get().groups : [];
      set({ selectedGroup: null, messages: [], groups: currentGroups.filter((g) => g._id !== groupId) });
      toast.success("Left group");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to leave group");
    }
  },
  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);
      const currentGroups = Array.isArray(get().groups) ? get().groups : [];
      set({ groups: currentGroups.filter((g) => g._id !== groupId), selectedGroup: null });
      toast.success("Group deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete group");
    }
  },
}));
