import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

const appendUniqueMessage = (messages, nextMessage) => {
  if (!nextMessage) return messages;
  const list = Array.isArray(messages) ? messages : [];

  const existsIndex = list.findIndex((m) => {
    if (nextMessage._id && m._id === nextMessage._id) return true;
    if (nextMessage.clientTempId && (m.clientTempId === nextMessage.clientTempId || m._id === nextMessage.clientTempId)) return true;
    if (m.clientTempId && nextMessage._id && m.clientTempId === nextMessage._id) return true;

    // Strict deduplication for duplicate text sent by same user within 3 seconds
    if (m.text && nextMessage.text && m.text.trim() === nextMessage.text.trim()) {
      const mSender = typeof m.senderId === "object" ? m.senderId?._id?.toString() : m.senderId?.toString();
      const nSender = typeof nextMessage.senderId === "object" ? nextMessage.senderId?._id?.toString() : nextMessage.senderId?.toString();
      if (mSender && nSender && mSender === nSender) {
        const timeDiff = Math.abs(new Date(m.createdAt || Date.now()).getTime() - new Date(nextMessage.createdAt || Date.now()).getTime());
        if (timeDiff < 3000) return true;
      }
    }
    return false;
  });

  if (existsIndex >= 0) {
    const updated = [...list];
    updated[existsIndex] = { ...updated[existsIndex], ...nextMessage, isSending: false };
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
    if (socket && authUser) {
      socket.emit("markAsRead", { senderId: userId, receiverId: authUser._id });
    }
    try {
      await axiosInstance.post(`/messages/read/${userId}`);
    } catch {}
  },

  markGroupMessagesAsRead: async (groupId) => {
    if (!groupId) return;
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (socket && authUser) {
      socket.emit("markGroupAsRead", { groupId, readerId: authUser._id });
    }
    try {
      await axiosInstance.post(`/groups/${groupId}/read`);
    } catch {}
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      const isFromSelected = newMessage.senderId === selectedUser._id || newMessage.senderId?._id === selectedUser._id;
      if (!isFromSelected) return;
      set({ messages: appendUniqueMessage(get().messages, newMessage) });

      // Automatically mark as read since recipient is currently actively looking at this conversation
      const authUser = useAuthStore.getState().authUser;
      if (authUser) {
        socket.emit("markAsRead", { senderId: selectedUser._id, receiverId: authUser._id });
        try { axiosInstance.post(`/messages/read/${selectedUser._id}`); } catch {}
      }
    });

    socket.off("messagesRead");
    socket.on("messagesRead", ({ readerId, readAt }) => {
      const currentSelected = get().selectedUser;
      const authUser = useAuthStore.getState().authUser;
      if (!currentSelected || currentSelected._id !== readerId) return;

      set({
        messages: get().messages.map((m) => {
          const isMine = m.senderId === authUser?._id || m.senderId?._id === authUser?._id;
          if (isMine) {
            return { ...m, status: "read", readAt: readAt || new Date().toISOString() };
          }
          return m;
        }),
      });
    });

    socket.off("messagesDelivered");
    socket.on("messagesDelivered", ({ receiverId, deliveredAt }) => {
      const currentSelected = get().selectedUser;
      const authUser = useAuthStore.getState().authUser;
      if (!currentSelected || currentSelected._id !== receiverId) return;

      set({
        messages: get().messages.map((m) => {
          const isMine = m.senderId === authUser?._id || m.senderId?._id === authUser?._id;
          if (isMine && m.status === "sent") {
            return { ...m, status: "delivered", deliveredAt: deliveredAt || new Date().toISOString() };
          }
          return m;
        }),
      });
    });
  },

  subscribeToGroupMessages: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newGroupMessage");
    socket.on("newGroupMessage", (newMessage) => {
      if (newMessage.groupId !== selectedGroup._id) return;
      set({ messages: appendUniqueMessage(get().messages, newMessage) });

      const authUser = useAuthStore.getState().authUser;
      if (authUser) {
        socket.emit("markGroupAsRead", { groupId: selectedGroup._id, readerId: authUser._id });
        try { axiosInstance.post(`/groups/${selectedGroup._id}/read`); } catch {}
      }
    });

    socket.off("groupMessagesRead");
    socket.on("groupMessagesRead", ({ groupId, readerId }) => {
      const currentGroup = get().selectedGroup;
      if (!currentGroup || currentGroup._id !== groupId) return;
      set({
        messages: get().messages.map((m) => {
          const readBy = Array.isArray(m.readBy) ? m.readBy : [];
          if (!readBy.some((id) => (id?._id || id)?.toString() === readerId)) {
            return { ...m, readBy: [...readBy, readerId], status: "read" };
          }
          return m;
        }),
      });
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
    set({ selectedUser: user, selectedGroup: null });
    if (user) get().markMessagesAsRead(user._id);
  },
  setSelectedGroup: (group) => {
    set({ selectedGroup: group, selectedUser: null });
    if (group) get().markGroupMessagesAsRead(group._id);
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
