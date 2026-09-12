import React from "react";
import { useState, useRef, useEffect } from "react";
import { MoreVertical, Search, X, Loader2, Camera } from "lucide-react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore, toIdStr } from "../store/useChatStore.js";
import { useThemeStore } from "../store/useThemeStore.js";

export default function ChatHeader() {
  const selectedUser = useChatStore((state) => state.selectedUser);
  const selectedGroup = useChatStore((state) => state.selectedGroup);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const setSelectedGroup = useChatStore((state) => state.setSelectedGroup);
  const blockedUsers = useChatStore((state) => state.blockedUsers);
  const toggleBlockUser = useChatStore((state) => state.toggleBlockUser);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const leaveGroup = useChatStore((state) => state.leaveGroup);
  const addGroupMembers = useChatStore((state) => state.addGroupMembers);
  const updateGroup = useChatStore((state) => state.updateGroup);
  const deleteGroupConversation = useChatStore((state) => state.deleteGroupConversation);
  const deleteGroup = useChatStore((state) => state.deleteGroup);
  const users = useChatStore((state) => state.users);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const isChatSearchOpen = useChatStore((state) => state.isChatSearchOpen);
  const setChatSearchOpen = useChatStore((state) => state.setChatSearchOpen);
  const { onlineUsers, authUser } = useAuthStore();
  const { theme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmActionLabel, setConfirmActionLabel] = useState("Confirm");
  const [actionLoading, setActionLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [groupName, setGroupName] = useState(selectedGroup?.name || "");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  if (!selectedUser && !selectedGroup) return null;
  const selectedUserId = toIdStr(selectedUser?._id);
  const selectedGroupId = toIdStr(selectedGroup?._id);
  const authUserId = toIdStr(authUser?._id);

  // Real-time typing indicators
  const directTypers = (selectedUserId && typingUsers[selectedUserId]) || {};
  const isDirectTyping = Boolean(directTypers[selectedUserId]) || Object.keys(directTypers).some((uId) => uId !== authUserId);

  const groupTypers = (selectedGroupId && typingUsers[selectedGroupId]) || {};
  const groupTypingNames = Object.entries(groupTypers)
    .filter(([uId]) => uId !== authUserId)
    .map(([, info]) => info.userName)
    .filter(Boolean);
  const isGroupTyping = groupTypingNames.length > 0;

  const groupOwnerId = toIdStr(selectedGroup?.owner?._id || selectedGroup?.owner);
  const isGroupOwner = selectedGroup && authUser ? groupOwnerId === authUserId : false;
  const isBlocked = selectedUserId ? blockedUsers.includes(selectedUserId) : false;

  useEffect(() => {
    if (selectedGroup) {
      setGroupName(selectedGroup.name || "");
      setSelectedMemberIds([]);
    }
  }, [selectedGroup]);

  useEffect(() => {
    setMenuOpen(false);
  }, [selectedUser, selectedGroup]);

  const handleToggleBlock = async () => {
    setMenuOpen(false);
    setActionLoading(true);
    await toggleBlockUser();
    setActionLoading(false);
  };

  const openConfirmDialog = ({ title, message, action, actionLabel = "Confirm" }) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmActionLabel(actionLabel);
    setConfirmOpen(true);
    setMenuOpen(false);
  };

  const handleDeleteConversation = async () => {
    setActionLoading(true);
    await deleteConversation();
    setActionLoading(false);
  };

  const handleClearGroupConversation = async () => {
    setActionLoading(true);
    await deleteGroupConversation(selectedGroup._id);
    setActionLoading(false);
  };

  const handleGroupAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return alert("Image must be under 4MB");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setAvatarUploading(true);
      try {
        await updateGroup(selectedGroup._id, { avatar: base64 });
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGroupRename = async () => {
    setActionLoading(true);
    await updateGroup(selectedGroup._id, { name: groupName.trim() });
    setActionLoading(false);
  };

  const handleAddMembers = async () => {
    if (!selectedGroup || !selectedMemberIds.length) return;
    setActionLoading(true);
    await addGroupMembers(selectedGroup._id, selectedMemberIds);
    setSelectedMemberIds([]);
    setAddMembersOpen(false);
    setActionLoading(false);
  };

  const groupMemberIds = new Set((selectedGroup?.members || []).map((member) => typeof member === "string" ? member : member._id?.toString()));
  const availableUsers = users.filter((user) => !groupMemberIds.has(user._id?.toString()));

  useEffect(() => {
    if (!menuOpen) return setMenuPos(null);
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = 224;
    const left = Math.max(8, rect.right - width + window.scrollX);
    const top = rect.bottom + 8 + window.scrollY;
    setMenuPos({ left, top });

    const handleResize = () => {
      const r = btn.getBoundingClientRect();
      setMenuPos({ left: Math.max(8, r.right - width + window.scrollX), top: r.bottom + 8 + window.scrollY });
    };

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && !buttonRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const renderMenu = () => {
    if (!menuOpen || !menuPos) return null;
    return createPortal(
      <div
        ref={menuRef}
        data-theme={theme}
        style={{ top: menuPos.top, left: menuPos.left, width: 224 }}
        className="fixed z-50 rounded-2xl border bg-base-100 shadow-xl"
      >
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            setChatSearchOpen(true);
          }}
          className="w-full text-left px-4 py-2.5 hover:bg-base-200 flex items-center gap-2.5 text-base-content/80 font-medium border-b border-base-200"
        >
          <Search className="size-3.5 text-primary" />
          <span>Search in conversation</span>
        </button>
        {selectedUser ? (
          <>
            <button type="button" onClick={() => { setProfileOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-base-200">View profile</button>
            <button type="button" onClick={handleToggleBlock} disabled={actionLoading} className="w-full text-left px-4 py-3 hover:bg-base-200">{isBlocked ? "Unblock user" : "Block user"}</button>
            <button type="button" onClick={() => openConfirmDialog({
              title: "Delete conversation",
              message: "This cannot be undone.",
              action: handleDeleteConversation,
              actionLabel: "Delete"
            })} disabled={actionLoading} className="w-full text-left px-4 py-3 text-error hover:bg-error/10">Delete conversation</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => { setMembersOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-base-200">View members</button>
            <button type="button" onClick={() => { setAddMembersOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-base-200">Add members</button>
            <button type="button" onClick={() => openConfirmDialog({
              title: "Clear conversation",
              message: "Clear this group conversation for you?",
              action: handleClearGroupConversation,
              actionLabel: "Clear"
            })} disabled={actionLoading} className="w-full text-left px-4 py-3 hover:bg-base-200">Clear conversation</button>
            {isGroupOwner && (
              <button type="button" onClick={() => openConfirmDialog({
                title: "Delete group",
                message: "This will delete the group for all members. Are you sure?",
                action: async () => { await deleteGroup(selectedGroup._id); setSelectedGroup(null); },
                actionLabel: "Delete"
              })} className="w-full text-left px-4 py-3 text-error hover:bg-error/10">Delete group</button>
            )}
            <button type="button" onClick={async () => { setMenuOpen(false); await leaveGroup(selectedGroup._id); setSelectedGroup(null); }} className="w-full text-left px-4 py-3 text-error hover:bg-error/10">Leave group</button>
          </>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div className="relative flex-shrink-0 px-4 py-3 border-b border-base-300/80 bg-base-100/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedUser ? (
            <>
              <button
                type="button"
                onClick={() => setAvatarOpen(true)}
                className="relative cursor-pointer transition hover:opacity-90 flex-shrink-0"
              >
                <div className="size-11 rounded-full overflow-hidden border border-base-300 bg-base-200">
                  <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                </div>
                {onlineUsers.includes(selectedUserId) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full ring-2 ring-base-100" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="flex-1 min-w-0 text-left transition hover:opacity-80 group"
              >
                <h3 className="font-bold text-sm sm:text-base text-base-content truncate group-hover:text-primary transition-colors">
                  {selectedUser.fullName}
                </h3>
                <p className="text-xs text-base-content/60 truncate flex items-center gap-1.5 font-medium">
                  {isDirectTyping ? (
                    <span className="text-primary font-semibold flex items-center gap-1.5 transition-all">
                      <span>typing</span>
                      <span className="inline-flex items-center gap-0.5">
                        <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                        <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <span className="size-1 rounded-full bg-primary animate-bounce" />
                      </span>
                    </span>
                  ) : onlineUsers.includes(selectedUserId) ? (
                    <>
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-500 font-semibold">Active now</span>
                    </>
                  ) : (
                    "Offline"
                  )}
                </p>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setAvatarOpen(true)}
                className="relative cursor-pointer transition hover:opacity-90 flex-shrink-0"
              >
                <div className="size-11 rounded-xl overflow-hidden border border-base-300 bg-base-200">
                  <img src={selectedGroup.avatar || "/avatar.png"} alt={selectedGroup.name} className="w-full h-full object-cover" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="flex-1 min-w-0 text-left transition hover:opacity-80 group"
              >
                <h3 className="font-bold text-sm sm:text-base text-base-content truncate group-hover:text-primary transition-colors">
                  {selectedGroup.name}
                </h3>
                <p className="text-xs text-base-content/60 truncate flex items-center gap-1.5 font-medium">
                  {isGroupTyping ? (
                    <span className="text-primary font-semibold flex items-center gap-1.5 transition-all">
                      <span className="truncate max-w-[180px] sm:max-w-xs">
                        {groupTypingNames.length === 1
                          ? `${groupTypingNames[0]} is typing`
                          : groupTypingNames.length === 2
                          ? `${groupTypingNames[0]} and ${groupTypingNames[1]} are typing`
                          : `${groupTypingNames[0]} and ${groupTypingNames.length - 1} others are typing`}
                      </span>
                      <span className="inline-flex items-center gap-0.5 flex-shrink-0">
                        <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                        <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <span className="size-1 rounded-full bg-primary animate-bounce" />
                      </span>
                    </span>
                  ) : (
                    `Group Room • ${selectedGroup.members?.length || 0} members`
                  )}
                </p>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            id="chat-search-toggle-btn"
            type="button"
            onClick={() => setChatSearchOpen(!isChatSearchOpen)}
            className={`btn btn-ghost btn-sm btn-circle transition-colors ${
              isChatSearchOpen ? "text-primary bg-primary/15" : "text-base-content/70 hover:text-base-content"
            }`}
            title="Search in conversation"
            aria-label="Search in conversation"
          >
            <Search className="size-4 sm:size-5" />
          </button>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content"
            aria-label="Conversation actions"
          >
            <MoreVertical className="size-5" />
          </button>
          <button
            onClick={() => { setSelectedUser(null); setSelectedGroup(null); }}
            className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content"
            title="Close conversation"
          >
            <X className="size-5" />
          </button>

          {renderMenu()}
        </div>
      </div>

      {/* Profile Details Modal */}
      {profileOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-base-100 shadow-2xl border border-base-300 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 bg-base-100 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-base-content">
                  {selectedUser ? selectedUser.fullName : selectedGroup?.name}
                </h3>
                <p className="text-xs text-base-content/60">
                  {selectedUser ? "User Profile Information" : "Group Room Details"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Main Avatar Center */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative inline-flex group">
                  <button
                    type="button"
                    onClick={() => setAvatarOpen(true)}
                    className="relative size-28 rounded-full overflow-hidden border-2 border-primary/20 p-1 bg-base-200 hover:opacity-95 transition-opacity"
                    title="Click to expand view"
                  >
                    <img
                      src={selectedUser ? (selectedUser.profilePic || "/avatar.png") : (selectedGroup?.avatar || "/avatar.png")}
                      alt={selectedUser ? selectedUser.fullName : selectedGroup?.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </button>

                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <Loader2 className="size-8 animate-spin text-white" />
                    </div>
                  )}

                  {!selectedUser && isGroupOwner && (
                    <label className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-content shadow-lg cursor-pointer hover:scale-105 transition-transform">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleGroupAvatarChange}
                        disabled={actionLoading || avatarUploading}
                      />
                      <Camera className="size-4" />
                    </label>
                  )}
                </div>

                <h4 className="mt-3 font-bold text-lg text-base-content">
                  {selectedUser ? selectedUser.fullName : selectedGroup?.name}
                </h4>
                <p className="text-xs text-base-content/60">
                  {selectedUser
                    ? (onlineUsers.includes(selectedUserId) ? "Active Now" : "Offline")
                    : `${selectedGroup?.members?.length || 0} Members`}
                </p>
              </div>

              {/* Details Cards */}
              <div className="space-y-3">
                {selectedUser ? (
                  <>
                    <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-300/80">
                      <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider block mb-0.5">
                        Email Address
                      </span>
                      <p className="text-sm font-medium text-base-content">{selectedUser.email || "Not specified"}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-300/80">
                      <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider block mb-0.5">
                        About / Bio
                      </span>
                      <p className="text-sm text-base-content/80 leading-relaxed">
                        {selectedUser.about || "No bio provided yet."}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-300/80 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider">
                        Online Status
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        onlineUsers.includes(selectedUserId)
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-base-300 text-base-content/60"
                      }`}>
                        {onlineUsers.includes(selectedUserId) ? "Online" : "Offline"}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-300/80">
                      <label className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider block mb-1">
                        Group Name
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="input input-sm input-bordered flex-1 rounded-xl text-sm"
                          disabled={!isGroupOwner}
                        />
                        {isGroupOwner && (
                          <button
                            onClick={handleGroupRename}
                            disabled={actionLoading || !groupName.trim()}
                            className="btn btn-primary btn-sm rounded-xl text-xs"
                          >
                            Save
                          </button>
                        )}
                      </div>
                      {!isGroupOwner && (
                        <p className="text-[11px] text-base-content/50 mt-1">Only owner can rename group.</p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-300/80">
                      <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider block mb-1">
                        Group Owner
                      </span>
                      <p className="text-sm font-medium text-base-content">
                        {selectedGroup?.owner?.fullName || "Group owner"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-300/80 space-y-2">
                      <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider block">
                        Members ({selectedGroup?.members?.length || 0})
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {(selectedGroup?.members || []).map((member) => {
                          const id = typeof member === "string" ? member : member._id?.toString();
                          const name = typeof member === "string" ? member : member.fullName;
                          const avatar = typeof member === "string" ? "/avatar.png" : member.profilePic || "/avatar.png";
                          return (
                            <div key={id} className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-base-100 transition-colors">
                              <img src={avatar} alt={name} className="size-8 rounded-full object-cover border border-base-300" />
                              <span className="text-xs font-semibold text-base-content truncate flex-1">{name}</span>
                              {selectedGroup?.owner?._id?.toString() === id && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">Owner</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-base-200/50 border-t border-base-200 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="btn btn-ghost rounded-xl text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Members List Modal */}
      {membersOpen && selectedGroup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-base-100 p-6 shadow-2xl border border-base-300 max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0 border-b border-base-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-base-content">Group Members</h3>
                <p className="text-xs text-base-content/60">{selectedGroup.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setMembersOpen(false)}
                className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {(selectedGroup.members || []).map((member) => {
                const id = typeof member === "string" ? member : member._id;
                const name = typeof member === "string" ? member : member.fullName;
                const avatar = typeof member === "string" ? "/avatar.png" : member.profilePic || "/avatar.png";
                return (
                  <div key={id} className="flex items-center gap-3 rounded-2xl border border-base-300/80 p-3 bg-base-200/30">
                    <img src={avatar} alt={name} className="size-10 rounded-full object-cover border border-base-300" />
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{name}</div>
                      <div className="text-xs text-base-content/60">
                        {selectedGroup.owner?._id?.toString() === id ? "Owner" : "Member"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Members Modal */}
      {addMembersOpen && selectedGroup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-base-100 p-6 shadow-2xl border border-base-300 max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0 border-b border-base-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-base-content">Add Members</h3>
                <p className="text-xs text-base-content/60">Select users to add to {selectedGroup.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAddMembersOpen(false)}
                className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 mb-4 pr-1">
              {availableUsers.length ? availableUsers.map((user) => {
                const isSelected = selectedMemberIds.includes(user._id);
                return (
                  <label key={user._id} className="flex items-center gap-3 rounded-2xl border border-base-300/80 p-3 cursor-pointer hover:bg-base-200/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedMemberIds((prev) => prev.includes(user._id) ? prev.filter((id) => id !== user._id) : [...prev, user._id]);
                      }}
                      className="checkbox checkbox-sm checkbox-primary rounded"
                    />
                    <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-10 rounded-full object-cover border border-base-300" />
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{user.fullName}</div>
                      <div className="text-xs text-base-content/60 truncate">{user.email || "User"}</div>
                    </div>
                  </label>
                );
              }) : (
                <div className="text-center py-6 text-xs text-base-content/50">No available users to add</div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddMembers}
              disabled={!selectedMemberIds.length || actionLoading}
              className="btn btn-primary rounded-xl w-full text-sm font-semibold flex-shrink-0"
            >
              {actionLoading ? "Adding..." : `Add ${selectedMemberIds.length} Member${selectedMemberIds.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Dialog Modal */}
      {confirmOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-base-100 border border-base-300 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-base-content">{confirmTitle}</h3>
                <p className="text-xs text-base-content/60 mt-1">{confirmMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="btn btn-ghost rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirmAction) return;
                  setActionLoading(true);
                  await confirmAction();
                  setActionLoading(false);
                  setConfirmOpen(false);
                }}
                className="btn btn-primary rounded-xl text-sm px-5"
                disabled={actionLoading}
              >
                {actionLoading ? "Working..." : confirmActionLabel}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Avatar Full Preview Modal */}
      {avatarOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setAvatarOpen(false)}
        >
          <div
            className="relative max-w-xl w-full flex flex-col items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setAvatarOpen(false)}
              className="absolute -top-12 right-0 z-50 btn btn-circle btn-sm btn-ghost text-white hover:bg-white/20"
              aria-label="Close avatar preview"
            >
              <X className="size-6" />
            </button>
            <div className="overflow-hidden rounded-3xl shadow-2xl border border-white/10 bg-black flex items-center justify-center">
              <img
                src={selectedUser ? (selectedUser.profilePic || "/avatar.png") : (selectedGroup?.avatar || "/avatar.png")}
                alt={selectedUser ? selectedUser.fullName : selectedGroup?.name}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl"
              />
            </div>
            <div className="mt-3 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold tracking-wide">
              {selectedUser ? selectedUser.fullName : selectedGroup?.name}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
