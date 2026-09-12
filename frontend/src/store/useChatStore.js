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

const getMessageReactions = (message) => {
  if (!message || !message.reactions || typeof message.reactions !== "object") return {};
  return message.reactions;
};

const updateReactionMap = (reactions, emoji, userId) => {
  const next = { ...(reactions || {}) };
  const currentUsers = Array.isArray(next[emoji]) ? next[emoji].map(toIdStr) : [];
  const cleanedUsers = currentUsers.filter(Boolean);
  const hasUser = cleanedUsers.includes(toIdStr(userId));

  if (hasUser) {
    next[emoji] = cleanedUsers.filter((id) => id !== toIdStr(userId));
    if (!next[emoji].length) delete next[emoji];
    return next;
  }

  next[emoji] = [...cleanedUsers, toIdStr(userId)];
  return next;
};

const sortMessagesByTime = (messages = []) => {
  if (!Array.isArray(messages)) return [];
  return [...messages].sort((a, b) => {
    const timeA = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
    const timeB = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
    return timeA - timeB;
  });
};

const appendUniqueMessage = (messages, nextMessage) => {
  if (!nextMessage) return sortMessagesByTime(messages);
  const list = Array.isArray(messages) ? messages : [];

  const nextId = toIdStr(nextMessage._id);
  const nextTempId = toIdStr(nextMessage.clientTempId);

  const existsIndex = list.findIndex((m) => {
    const mId = toIdStr(m._id);
    const mTempId = toIdStr(m.clientTempId);

    if (nextId && mId === nextId) return true;
    if (nextTempId && (mTempId === nextTempId || mId === nextTempId)) return true;
    if (mTempId && nextId && mTempId === nextId) return true;
    return false;
  });

  if (existsIndex >= 0) {
    const updated = [...list];
    const existing = updated[existsIndex];

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
    return sortMessagesByTime(updated);
  }

  return sortMessagesByTime([...list, { ...nextMessage, isSending: false }]);
};

const mergeConversationMessageSet = (state, conversationKey, incomingMessages, selectedConversationId = "") => {
  const base = Array.isArray(state.conversationMessages[conversationKey]) ? state.conversationMessages[conversationKey] : [];
  const merged = appendUniqueMessage(base, incomingMessages);
  const nextState = {
    conversationMessages: {
      ...state.conversationMessages,
      [conversationKey]: merged,
    },
  };

  if (selectedConversationId && selectedConversationId === conversationKey.replace(/^(user|group):/, "")) {
    nextState.messages = merged;
  }

  return nextState;
};

const typingTimeouts = {};
const getConversationKey = (type, id) => `${type}:${toIdStr(id)}`;

