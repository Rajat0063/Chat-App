import { useEffect, useRef } from "react";
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
      <div className="flex-1 flex min-h-0 flex-col overflow-hidden">
        <ChatHeader />
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 sm:p-4">
          <MessageSkeleton />
        </div>
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0 flex-col overflow-hidden">
      <ChatHeader />
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4 space-y-4">
        {(Array.isArray(messages) ? messages : []).map((m) => {
          const mine = m.senderId === authUser._id || m.senderId?._id === authUser._id;
          const senderPhoto = mine
            ? authUser.profilePic || "/avatar.png"
            : selectedGroup
              ? (m.senderId?.profilePic || "/avatar.png")
              : (selectedUser?.profilePic || "/avatar.png");
          return (
            <div key={m._id} className={`chat ${mine ? "chat-end" : "chat-start"}`}>
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border overflow-hidden">
                  <img src={senderPhoto} alt="" className="object-cover" />
                </div>
              </div>
              <div className="chat-header mb-1 flex flex-wrap items-center gap-2">
                {selectedGroup && !mine && (
                  <span className="text-xs opacity-60">{m.senderId?.fullName || "Member"}</span>
                )}
                <time className="text-xs opacity-50">{formatMessageTime(m.createdAt)}</time>
              </div>
              <div className="chat-bubble flex flex-col gap-2 max-w-[85%] sm:max-w-[80%] break-words">
                {m.image && (
                  <img src={m.image} alt="attachment" className="w-full max-w-full rounded-md mb-2" />
                )}
                {m.text && <p className="break-words">{m.text}</p>}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <MessageInput />
    </div>
  );
}
