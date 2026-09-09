import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MessageSquare, Sparkles, Check, CheckCheck, Clock, ChevronDown } from "lucide-react";
import ChatHeader from "./ChatHeader.jsx";
import MessageInput from "./MessageInput.jsx";
import MessageSkeleton from "./skeletons/MessageSkeleton.jsx";
import ChatSearchBanner from "./ChatSearchBanner.jsx";
import HighlightedText from "./HighlightedText.jsx";
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
    isChatSearchOpen,
    chatSearchQuery,
    setChatSearchOpen,
    setChatSearchQuery,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const endRef = useRef(null);
  const containerRef = useRef(null);
  const activeUserId = toIdStr(selectedUser?._id);
  const activeGroupId = toIdStr(selectedGroup?._id);
  const messageList = Array.isArray(messages) ? messages : [];
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const matchingMessages = useMemo(() => {
    const query = chatSearchQuery.trim().toLowerCase();
    if (!query) return [];
    return messageList.filter((message) => message.text?.toLowerCase().includes(query));
  }, [messageList, chatSearchQuery]);
  const currentMatch = matchingMessages[currentMatchIndex];

  // Auto-scroll state: track if user manually scrolled up
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [unreadBelowCount, setUnreadBelowCount] = useState(0);

  const isScrolledUpRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);
  const prevConversationIdRef = useRef("");

  useEffect(() => {
    setCurrentMatchIndex(matchingMessages.length ? matchingMessages.length - 1 : 0);
  }, [chatSearchQuery, matchingMessages.length]);

  useEffect(() => {
    if (!isChatSearchOpen || !currentMatch?._id) return;
    document.getElementById(`msg-${currentMatch._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentMatch, isChatSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setChatSearchOpen(true);
      } else if (event.key === "Escape" && isChatSearchOpen) {
        setChatSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChatSearchOpen, setChatSearchOpen]);

  const handleNextMatch = () => {
    if (matchingMessages.length > 1) setCurrentMatchIndex((index) => (index + 1) % matchingMessages.length);
  };

  const handlePreviousMatch = () => {
    if (matchingMessages.length > 1) setCurrentMatchIndex((index) => (index - 1 + matchingMessages.length) % matchingMessages.length);
  };

  const handleCloseSearch = () => {
    setChatSearchOpen(false);
    setChatSearchQuery("");
  };

  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior });
    } else if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
    setIsScrolledUp(false);
    isScrolledUpRef.current = false;
    setUnreadBelowCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Buffer: if user is more than 120px above the bottom, consider them scrolled up
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isUp = distanceFromBottom > 120;

    isScrolledUpRef.current = isUp;
    setIsScrolledUp(isUp);

    if (!isUp) {
      setUnreadBelowCount(0);
    }
  }, []);

  // Reset scroll state on switching conversations
  const currentChatId = activeUserId || activeGroupId;
  useEffect(() => {
    if (prevConversationIdRef.current !== currentChatId) {
      prevConversationIdRef.current = currentChatId;
      setIsScrolledUp(false);
      isScrolledUpRef.current = false;
      setUnreadBelowCount(0);
      prevMessagesLengthRef.current = 0;
    }
  }, [currentChatId]);

  useEffect(() => {
    const socket = useAuthStore.getState().socket;

    if (activeGroupId) {
      if (socket && socket.connected) {
        socket.emit("enterChat", { type: "group", id: activeGroupId });
      }
      getGroupMessages(activeGroupId);
      subscribeToGroupMessages();
      markGroupMessagesAsRead(activeGroupId);

      return () => {
        if (socket && socket.connected) {
          socket.emit("leaveChat");
        }
        unsubscribeFromMessages();
      };
    }

    if (activeUserId) {
      if (socket && socket.connected) {
        socket.emit("enterChat", { type: "direct", id: activeUserId });
      }
      getMessages(activeUserId);
      subscribeToMessages();
      markMessagesAsRead(activeUserId);

      return () => {
        if (socket && socket.connected) {
          socket.emit("leaveChat");
        }
        unsubscribeFromMessages();
      };
    }
  }, [activeUserId, activeGroupId]);

  // Intelligent auto-scroll on new message sent or received
  useEffect(() => {
    if (!messages || messages.length === 0) {
      prevMessagesLengthRef.current = 0;
      return;
    }

    const prevCount = prevMessagesLengthRef.current;
    const currentCount = messages.length;
    const myId = toIdStr(authUser?._id);

    // Initial conversation load: immediately scroll to bottom
    if (prevCount === 0) {
      prevMessagesLengthRef.current = currentCount;
      const raf = requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
      return () => cancelAnimationFrame(raf);
    }

    if (currentCount > prevCount) {
      const latestMessage = messages[currentCount - 1];
      const isSentByMe = toIdStr(latestMessage?.senderId) === myId || Boolean(latestMessage?.isSending);

      if (isSentByMe) {
        // Current user sent a message: always auto-scroll to reveal it
        scrollToBottom("smooth");
      } else {
        // Message received from contact/group member
        if (!isScrolledUpRef.current) {
          // User is already at the bottom: auto-scroll smoothly to newest content
          scrollToBottom("smooth");
        } else {
          // User is manually scrolled up reading past history:
          // Preserve their scroll position so reading isn't interrupted, and notify
          setUnreadBelowCount((prev) => prev + (currentCount - prevCount));
        }
      }
    } else if (currentCount === prevCount) {
      // Message status changed (e.g. read status or delivery update)
      // Keep pinned to bottom only if user was already at the bottom
      if (!isScrolledUpRef.current && containerRef.current) {
        const el = containerRef.current;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distanceFromBottom < 150) {
          scrollToBottom("auto");
        }
      }
    }

    prevMessagesLengthRef.current = currentCount;
  }, [messages, authUser?._id, scrollToBottom]);

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
    <div className="flex-1 flex min-h-0 flex-col overflow-hidden bg-base-100/30 relative">
      <ChatHeader />

      {isChatSearchOpen && (
        <ChatSearchBanner
          query={chatSearchQuery}
          setQuery={setChatSearchQuery}
          matchCount={matchingMessages.length}
          currentMatchIndex={currentMatchIndex}
          onNextMatch={handleNextMatch}
          onPrevMatch={handlePreviousMatch}
          onClose={handleCloseSearch}
        />
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4"
      >
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
            const isSearchMatch = isChatSearchOpen
              && Boolean(chatSearchQuery.trim())
              && m.text?.toLowerCase().includes(chatSearchQuery.trim().toLowerCase());
            const isCurrentSearchMatch = isSearchMatch && currentMatch?._id === m._id;

            return (
              <div id={`msg-${m._id || m.clientTempId}`} key={m._id || m.clientTempId} className={`chat ${mine ? "chat-end" : "chat-start"} animate-in fade-in duration-200`}>
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
                  } ${isCurrentSearchMatch
                    ? "ring-4 ring-amber-400 ring-offset-2 ring-offset-base-100 scale-[1.02] shadow-xl"
                    : isSearchMatch
                      ? "ring-2 ring-amber-300/70 shadow-md"
                      : ""}`}
                >
                  {m.image && (
                    <div className="relative group overflow-hidden rounded-xl">
                      <img
                        src={m.image}
                        alt="Attachment"
                        onLoad={() => {
                          if (!isScrolledUpRef.current) {
                            scrollToBottom("auto");
                          }
                        }}
                        className="w-full max-w-md object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                    </div>
                  )}
                  {m.text && (
                    <p className="text-sm leading-relaxed break-words">
                      <HighlightedText
                        text={m.text}
                        query={isChatSearchOpen ? chatSearchQuery : ""}
                        isCurrentMatch={currentMatch?._id === m._id}
                      />
                    </p>
                  )}
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

      {/* Floating Scroll to Bottom Indicator Button */}
      {isScrolledUp && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-20 right-4 sm:right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-100/90 hover:bg-base-100 border border-base-300 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 text-xs font-semibold backdrop-blur-md text-base-content select-none animate-in fade-in slide-in-from-bottom-2"
          title="Scroll to latest message"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="size-4 text-primary" />
          {unreadBelowCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-bold">
                {unreadBelowCount} new {unreadBelowCount === 1 ? "message" : "messages"}
              </span>
            </span>
          ) : (
            <span className="text-base-content/80">Scroll to bottom</span>
          )}
        </button>
      )}

      <MessageInput />
    </div>
  );
}

