import React, { useEffect, useRef } from "react";
import { MessageSquare, Sparkles, Check, CheckCheck, Clock } from "lucide-react";
import ChatHeader from "./ChatHeader.jsx";
import MessageInput from "./MessageInput.jsx";
import MessageSkeleton from "./skeletons/MessageSkeleton.jsx";
import { useChatStore, toIdStr } from "../store/useChatStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { formatMessageTime } from "../lib/utils.js";

export default function ChatContainer() {
  const {
    messages,
    getMessages,
    getGroupMessages,
    isMessagesLoading,
    selectedUser,
    selectedGroup,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToGroupMessages,
    markMessagesAsRead,
    markGroupMessagesAsRead,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const endRef = useRef(null);

  useEffect(() => {
    const socket = useAuthStore.getState().socket;

    if (selectedGroup) {
      const gId = toIdStr(selectedGroup._id);
      if (socket && socket.connected) {
        socket.emit("enterChat", { type: "group", id: gId });
      }
      getGroupMessages(gId);
      subscribeToGroupMessages();
      markGroupMessagesAsRead(gId);

      return () => {
        if (socket && socket.connected) {
          socket.emit("leaveChat");
        }
        unsubscribeFromMessages();
      };
    }

    if (selectedUser) {
      const uId = toIdStr(selectedUser._id);
      if (socket && socket.connected) {
        socket.emit("enterChat", { type: "direct", id: uId });
      }
      getMessages(uId);
      subscribeToMessages();
      markMessagesAsRead(uId);

      return () => {
        if (socket && socket.connected) {
          socket.emit("leaveChat");
        }
        unsubscribeFromMessages();
      };
    }
  }, [selectedUser?._id, selectedGroup?._id]);

  useEffect(() => {
    if (endRef.current && messages) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time mark-as-read when new messages arrive while viewing this conversation
  useEffect(() => {
    if (!messages?.length) return;
    const myId = toIdStr(authUser?._id);
    if (!myId) return;

    if (selectedUser) {
      const otherId = toIdStr(selectedUser._id);
      const hasUnread = messages.some((m) => {
        const sender = toIdStr(m.senderId);
        return sender === otherId && m.status !== "read";
      });
      if (hasUnread) {
        markMessagesAsRead(otherId);
      }
    } else if (selectedGroup) {
      const gId = toIdStr(selectedGroup._id);
      const hasUnreadGroup = messages.some((m) => {
        const sender = toIdStr(m.senderId);
        const readBy = (m.readBy || []).map(toIdStr);
        return sender !== myId && !readBy.includes(myId);
      });
      if (hasUnreadGroup) {
        markGroupMessagesAsRead(gId);
      }
    }
  }, [messages, selectedUser?._id, selectedGroup?._id, authUser?._id]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex min-h-0 flex-col overflow-hidden bg-base-100/30">
        <ChatHeader />
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 sm:p-4">
          <MessageSkeleton />
        </div>
        <MessageInput />
      </div>
    );
  }

  const messageList = Array.isArray(messages) ? messages : [];
  const myId = toIdStr(authUser?._id);

  const renderStatusIndicator = (m) => {
    if (m.isSending) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-base-content/50" title="Sending message...">
          <Clock className="size-3 animate-spin text-base-content/50" />
          <span>Sending</span>
        </span>
      );
    }

    // Direct chat
    if (!selectedGroup) {
      if (m.status === "read") {
        return (
          <span
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-sky-500 hover:text-sky-600 transition-colors"
            title={m.readAt ? `Read • ${formatMessageTime(m.readAt)}` : "Read by recipient"}
          >
            <CheckCheck className="size-3.5 stroke-[2.5]" />
            <span>Read</span>
          </span>
        );
      }
      if (m.status === "delivered") {
        return (
          <span
            className="inline-flex items-center gap-0.5 text-[10px] text-base-content/60"
            title={m.deliveredAt ? `Delivered • ${formatMessageTime(m.deliveredAt)}` : "Delivered to device"}
          >
            <CheckCheck className="size-3.5 stroke-[1.8]" />
            <span>Delivered</span>
          </span>
        );
      }
      return (
        <span
          className="inline-flex items-center gap-0.5 text-[10px] text-base-content/50"
          title="Sent to server"
        >
          <Check className="size-3.5 stroke-[1.8]" />
          <span>Sent</span>
        </span>
      );
    }

    // Group chat
    const readByList = (Array.isArray(m.readBy) ? m.readBy : []).map(toIdStr);
    const otherReadCount = readByList.filter((idStr) => idStr && myId && idStr !== myId).length;

    if (m.status === "read" || otherReadCount > 0) {
      return (
        <span
          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-sky-500"
          title={`Read by ${otherReadCount} group member${otherReadCount > 1 ? "s" : ""}`}
        >
          <CheckCheck className="size-3.5 stroke-[2.5]" />
          <span>Read{otherReadCount > 0 ? ` (${otherReadCount})` : ""}</span>
        </span>
      );
    }

    if (m.status === "delivered") {
      return (
        <span
          className="inline-flex items-center gap-0.5 text-[10px] text-base-content/60"
          title="Delivered to group members"
        >
          <CheckCheck className="size-3.5 stroke-[1.8]" />
          <span>Delivered</span>
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-0.5 text-[10px] text-base-content/50"
        title="Sent to group"
      >
        <Check className="size-3.5 stroke-[1.8]" />
        <span>Sent</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex min-h-0 flex-col overflow-hidden bg-base-100/30">
      <ChatHeader />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4">
        {messageList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="size-7" />
            </div>
            <div>
              <h4 className="font-bold text-base">No messages yet</h4>
              <p className="text-xs text-base-content/60 mt-1 max-w-xs">
                Send a greeting or image to start the conversation in {selectedUser?.fullName || selectedGroup?.name}!
              </p>
            </div>
          </div>
        ) : (
          messageList.map((m) => {
            const mine = toIdStr(m.senderId) === myId;
            const senderPhoto = mine
              ? authUser?.profilePic || "/avatar.png"
              : selectedGroup
                ? (m.senderId?.profilePic || "/avatar.png")
                : (selectedUser?.profilePic || "/avatar.png");
            
            const senderName = mine
              ? "You"
              : selectedGroup
                ? (m.senderId?.fullName || "Member")
                : (selectedUser?.fullName || "User");

            return (
              <div key={m._id || m.clientTempId} className={`chat ${mine ? "chat-end" : "chat-start"} animate-in fade-in duration-200`}>
                <div className="chat-image avatar">
                  <div className="size-9 rounded-full border border-base-300 overflow-hidden shadow-xs">
                    <img src={senderPhoto} alt={senderName} className="object-cover w-full h-full" />
                  </div>
                </div>

                <div className="chat-header mb-1 text-[11px] text-base-content/60 flex items-center gap-1.5 px-1 font-medium">
                  {selectedGroup && !mine && (
                    <span className="font-bold text-base-content/80">{senderName}</span>
                  )}
                  {!mine && <time>{formatMessageTime(m.createdAt)}</time>}
                </div>

                <div
                  className={`chat-bubble flex flex-col gap-2 max-w-[85%] sm:max-w-[75%] break-words shadow-sm ${
                    mine
                      ? "bg-primary text-primary-content rounded-2xl rounded-tr-xs"
                      : "bg-base-200/90 text-base-content border border-base-300/80 rounded-2xl rounded-tl-xs"
                  }`}
                >
                  {m.image && (
                    <div className="relative group overflow-hidden rounded-xl">
                      <img
                        src={m.image}
                        alt="Attachment"
                        className="w-full max-w-md object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                    </div>
                  )}
                  {m.text && <p className="text-sm leading-relaxed break-words">{m.text}</p>}
                </div>

                {/* Chat Footer with Timestamp & Delivery/Read Checkmark Indicators */}
                <div className="chat-footer text-[11px] text-base-content/60 flex items-center gap-1.5 mt-1 px-1 font-medium select-none">
                  {mine && <time>{formatMessageTime(m.createdAt)}</time>}
                  {mine && renderStatusIndicator(m)}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <MessageInput />
    </div>
  );
}

