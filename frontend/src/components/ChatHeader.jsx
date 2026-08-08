import { useState, useRef, useEffect } from "react";
import { MoreVertical, X, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { useThemeStore } from "../store/useThemeStore.js";

export default function ChatHeader() {
  const { selectedUser, selectedGroup, setSelectedUser, setSelectedGroup, blockedUsers, toggleBlockUser, deleteConversation, leaveGroup, addGroupMembers, updateGroup, deleteGroupConversation, deleteGroup, users } = useChatStore();
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
  const selectedUserId = selectedUser?._id?.toString();
  const groupOwnerId = selectedGroup?.owner?._id?.toString() || selectedGroup?.owner?.toString();
  const isGroupOwner = selectedGroup && authUser ? groupOwnerId === authUser._id?.toString() : false;
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
            {isGroupOwner && (
              <button type="button" onClick={() => openConfirmDialog({
                title: "Delete group",
                message: "This will delete the group for all members. Are you sure?",
                action: async () => { await deleteGroup(selectedGroup._id); setSelectedGroup(null); },
                actionLabel: "Delete"
              })} className="w-full text-left px-4 py-3 text-error hover:bg-error/10">Delete group</button>
            )}
            <button type="button" onClick={async () => { setMenuOpen(false); await leaveGroup(selectedGroup._id); setSelectedGroup(null); }} className="w-full text-left px-4 py-3 text-error hover:bg-error/10">Leave group</button>
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
    const width = 224; // w-56
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
            <button type="button" onClick={async () => { setMenuOpen(false); await leaveGroup(selectedGroup._id); setSelectedGroup(null); }} className="w-full text-left px-4 py-3 text-error hover:bg-error/10">Leave group</button>
          </>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div className="relative flex-shrink-0 p-2.5 border-b border-base-300 bg-base-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-full">
          {selectedUser ? (
            <>
              <button type="button" onClick={() => setAvatarOpen(true)} className="avatar cursor-pointer rounded-full p-1 transition hover:bg-base-200 flex-shrink-0">
                <div className="size-10 rounded-full relative overflow-hidden">
                  <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                </div>
              </button>
              <button type="button" onClick={() => setProfileOpen(true)} className="flex-1 min-w-0 w-full rounded-2xl p-3 text-left transition hover:bg-base-200">
                <h3 className="font-medium truncate">{selectedUser.fullName}</h3>
                <p className="text-sm text-base-content/70 truncate">
                  {onlineUsers.includes(selectedUserId) ? "Online" : "Offline"}
                </p>
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setAvatarOpen(true)} className="avatar cursor-pointer rounded-full p-1 transition hover:bg-base-200 flex-shrink-0">
                <div className="size-10 rounded-full relative overflow-hidden">
                  <img src={selectedGroup.avatar || "/avatar.png"} alt={selectedGroup.name} className="w-full h-full object-cover" />
                </div>
              </button>
              <button type="button" onClick={() => setProfileOpen(true)} className="flex-1 min-w-0 w-full rounded-2xl p-3 text-left transition hover:bg-base-200">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{selectedGroup.name}</h3>
                  <p className="text-sm text-base-content/70 truncate">Group • {selectedGroup.members?.length || 0} members</p>
                </div>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Conversation actions"
          >
            <MoreVertical />
          </button>
          <button onClick={() => { setSelectedUser(null); setSelectedGroup(null); }} className="btn btn-ghost btn-sm btn-circle">
            <X />
          </button>

{renderMenu()}
        </div>
      </div>

      {profileOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 p-4">
          <div className="mx-auto flex w-full max-w-[95vw] sm:max-w-md max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl bg-base-100 shadow-2xl">
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-base-200 p-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedUser ? selectedUser.fullName : selectedGroup.name}</h2>
                  <p className="text-sm text-base-content/70">{selectedUser ? "Conversation partner profile" : "Group details"}</p>
                </div>
                <button type="button" onClick={() => setProfileOpen(false)} className="btn btn-ghost btn-sm btn-circle">
                  <X />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className="mt-6 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="relative inline-flex">
                    <button type="button" onClick={() => setAvatarOpen(true)} className="rounded-full transition hover:ring-2 hover:ring-primary focus:outline-none">
                      <img
                        src={selectedUser ? (selectedUser.profilePic || "/avatar.png") : (selectedGroup.avatar || "/avatar.png")}
                        alt={selectedUser ? selectedUser.fullName : selectedGroup.name}
                        className="size-28 rounded-full object-cover"
                      />
                    </button>
                    {avatarUploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                        <Loader2 className="size-12 animate-spin text-white" />
                      </div>
                    )}
                    {!selectedUser && isGroupOwner && (
                      <label className={`absolute right-0 bottom-0 rounded-full bg-base-200 p-2 cursor-pointer ${actionLoading || avatarUploading ? "pointer-events-none opacity-60" : "hover:bg-base-300"}`}>
                        <input type="file" accept="image/*" className="hidden" onChange={handleGroupAvatarChange} disabled={actionLoading || avatarUploading} />
                        Change
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-3 w-full mt-6">
                  {selectedUser ? (
                    <>
                      <div className="rounded-2xl border border-base-300 p-4 text-left">
                        <p className="text-sm text-zinc-500">Name</p>
                        <p className="font-medium">{selectedUser.fullName}</p>
                      </div>
                      {selectedUser.about && (
                        <div className="rounded-2xl border border-base-300 p-4 text-left">
                          <p className="text-sm text-zinc-500">About</p>
                          <p>{selectedUser.about}</p>
                        </div>
                      )}
                      <div className="rounded-2xl border border-base-300 p-4 text-left">
                        <p className="text-sm text-zinc-500">Status</p>
                        <p>{onlineUsers.includes(selectedUserId) ? "Online" : "Offline"}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-base-300 p-4 text-left">
                        <label className="text-sm text-zinc-500 block mb-2">Group name</label>
                        <input
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="input input-bordered w-full"
                          disabled={!isGroupOwner}
                        />
                        <button
                          onClick={handleGroupRename}
                          disabled={actionLoading || !groupName.trim() || !isGroupOwner}
                          className="btn btn-primary btn-sm mt-3"
                        >
                          {actionLoading ? "Saving..." : "Save name"}
                        </button>
                        {!isGroupOwner && <p className="text-xs text-zinc-500 mt-2">Only the group owner can change name or avatar.</p>}
                      </div>
                      <div className="rounded-2xl border border-base-300 p-4 text-left">
                        <p className="text-sm text-zinc-500">Owner</p>
                        <p>{selectedGroup.owner?.fullName || "Group owner"}</p>
                      </div>
                      {isGroupOwner && (
                        <div className="rounded-2xl border border-base-300 p-4 text-left">
                          <p className="text-sm text-zinc-500">Danger zone</p>
                          <div className="mt-3 grid gap-3 sm:flex sm:items-center sm:justify-start">
                            <button onClick={() => openConfirmDialog({
                              title: "Delete group",
                              message: "Deleting the group will remove it for all members. This cannot be undone.",
                              action: async () => { await deleteGroup(selectedGroup._id); setProfileOpen(false); setSelectedGroup(null); },
                              actionLabel: "Delete"
                            })} className="btn btn-error w-full sm:w-auto">Delete group</button>
                            <button onClick={async () => { await leaveGroup(selectedGroup._id); setProfileOpen(false); setSelectedGroup(null); }} className="btn btn-ghost w-full sm:w-auto">Leave group</button>
                          </div>
                        </div>
                      )}
                      <div className="rounded-2xl border border-base-300 p-4 text-left">
                        <p className="text-sm text-zinc-500">Members ({selectedGroup.members?.length || 0})</p>
                        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                          {(selectedGroup.members || []).map((member) => {
                            const id = typeof member === "string" ? member : member._id?.toString();
                            const name = typeof member === "string" ? member : member.fullName;
                            const avatar = typeof member === "string" ? "/avatar.png" : member.profilePic || "/avatar.png";
                            return (
                              <div key={id} className="flex items-center gap-3">
                                <img src={avatar} alt={name} className="size-10 rounded-full object-cover" />
                                <span>{name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {membersOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl bg-base-100 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Group members</h2>
                <p className="text-sm text-base-content/70">{selectedGroup.name}</p>
              </div>
              <button type="button" onClick={() => setMembersOpen(false)} className="btn btn-ghost btn-sm btn-circle">
                <X />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(selectedGroup.members || []).map((member) => {
                const id = typeof member === "string" ? member : member._id;
                const name = typeof member === "string" ? member : member.fullName;
                const avatar = typeof member === "string" ? "/avatar.png" : member.profilePic || "/avatar.png";
                return (
                  <div key={id} className="flex items-center gap-3 rounded-2xl border border-base-300 p-3">
                    <img src={avatar} alt={name} className="size-12 rounded-full object-cover" />
                    <div className="text-left">
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-zinc-500">{selectedGroup.owner?._id?.toString() === id ? "Owner" : "Member"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {addMembersOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl bg-base-100 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Add members</h2>
                <p className="text-sm text-base-content/70">Select users to invite to {selectedGroup.name}</p>
              </div>
              <button type="button" onClick={() => setAddMembersOpen(false)} className="btn btn-ghost btn-sm btn-circle">
                <X />
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
              {availableUsers.length ? availableUsers.map((user) => {
                const isSelected = selectedMemberIds.includes(user._id);
                return (
                  <label key={user._id} className="flex items-center gap-3 rounded-2xl border border-base-300 p-3 cursor-pointer hover:bg-base-200">
                    <input type="checkbox" checked={isSelected} onChange={() => {
                      setSelectedMemberIds((prev) => prev.includes(user._id) ? prev.filter((id) => id !== user._id) : [...prev, user._id]);
                    }} className="checkbox" />
                    <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-12 rounded-full object-cover" />
                    <div className="text-left">
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-zinc-500">{user.email || "User"}</div>
                    </div>
                  </label>
                );
              }) : (
                <div className="text-center text-zinc-500">No available users to add.</div>
              )}
            </div>
            <button type="button" onClick={handleAddMembers} disabled={!selectedMemberIds.length || actionLoading}
              className="btn btn-primary w-full">
              {actionLoading ? "Adding..." : `Add ${selectedMemberIds.length} member${selectedMemberIds.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-base-100 border border-base-200 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold">{confirmTitle}</h2>
                <p className="text-sm text-zinc-500">{confirmMessage}</p>
              </div>
              <button type="button" onClick={() => setConfirmOpen(false)} className="btn btn-ghost btn-sm btn-circle">
                <X />
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmOpen(false)} className="btn btn-ghost">Cancel</button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirmAction) return;
                  setActionLoading(true);
                  await confirmAction();
                  setActionLoading(false);
                  setConfirmOpen(false);
                }}
                className="btn btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? "Working..." : confirmActionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {avatarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setAvatarOpen(false)}
              className="absolute right-4 top-4 z-50 btn btn-ghost btn-circle"
              aria-label="Close avatar preview"
            >
              <X />
            </button>
            <img
              src={selectedUser ? (selectedUser.profilePic || "/avatar.png") : (selectedGroup.avatar || "/avatar.png")}
              alt={selectedUser ? selectedUser.fullName : selectedGroup.name}
              className="w-full max-h-[85vh] object-contain bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}