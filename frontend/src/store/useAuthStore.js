import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore.js";

const SOCKET_BASE_URL = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("chat-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();

export const useAuthStore = create((set, get) => ({
  authUser: initialUser,
  isCheckingAuth: false,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isChangingPassword: false,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      if (res.data && typeof res.data === "object" && res.data._id) {
        localStorage.setItem("chat-user", JSON.stringify(res.data));
        set({ authUser: res.data });
        get().connectSocket();
      } else {
        localStorage.removeItem("chat-token");
        localStorage.removeItem("chat-user");
        set({ authUser: null });
      }
    } catch {
      localStorage.removeItem("chat-token");
      localStorage.removeItem("chat-user");
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      if (res.data.devOtp) {
        toast.success(`Account created! Code: ${res.data.devOtp}`, { duration: 8000 });
      } else {
        toast.success("Account created — check your email for verification code.");
      }
      return { ok: true, email: res.data.email, devOtp: res.data.devOtp };
    } catch (err) {
      toast.error(err?.response?.data?.message || "Signup failed");
      return { ok: false };
    } finally { set({ isSigningUp: false }); }
  },

  verifyOtp: async ({ email, code }) => {
    try {
      const res = await axiosInstance.post("/auth/verify-otp", { email, code });
      if (res.data.token) localStorage.setItem("chat-token", res.data.token);
      localStorage.setItem("chat-user", JSON.stringify(res.data));
      set({ authUser: res.data });
      toast.success("Email verified! Welcome to Chatty.");
      get().connectSocket();
      return { ok: true };
    } catch (err) {
      toast.error(err?.response?.data?.message || "Verification failed");
      return { ok: false };
    }
  },

  resendOtp: async (email) => {
    try {
      await axiosInstance.post("/auth/resend-otp", { email });
      toast.success("New code sent.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not resend code");
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      if (res.data.token) localStorage.setItem("chat-token", res.data.token);
      localStorage.setItem("chat-user", JSON.stringify(res.data));
      set({ authUser: res.data });
      toast.success("Welcome back!");
      get().connectSocket();
      return { ok: true };
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (err?.response?.data?.needsVerification) {
        toast.error("Please verify your email first.");
        return { ok: false, needsVerification: true, email: err.response.data.email };
      }
      toast.error(msg || "Login failed");
      return { ok: false };
    } finally { set({ isLoggingIn: false }); }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      localStorage.removeItem("chat-token");
      localStorage.removeItem("chat-user");
      set({ authUser: null });
      toast.success("Logged out");
      get().disconnectSocket();
    } catch (err) {
      localStorage.removeItem("chat-token");
      localStorage.removeItem("chat-user");
      set({ authUser: null });
      toast.error(err?.response?.data?.message || "Logout failed");
    }
  },

  forgotPassword: async (email) => {
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      toast.success("If that email exists, a reset code has been sent.");
      return { ok: true };
    } catch (err) {
      toast.error(err?.response?.data?.message || "Request failed");
      return { ok: false };
    }
  },

  resetPassword: async ({ email, code, password }) => {
    try {
      await axiosInstance.post("/auth/reset-password", { email, code, password });
      toast.success("Password updated — please sign in.");
      return { ok: true };
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reset failed");
      return { ok: false };
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      localStorage.setItem("chat-user", JSON.stringify(res.data));
      set({ authUser: res.data });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally { set({ isUpdatingProfile: false }); }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    set({ isChangingPassword: true });
    try {
      await axiosInstance.put("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password updated");
      return { ok: true };
    } catch (err) {
      toast.error(err?.response?.data?.message || "Password change failed");
      return { ok: false };
    } finally { set({ isChangingPassword: false }); }
  },

  deleteAccount: async () => {
    try {
      await axiosInstance.delete("/auth/delete-account");
      localStorage.removeItem("chat-token");
      localStorage.removeItem("chat-user");
      set({ authUser: null });
      toast.success("Account deleted");
      get().disconnectSocket();
    } catch (err) {
      localStorage.removeItem("chat-token");
      localStorage.removeItem("chat-user");
      set({ authUser: null });
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket?.connected) return;
    const s = io(SOCKET_BASE_URL || undefined, { query: { userId: authUser._id }, withCredentials: true });
    s.connect();
    set({ socket: s });
    s.on("connect", () => {
      const chatState = useChatStore.getState();
      if (chatState.selectedUser) {
        s.emit("enterChat", { type: "direct", id: chatState.selectedUser._id?.toString() });
      } else if (chatState.selectedGroup) {
        s.emit("enterChat", { type: "group", id: chatState.selectedGroup._id?.toString() });
      }
    });
    s.on("getOnlineUsers", (ids) => set({ onlineUsers: ids }));
    s.off("newGroup");
    s.on("newGroup", (group) => {
      useChatStore.setState((state) => {
        const currentGroups = Array.isArray(state.groups) ? state.groups : [];
        const hasGroup = currentGroups.some((g) => g._id === group._id);
        return {
          groups: hasGroup ? currentGroups : [...currentGroups, group],
        };
      });
    });
    s.off("groupUpdated");
    s.on("groupUpdated", (updatedGroup) => {
      useChatStore.setState((state) => {
        const currentGroups = Array.isArray(state.groups) ? state.groups : [];
        const groups = currentGroups.map((group) => group._id === updatedGroup._id ? updatedGroup : group);
        return {
          groups,
          selectedGroup: state.selectedGroup?._id === updatedGroup._id ? updatedGroup : state.selectedGroup,
        };
      });
    });
    s.off("groupDeleted");
    s.on("groupDeleted", (groupId) => {
      useChatStore.setState((state) => ({
        groups: (Array.isArray(state.groups) ? state.groups : []).filter((g) => g._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) socket.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));