export const useChatStore = create((set, get) => ({
  messages: [],
  conversationMessages: {},
  conversationLoaded: {},
  users: [],
  groups: [],
  selectedUser: null,
  selectedGroup: null,
  blockedUsers: [],
  isUsersLoading: false,
  isMessagesLoading: false,
  isChatSearchOpen: false,
  chatSearchQuery: "",
  chatSearchMatchIndex: 0,
  unreadCounts: {},
  typingUsers: {}, // { [conversationId]: { [userId]: { userName, time } } }

  setChatSearchOpen: (isOpen) => set({ isChatSearchOpen: isOpen }),
  setChatSearchQuery: (query) => set({ chatSearchQuery: query, chatSearchMatchIndex: 0 }),
  getChatSearchMatches: () => {
    const { messages, chatSearchQuery } = get();
    const normalizedQuery = chatSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return (Array.isArray(messages) ? messages : []).filter((message) =>
      message.text?.toLowerCase().includes(normalizedQuery)
    );
  },
  nextChatSearchMatch: () => set((state) => {
    const matchCount = get().getChatSearchMatches().length;
    if (!matchCount) return { chatSearchMatchIndex: 0 };
    return { chatSearchMatchIndex: (state.chatSearchMatchIndex + 1) % matchCount };
  }),
  previousChatSearchMatch: () => set((state) => {
    const matchCount = get().getChatSearchMatches().length;
    if (!matchCount) return { chatSearchMatchIndex: 0 };
    return { chatSearchMatchIndex: (state.chatSearchMatchIndex - 1 + matchCount) % matchCount };
  }),
  closeChatSearch: () => set({ isChatSearchOpen: false, chatSearchQuery: "", chatSearchMatchIndex: 0 }),
  setUnreadCount: (id, count) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [toIdStr(id)]: Math.max(0, count) },
  })),
  clearUnreadCount: (id) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [toIdStr(id)]: 0 },
  })),
  updateMessageReactions: (messageId, reactions) => set((state) => {
    const targetId = toIdStr(messageId);
    const nextMessages = (Array.isArray(state.messages) ? state.messages : []).map((message) => {
      const currentId = toIdStr(message._id || message.clientTempId);
      return currentId === targetId ? { ...message, reactions: reactions || {} } : message;
    });

    const nextConversationMessages = Object.fromEntries(Object.entries(state.conversationMessages || {}).map(([key, items]) => {
      const mapped = Array.isArray(items) ? items.map((message) => {
        const currentId = toIdStr(message._id || message.clientTempId);
        return currentId === targetId ? { ...message, reactions: reactions || {} } : message;
      }) : items;
      return [key, sortMessagesByTime(mapped)];
    }));

    return {
      messages: sortMessagesByTime(nextMessages),
      conversationMessages: nextConversationMessages,
    };
  }),
  updatePinnedMessage: (messageId, payload) => set((state) => {
    const targetId = toIdStr(messageId);
    const nextMessages = (Array.isArray(state.messages) ? state.messages : []).map((message) => {
      const currentId = toIdStr(message._id || message.clientTempId);
      return currentId === targetId ? { ...message, ...(payload || {}), isPinned: Boolean(payload?.isPinned ?? message.isPinned) } : message;
    });

    const nextConversationMessages = Object.fromEntries(Object.entries(state.conversationMessages || {}).map(([key, items]) => {
      const mapped = Array.isArray(items) ? items.map((message) => {
        const currentId = toIdStr(message._id || message.clientTempId);
        return currentId === targetId ? { ...message, ...(payload || {}), isPinned: Boolean(payload?.isPinned ?? message.isPinned) } : message;
      }) : items;
      return [key, sortMessagesByTime(mapped)];
    }));

    return {
      messages: sortMessagesByTime(nextMessages),
      conversationMessages: nextConversationMessages,
    };
  }),
  removeMessageById: (messageId) => set((state) => {
    const targetId = toIdStr(messageId);
    const filterMessages = (items) => (Array.isArray(items) ? items.filter((message) => toIdStr(message._id || message.clientTempId) !== targetId) : items);
    return {
      messages: filterMessages(state.messages),
      conversationMessages: Object.fromEntries(
        Object.entries(state.conversationMessages || {}).map(([key, items]) => [key, filterMessages(items)])
      ),
    };
  }),
  deleteMessage: async (messageId, mode = "forMe") => {
    if (!messageId) return null;
    try {
      const res = await axiosInstance.post(`/messages/delete/${messageId}`, { mode });
      get().removeMessageById(messageId);
      if (useAuthStore.getState().socket?.connected) {
        useAuthStore.getState().socket.emit("messageDeleted", {
          messageId: toIdStr(messageId),
          mode: res.data?.mode || mode,
        });
      }
      toast.success(mode === "forEveryone" ? "Message deleted for everyone." : "Message deleted for you.");
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete message");
      return null;
    }
  },
  toggleMessageReaction: async (messageId, emoji) => {
    if (!messageId || !emoji) return;
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;
    const meId = toIdStr(authUser._id);

    const findExistingReactions = () => {
      const currentState = get();
      const directMessage = (Array.isArray(currentState.messages) ? currentState.messages : []).find((m) => toIdStr(m._id || m.clientTempId) === toIdStr(messageId));
      if (directMessage) return getMessageReactions(directMessage);
      for (const items of Object.values(currentState.conversationMessages || {})) {
        const match = (Array.isArray(items) ? items : []).find((m) => toIdStr(m._id || m.clientTempId) === toIdStr(messageId));
        if (match) return getMessageReactions(match);
      }
      return {};
    };

    const previousReactions = findExistingReactions();
    const optimisticReactions = updateReactionMap(previousReactions, emoji, meId);
    get().updateMessageReactions(messageId, optimisticReactions);

    if (socket && socket.connected) {
      socket.emit("messageReactionUpdated", {
        messageId: toIdStr(messageId),
        reactions: optimisticReactions,
        reactedBy: meId,
        emoji,
      });
    }

    try {
      const res = await axiosInstance.post(`/messages/reaction/${messageId}`, { emoji });
      const nextReactions = res.data?.reactions || res.data?.message?.reactions || optimisticReactions;
      get().updateMessageReactions(messageId, nextReactions);
    } catch (err) {
      get().updateMessageReactions(messageId, previousReactions);
      toast.error(err?.response?.data?.message || "Failed to add reaction");
    }
  },
  togglePinMessage: async (messageId, duration = "7d") => {
    if (!messageId) return;
    try {
      const res = await axiosInstance.post(`/messages/pin/${messageId}`, { duration });
      const updatedMessage = res.data?.updatedMessage || res.data?.data || res.data?.message || null;
      if (updatedMessage) {
        get().updatePinnedMessage(messageId, {
          ...updatedMessage,
          isPinned: Boolean(updatedMessage.isPinned),
        });
      }
      if (useAuthStore.getState().socket?.connected) {
        useAuthStore.getState().socket.emit("messagePinUpdated", {
          messageId: toIdStr(messageId),
          isPinned: Boolean(updatedMessage?.isPinned),
          message: updatedMessage,
          updatedMessage,
        });
      }
      toast.success(updatedMessage?.isPinned ? "Message pinned." : "Pin removed.");
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update pin status");
      return null;
    }
  },

  removeTypingUser: (convId, uId) => {
    set((state) => {
      const conv = state.typingUsers[convId];
      if (!conv || !conv[uId]) return state;
      const nextConv = { ...conv };
      delete nextConv[uId];
      return {
        typingUsers: {
          ...state.typingUsers,
          [convId]: nextConv,
        },
      };
    });
  },

  handleIncomingUserTyping: ({ userId, conversationId, userName, type, groupId }) => {
    const convId = toIdStr(groupId || conversationId || userId);
    const uId = toIdStr(userId);
    const authUser = useAuthStore.getState().authUser;
    if (uId === toIdStr(authUser?._id)) return;

    set((state) => {
      const prevConv = state.typingUsers[convId] || {};
      return {
        typingUsers: {
          ...state.typingUsers,
          [convId]: {
            ...prevConv,
            [uId]: { userName: userName || "Contact", time: Date.now() },
          },
        },
      };
    });

    const timerKey = `${convId}_${uId}`;
    if (typingTimeouts[timerKey]) clearTimeout(typingTimeouts[timerKey]);
    // 5-second safety timer; will continuously refresh while user types continuously
    typingTimeouts[timerKey] = setTimeout(() => {
      get().removeTypingUser(convId, uId);
    }, 5000);
  },

  handleIncomingUserStopTyping: ({ userId, conversationId, type, groupId }) => {
    const convId = toIdStr(groupId || conversationId || userId);
    const uId = toIdStr(userId);
    const timerKey = `${convId}_${uId}`;
    if (typingTimeouts[timerKey]) {
      clearTimeout(typingTimeouts[timerKey]);
      delete typingTimeouts[timerKey];
    }
    get().removeTypingUser(convId, uId);
  },

  sendTypingStart: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (!socket || !socket.connected) return;

    const { selectedUser, selectedGroup } = get();
    if (selectedUser) {
      socket.emit("typingStart", {
        type: "direct",
        receiverId: toIdStr(selectedUser._id),
        userName: authUser?.fullName || "Contact",
      });
    } else if (selectedGroup) {
      socket.emit("typingStart", {
        type: "group",
        groupId: toIdStr(selectedGroup._id),
        userName: authUser?.fullName || "Member",
      });
    }
  },

  sendTypingStop: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket || !socket.connected) return;

    const { selectedUser, selectedGroup } = get();
    if (selectedUser) {
      socket.emit("typingStop", {
        type: "direct",
        receiverId: toIdStr(selectedUser._id),
      });
    } else if (selectedGroup) {
      socket.emit("typingStop", {
        type: "group",
        groupId: toIdStr(selectedGroup._id),
      });
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      const nextUsers = Array.isArray(res.data?.users) ? res.data.users : (Array.isArray(res.data) ? res.data : []);
      const nextBlockedUsers = (Array.isArray(res.data?.blockedUsers) ? res.data.blockedUsers : []).map((id) => (id?._id || id)?.toString());
      const currentSelectedUser = get().selectedUser;
      const serverUnread = res.data?.unreadCounts || {};
      const validSelectedUser = currentSelectedUser && nextUsers.some((user) =>
        toIdStr(user._id) === toIdStr(currentSelectedUser._id)
      ) ? currentSelectedUser : null;
      const mergedUnread = { ...get().unreadCounts, ...serverUnread };
      if (validSelectedUser) mergedUnread[toIdStr(validSelectedUser._id)] = 0;

      set({
        users: nextUsers,
        blockedUsers: nextBlockedUsers,
        unreadCounts: mergedUnread,
        selectedUser: validSelectedUser,
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
      const currentSelectedGroup = get().selectedGroup;
      const validSelectedGroup = currentSelectedGroup && groupsData.some((group) =>
        toIdStr(group._id) === toIdStr(currentSelectedGroup._id)
      ) ? currentSelectedGroup : null;
      const mergedUnread = { ...get().unreadCounts, ...(res.data?.unreadCounts || {}) };
      if (validSelectedGroup) mergedUnread[toIdStr(validSelectedGroup._id)] = 0;
      set((state) => ({
        groups: groupsData,
        unreadCounts: mergedUnread,
        selectedGroup: validSelectedGroup,
      }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load groups");
      set({ groups: [] });
    }
  },

  requestJoinGroup: async (groupId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/request-join`);
      const currentGroups = Array.isArray(get().groups) ? get().groups : [];
      const nextGroups = currentGroups.map((group) => {
        if (toIdStr(group._id) !== toIdStr(groupId)) return group;
        return { ...group, joinRequestStatus: "pending", isMember: false };
      });
      set({ groups: nextGroups });
      toast.success(res.data?.message || "Join request sent");
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to request join");
      return null;
    }
  },

  handleJoinRequestDecision: async (groupId, userId, action) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/join-requests/${userId}`, { action });
      const currentGroups = Array.isArray(get().groups) ? get().groups : [];
      const updatedGroup = res.data?.group || null;
      const nextGroups = currentGroups.map((group) => {
        if (toIdStr(group._id) !== toIdStr(groupId)) return group;
        const mergedGroup = updatedGroup ? { ...group, ...updatedGroup } : group;
        const actualPendingCount = Array.isArray(mergedGroup.joinRequests)
          ? mergedGroup.joinRequests.filter((entry) => String(entry?.status || "").toLowerCase() === "pending").length
          : Number(mergedGroup.pendingRequestsCount || 0);
        return { ...mergedGroup, pendingRequestsCount: actualPendingCount };
      });
      const selectedGroup = nextGroups.find((group) => toIdStr(group._id) === toIdStr(groupId)) || get().selectedGroup;
      set({
        groups: nextGroups,
        selectedGroup,
      });
      toast.success(res.data?.message || "Join request updated");
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update join request");
      return null;
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
    const key = getConversationKey("user", userId);
    const cached = get().conversationMessages[key];
    const isLoaded = Boolean(get().conversationLoaded[key]);
    if (isLoaded && Array.isArray(cached)) {
      set({ messages: cached });
      return cached;
    }

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const nextMessages = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.messages) ? res.data.messages : []);
      set((state) => ({
        messages: toIdStr(state.selectedUser?._id) === toIdStr(userId) ? nextMessages : state.messages,
        conversationMessages: { ...state.conversationMessages, [key]: nextMessages },
        conversationLoaded: { ...state.conversationLoaded, [key]: true },
      }));
      return nextMessages;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load messages");
      set({ messages: [] });
      return [];
    } finally { set({ isMessagesLoading: false }); }
  },

  getGroupMessages: async (groupId) => {
    const key = getConversationKey("group", groupId);
    const cached = get().conversationMessages[key];
    const isLoaded = Boolean(get().conversationLoaded[key]);
    if (isLoaded && Array.isArray(cached)) {
      set({ messages: cached });
      return cached;
    }

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      const nextMessages = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.messages) ? res.data.messages : []);
      set((state) => ({
        messages: toIdStr(state.selectedGroup?._id) === toIdStr(groupId) ? nextMessages : state.messages,
        conversationMessages: { ...state.conversationMessages, [key]: nextMessages },
        conversationLoaded: { ...state.conversationLoaded, [key]: true },
      }));
      return nextMessages;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load messages");
      set({ messages: [] });
      return [];
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

    const authUser = useAuthStore.getState().authUser;
    const cleanUserId = toIdStr(userId);
    const cleanAuthUserId = toIdStr(authUser?._id);
    if (!cleanAuthUserId || !cleanUserId) return;

    const hasUnreadMessages = (Array.isArray(get().messages) ? get().messages : []).some((message) => {
      const senderId = toIdStr(message.senderId);
      const receiverId = toIdStr(message.receiverId);
      return senderId === cleanUserId && receiverId === cleanAuthUserId && message.status !== "read";
    });

    if (!hasUnreadMessages) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

    get().clearUnreadCount(userId);
    const socket = useAuthStore.getState().socket;

    if (socket && socket.connected) {
      socket.emit("markAsRead", { senderId: cleanUserId, receiverId: cleanAuthUserId });
    }
    try {
      await axiosInstance.post(`/messages/mark-seen/${cleanUserId}`);
    } catch {}
  },

  markGroupMessagesAsRead: async (groupId) => {
    if (!groupId) return;

    const authUser = useAuthStore.getState().authUser;
    const cleanGroupId = toIdStr(groupId);
    const cleanAuthUserId = toIdStr(authUser?._id);
    if (!cleanAuthUserId || !cleanGroupId) return;

    const hasUnreadMessages = (Array.isArray(get().messages) ? get().messages : []).some((message) => {
      const senderId = toIdStr(message.senderId);
      const msgGroupId = toIdStr(message.groupId);
      return msgGroupId === cleanGroupId && senderId !== cleanAuthUserId && !((Array.isArray(message.readBy) ? message.readBy : []).some((id) => toIdStr(id) === cleanAuthUserId));
    });

    if (!hasUnreadMessages) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

    get().clearUnreadCount(groupId);
    const socket = useAuthStore.getState().socket;

    if (socket && socket.connected) {
      socket.emit("markGroupAsRead", { groupId: cleanGroupId, readerId: cleanAuthUserId });
    }
    try {
      await axiosInstance.post(`/groups/${cleanGroupId}/mark-seen`);
    } catch {}
  },

  initGlobalSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("userTyping");
    socket.off("userStopTyping");
    socket.off("messagesRead");
    socket.off("messagesDelivered");
    socket.off("groupMessagesRead");
    socket.off("messageReactionUpdated");
    socket.off("messagePinUpdated");
    socket.off("messageDeleted");

    socket.on("messageDeleted", ({ messageId }) => {
      if (!messageId) return;
      get().removeMessageById(messageId);
    });

    socket.on("messageReactionUpdated", ({ messageId, reactions, reactedBy, senderId, receiverId, groupId }) => {
      if (!messageId || !reactions) return;
      get().updateMessageReactions(messageId, reactions);

      const authUser = useAuthStore.getState().authUser;
      const myId = toIdStr(authUser?._id);
      const actorId = toIdStr(reactedBy);
      if (!myId || !actorId || actorId === myId) return;

      const directTargetId = toIdStr(senderId === myId ? receiverId : senderId);
      const targetConversationId = toIdStr(groupId || directTargetId);
      if (!targetConversationId) return;

      const selectedUser = get().selectedUser;
      const selectedGroup = get().selectedGroup;
      const selectedId = selectedUser ? toIdStr(selectedUser._id) : selectedGroup ? toIdStr(selectedGroup._id) : "";
      if (selectedId === targetConversationId) {
        get().clearUnreadCount(targetConversationId);
        return;
      }

      const nextCount = Number(get().unreadCounts[targetConversationId] || 0) + 1;
      get().setUnreadCount(targetConversationId, nextCount);
    });

    socket.on("messagePinUpdated", ({ messageId, updatedMessage, isPinned }) => {
      if (!messageId) return;
      get().updatePinnedMessage(messageId, updatedMessage || { isPinned: Boolean(isPinned) });
    });

    socket.on("newMessage", (newMessage) => {
      const authUser = useAuthStore.getState().authUser;
      const myId = toIdStr(authUser?._id);
      const selectedUser = get().selectedUser;
      const selectedId = selectedUser ? toIdStr(selectedUser._id) : "";
      const msgSenderId = toIdStr(newMessage.senderId);
      const msgReceiverId = toIdStr(newMessage.receiverId);

      if (!myId) return;
      const isForMe = msgReceiverId === myId;
      const isFromMe = msgSenderId === myId;
      if (!isForMe && !isFromMe) return;

      const conversationId = isFromMe ? msgReceiverId : msgSenderId;
      const isSelectedConversation = !!selectedId && selectedId === conversationId;
      const targetKey = getConversationKey("user", conversationId);
      const existingMessages = Array.isArray(get().conversationMessages[targetKey]) ? get().conversationMessages[targetKey] : [];
      const nextMessages = appendUniqueMessage(existingMessages, newMessage);

      set((state) => ({
        conversationMessages: {
          ...state.conversationMessages,
          [targetKey]: nextMessages,
        },
        messages: isSelectedConversation ? nextMessages : state.messages,
      }));

      if (isSelectedConversation) {
        get().clearUnreadCount(selectedId);
        return;
      }

      if (isForMe && !isFromMe) {
        const currentCount = Number(get().unreadCounts[msgSenderId] || 0);
        get().setUnreadCount(msgSenderId, currentCount + 1);
      }
    });

    socket.on("newGroupMessage", (newMessage) => {
      const authUser = useAuthStore.getState().authUser;
      const myId = toIdStr(authUser?._id);
      const selectedGroup = get().selectedGroup;
      const selectedGroupId = selectedGroup ? toIdStr(selectedGroup._id) : "";
      const msgGroupId = toIdStr(newMessage.groupId);
      const msgSenderId = toIdStr(newMessage.senderId);

      if (!myId || !msgGroupId || !msgSenderId) return;
      const isFromMe = msgSenderId === myId;
      const isSelectedGroup = !!selectedGroupId && selectedGroupId === msgGroupId;
      if (isSelectedGroup) {
        get().clearUnreadCount(msgGroupId);
        const key = getConversationKey("group", msgGroupId);
        const nextMessages = appendUniqueMessage(get().messages, newMessage);
        set((state) => ({
          messages: nextMessages,
          conversationMessages: { ...state.conversationMessages, [key]: nextMessages },
        }));
        return;
      }

      if (!isFromMe) {
        const currentCount = Number(get().unreadCounts[msgGroupId] || 0);
        get().setUnreadCount(msgGroupId, currentCount + 1);
      }

      const key = getConversationKey("group", msgGroupId);
      const existing = Array.isArray(get().conversationMessages[key]) ? get().conversationMessages[key] : [];
      const nextMessages = appendUniqueMessage(existing, newMessage);
      set((state) => ({
        conversationMessages: { ...state.conversationMessages, [key]: nextMessages },
      }));
    });

    socket.on("userTyping", (payload) => {
      get().handleIncomingUserTyping(payload);
    });

    socket.on("userStopTyping", (payload) => {
      get().handleIncomingUserStopTyping(payload);
    });

    socket.on("messagesRead", ({ readerId, readAt }) => {
      const selectedUser = get().selectedUser;
      const authUser = useAuthStore.getState().authUser;
      if (!selectedUser || !authUser) return;

      const cId = toIdStr(selectedUser._id);
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

    socket.on("messagesDelivered", ({ receiverId, deliveredAt }) => {
      const selectedUser = get().selectedUser;
      const authUser = useAuthStore.getState().authUser;
      if (!selectedUser || !authUser) return;

      const cId = toIdStr(selectedUser._id);
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

    socket.on("groupMessagesRead", ({ groupId, readerId }) => {
      const selectedGroup = get().selectedGroup;
      if (!selectedGroup) return;
      const currentGroupId = toIdStr(selectedGroup._id);
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

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("userTyping");
    socket.on("userTyping", (payload) => {
      get().handleIncomingUserTyping(payload);
    });

    socket.off("userStopTyping");
    socket.on("userStopTyping", (payload) => {
      get().handleIncomingUserStopTyping(payload);
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

    socket.off("userTyping");
    socket.on("userTyping", (payload) => {
      get().handleIncomingUserTyping(payload);
    });

    socket.off("userStopTyping");
    socket.on("userStopTyping", (payload) => {
      get().handleIncomingUserStopTyping(payload);
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
    get().sendTypingStop();
    const socket = useAuthStore.getState().socket;
    const nextUserId = user ? toIdStr(user._id) : "";
    const key = getConversationKey("user", nextUserId);
    set((state) => ({
      selectedUser: user,
      selectedGroup: null,
      messages: user ? (state.conversationMessages[key] ?? []) : [],
    }));
    if (user) {
      get().clearUnreadCount(nextUserId);
      if (socket && socket.connected) {
        socket.emit("enterChat", { type: "direct", id: nextUserId });
      }
      const shouldFetch = !get().conversationLoaded[key];
      if (shouldFetch) {
        get().getMessages(nextUserId);
      } else if (get().conversationMessages[key]) {
        set({ messages: get().conversationMessages[key] });
      }
      get().markMessagesAsRead(nextUserId);
    } else {
      if (socket && socket.connected) {
        socket.emit("leaveChat");
      }
    }
  },
  setSelectedGroup: (group) => {
    get().sendTypingStop();
    const socket = useAuthStore.getState().socket;
    const nextGroupId = group ? toIdStr(group._id) : "";
    const key = getConversationKey("group", nextGroupId);
    set((state) => ({
      selectedGroup: group,
      selectedUser: null,
      messages: group ? (state.conversationMessages[key] ?? []) : [],
    }));
    if (group) {
      get().clearUnreadCount(nextGroupId);
      if (socket && socket.connected) {
        socket.emit("enterChat", { type: "group", id: nextGroupId });
      }
      const shouldFetch = !get().conversationLoaded[key];
      if (shouldFetch) {
        get().getGroupMessages(nextGroupId);
      } else if (get().conversationMessages[key]) {
        set({ messages: get().conversationMessages[key] });
      }
      get().markGroupMessagesAsRead(nextGroupId);
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
