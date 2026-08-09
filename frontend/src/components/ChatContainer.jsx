import React, { useEffect, useRef } from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import ChatHeader from "./ChatHeader.jsx";
import MessageInput from "./MessageInput.jsx";
import MessageSkeleton from "./skeletons/MessageSkeleton.jsx";
import { useChatStore } from "../store/useChatStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { formatMessageTime } from "../lib/utils.js";

export default function ChatContainer() {
  const { messages, getMessages, getGroupMessages, isMessagesLoading, selectedUser, selectedGroup,
    subscribeToMessages, unsubscribeFromMessages, subscribeToGroupMessages } = useChatStore();
  const { authUser } = useAuthStore();
  const endRef = useRef(null);

  useEffect(() => {
    if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
      subscribeToGroupMessages();
      return () => unsubscribeFromMessages();
    }
    if (!selectedUser) return;
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, selectedGroup, getMessages, getGroupMessages, subscribeToMessages, subscribeToGroupMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (endRef.current && messages) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
            const mine = m.senderId === authUser._id || m.senderId?._id === authUser._id;
            const senderPhoto = mine
              ? authUser.profilePic || "/avatar.png"
              : selectedGroup
                ? (m.senderId?.profilePic || "/avatar.png")
                : (selectedUser?.profilePic || "/avatar.png");
            
            const senderName = mine
              ? "You"
              : selectedGroup
                ? (m.senderId?.fullName || "Member")
                : (selectedUser?.fullName || "User");

            return (
              <div key={m._id} className={`chat ${mine ? "chat-end" : "chat-start"} animate-in fade-in duration-200`}>
                <div className="chat-image avatar">
                  <div className="size-9 rounded-full border border-base-300 overflow-hidden shadow-xs">
                    <img src={senderPhoto} alt={senderName} className="object-cover w-full h-full" />
                  </div>
                </div>

                <div className="chat-header mb-1 text-[11px] text-base-content/60 flex items-center gap-1.5 px-1 font-medium">
                  {selectedGroup && !mine && (
                    <span className="font-bold text-base-content/80">{senderName}</span>
                  )}
                  <time>{formatMessageTime(m.createdAt)}</time>
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

