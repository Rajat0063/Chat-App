import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

const appendUniqueMessage = (messages, nextMessage) => {
  if (!nextMessage) return messages;
  if (messages.some((message) => message?._id === nextMessage?._id)) return messages;
  return [...messages, nextMessage];
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
    try {
      if (selectedGroup) {
        const res = await axiosInstance.post(`/groups/${selectedGroup._id}/send`, messageData);
        set({ messages: appendUniqueMessage(messages, res.data) });
      } else if (selectedUser) {
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
        set({ messages: appendUniqueMessage(messages, res.data) });
      }
    } catch (err) {
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
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("newGroupMessage");
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user, selectedGroup: null }),
  setSelectedGroup: (group) => set({ selectedGroup: group, selectedUser: null }),
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
