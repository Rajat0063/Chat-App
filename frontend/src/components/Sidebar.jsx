import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Users, Search, Plus, UserCheck, MessageSquare, Radio, X } from "lucide-react";
import { useChatStore, toIdStr } from "../store/useChatStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import SidebarSkeleton from "./skeletons/SidebarSkeleton.jsx";

const Sidebar = React.memo(function Sidebar() {
  const getUsers = useChatStore((state) => state.getUsers);
  const users = useChatStore((state) => state.users);
  const selectedUser = useChatStore((state) => state.selectedUser);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const isUsersLoading = useChatStore((state) => state.isUsersLoading);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const initGlobalSocketListeners = useChatStore((state) => state.initGlobalSocketListeners);
  const getGroups = useChatStore((state) => state.getGroups);
  const groups = useChatStore((state) => state.groups);
  const setSelectedGroup = useChatStore((state) => state.setSelectedGroup);
  const selectedGroup = useChatStore((state) => state.selectedGroup);
  const createGroup = useChatStore((state) => state.createGroup);
  const requestJoinGroup = useChatStore((state) => state.requestJoinGroup);
  const { onlineUsers, authUser, socket } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'direct' | 'groups'
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newGroupAvatar, setNewGroupAvatar] = useState(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => { getUsers(); }, [getUsers]);
  useEffect(() => { getGroups(); }, [getGroups]);
  useEffect(() => {
    if (socket && initGlobalSocketListeners) initGlobalSocketListeners();
  }, [socket, initGlobalSocketListeners]);

  const safeGroups = Array.isArray(groups) ? groups : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeOnlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [];
  const counts = unreadCounts || {};
  const myUserId = toIdStr(authUser?._id);
  const getUnread = (item) => {
    if (!item) return 0;
    const id = (item._id?._id || item._id)?.toString();
    const raw = counts[id] ?? counts[item._id] ?? 0;
    return Math.max(0, Number(raw) || 0);
  };

  const isMemberOfGroup = (group) => Boolean(
    group?.isMember ||
    group?.isOwner ||
    (Array.isArray(group?.members) && group.members.some((member) => toIdStr(member?._id || member) === myUserId))
  );

  const directUnreadTotal = safeUsers.reduce((sum, user) => sum + getUnread(user), 0);
  const groupUnreadTotal = safeGroups.reduce((sum, group) => {
    const isMember = isMemberOfGroup(group);
    if (!isMember) return sum;

    const isOwner = Boolean(group?.isOwner);
    const pendingCount = Number(group?.pendingRequestsCount || 0);
    const messageCount = getUnread(group);
    const effectiveCount = isOwner && pendingCount > 0 ? pendingCount : messageCount;
    return sum + effectiveCount;
  }, 0);
  const totalUnread = directUnreadTotal + groupUnreadTotal;

  const trimmedSearch = searchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => safeUsers.filter((u) => {
    const matchesOnline = showOnlineOnly ? safeOnlineUsers.includes(u._id) : true;
    const matchesSearch = !trimmedSearch || u.fullName?.toLowerCase().includes(trimmedSearch)
      || u.email?.toLowerCase().includes(trimmedSearch)
      || u.about?.toLowerCase().includes(trimmedSearch);
    return matchesOnline && matchesSearch;
  }), [safeUsers, safeOnlineUsers, showOnlineOnly, trimmedSearch]);

  const filteredGroups = useMemo(() => safeGroups
    .filter((g) => isMemberOfGroup(g))
    .filter((g) => {
      if (!trimmedSearch) return true;
      return g.name?.toLowerCase().includes(trimmedSearch)
        || g.description?.toLowerCase().includes(trimmedSearch)
        || g.members?.some((member) => (member?.fullName || member?.name || "").toLowerCase().includes(trimmedSearch));
    }), [safeGroups, trimmedSearch, myUserId]);

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full flex-none w-20 sm:w-28 md:w-72 lg:w-80 bg-base-100/50 flex flex-col transition-all duration-200 overflow-x-hidden min-w-0 border-r border-base-300/70">
      {/* Top Header */}
      <div className="p-3 sm:p-4 border-b border-base-300/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative p-2 rounded-xl bg-primary/10 text-primary hidden md:flex items-center justify-center shrink-0">
              <MessageSquare className="size-5" />
              {totalUnread > 0 && <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary ring-2 ring-base-100" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-base hidden md:block tracking-tight">Messages</h2>
                {totalUnread > 0 && <span className="badge badge-primary badge-xs font-bold rounded-full">{totalUnread > 99 ? "99+" : totalUnread}</span>}
              </div>
              <p className="text-[11px] text-base-content/60 hidden md:block">
                {safeOnlineUsers.length > 0 ? `${Math.max(0, safeOnlineUsers.length - 1)} online now` : "Workspace Chat"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen((open) => !open)}
            className={`btn btn-ghost btn-sm btn-square md:hidden shrink-0 ${isMobileSearchOpen || searchQuery ? "text-primary bg-primary/10" : "text-base-content/70"}`}
            title="Filter conversations"
            aria-label="Filter conversations"
          >
            <Search className="size-4" />
          </button>
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="btn btn-primary btn-sm btn-square md:w-auto rounded-xl gap-1 shadow-sm hover:scale-[1.02] transition-transform shrink-0 md:px-3"
            title="Create new group room"
          >
            <Plus className="size-4" />
            <span className="hidden md:inline font-medium">New Group</span>
          </button>
        </div>

        {/* Search Bar - Filter direct messages and group chats by name */}
        <div className={`space-y-1.5 ${isMobileSearchOpen || searchQuery ? "block" : "hidden md:block"}`}>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-base-content/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search participant or group title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchQuery("");
              }}
              className="input input-sm input-bordered w-full pl-9 pr-8 rounded-xl text-xs bg-base-200/50 focus:bg-base-100 transition-colors"
              aria-label="Filter direct messages and group chats by name"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-base-content/40 hover:text-base-content transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="hidden md:flex items-center justify-between text-[11px] text-base-content/60 px-1">
              <span>
                Found: <strong className="text-primary">{filteredUsers.length}</strong> direct,{" "}
                <strong className="text-primary">{filteredGroups.length}</strong> groups
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[10px] text-primary hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Tabs & Online Filter */}
        <div className="hidden md:flex flex-col gap-2 pt-1">
          <div className="grid grid-cols-3 gap-1 p-1 bg-base-200/70 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab("all")}
              className={`py-1 rounded-lg text-center transition-all ${activeTab === "all" ? "bg-base-100 font-semibold shadow-xs text-primary" : "text-base-content/70 hover:text-base-content"}`}
            >
              All {trimmedSearch ? `(${filteredUsers.length + filteredGroups.length})` : ""} {totalUnread > 0 && <span className="badge badge-primary badge-xs">{totalUnread > 99 ? "99+" : totalUnread}</span>}
            </button>
            <button
              onClick={() => setActiveTab("direct")}
              className={`py-1 rounded-lg text-center transition-all ${activeTab === "direct" ? "bg-base-100 font-semibold shadow-xs text-primary" : "text-base-content/70 hover:text-base-content"}`}
            >
              Direct {trimmedSearch ? `(${filteredUsers.length})` : ""} {directUnreadTotal > 0 && <span className="badge badge-primary badge-xs">{directUnreadTotal > 99 ? "99+" : directUnreadTotal}</span>}
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`py-1 rounded-lg text-center transition-all ${activeTab === "groups" ? "bg-base-100 font-semibold shadow-xs text-primary" : "text-base-content/70 hover:text-base-content"}`}
            >
              Groups {trimmedSearch ? `(${filteredGroups.length})` : ""} {groupUnreadTotal > 0 && <span className="badge badge-primary badge-xs">{groupUnreadTotal > 99 ? "99+" : groupUnreadTotal}</span>}
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-base-content/70">
            <label className="cursor-pointer flex items-center gap-2 select-none hover:text-base-content transition-colors">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-xs checkbox-primary rounded"
              />
              <span>Online only</span>
            </label>
            {safeOnlineUsers.length > 1 && (
              <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Groups Section */}
        {(activeTab === "all" || activeTab === "groups") && filteredGroups.length > 0 && (
          <div className="space-y-1 mb-3">
            <div className="px-3 py-1 text-[11px] font-bold text-base-content/40 uppercase tracking-wider hidden md:block">
              Group Rooms ({filteredGroups.length})
            </div>
            {filteredGroups.map((g) => {
              const gId = toIdStr(g._id);
              const isSelected = toIdStr(selectedGroup?._id) === gId;
              const gTypers = (gId && typingUsers[gId]) || {};
              const gTypingCount = Object.keys(gTypers).length;
              const pendingRequestCount = Number(g.pendingRequestsCount || 0);
              const unreadCount = g.isOwner && pendingRequestCount > 0 ? pendingRequestCount : getUnread(g);
              const hasUnread = unreadCount > 0;
              const isMember = Boolean(g.isMember || g.isOwner || (Array.isArray(g.members) && g.members.some((member) => toIdStr(member?._id || member) === myUserId)));
              const joinRequestStatus = g.joinRequestStatus || (Array.isArray(g.joinRequests) ? (g.joinRequests.find((entry) => toIdStr(entry?.user?._id || entry?.user) === myUserId)?.status || null) : null);
              return (
                <button
                  key={g._id}
                  onClick={() => {
                    if (!isMember) {
                      if (joinRequestStatus === "pending") return;
                      requestJoinGroup(g._id);
                      return;
                    }
                    setSelectedGroup(g);
                  }}
                  className={`w-full p-2.5 flex items-center gap-3 rounded-xl transition-all duration-150 text-left relative ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary shadow-xs"
                      : unreadCount > 0
                      ? "bg-primary/5 hover:bg-primary/10 text-base-content border-l-2 border-primary/70 font-medium"
                      : "hover:bg-base-200/70 text-base-content/80"
                  }`}
                >
                  <div className="relative size-11 sm:size-12 rounded-xl overflow-hidden bg-base-200 flex-shrink-0 border border-base-300">
                    <img src={g.avatar || "/avatar.png"} alt={g.name} className="w-full h-full object-cover" />
                    {hasUnread && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-content text-[10px] font-bold flex items-center justify-center md:hidden">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                  </div>
                  <div className="hidden md:flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-semibold text-sm truncate ${unreadCount > 0 ? "font-bold text-base-content" : ""}`}>{g.name}</span>
                      {unreadCount > 0 ? <span className="badge badge-primary badge-sm rounded-full">{unreadCount > 99 ? "99+" : unreadCount}</span> : <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-base-300 text-base-content/70">{g.members?.length || 0}m</span>}
                    </div>
                    {gTypingCount > 0 ? (
                      <p className="text-xs text-primary font-medium truncate flex items-center gap-1">
                        <span>typing...</span>
                      </p>
                    ) : (
                      <p className="text-xs text-base-content/60 truncate font-normal">
                        {!isMember && joinRequestStatus === "pending"
                          ? "Request pending"
                          : !isMember
                            ? "Tap to request access"
                            : (g.isOwner && pendingRequestCount > 0
                              ? `${pendingRequestCount} join request${pendingRequestCount > 1 ? "s" : ""} pending`
                              : (unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? "s" : ""}` : g.description || "Group discussion"))}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Direct Messages Section */}
        {(activeTab === "all" || activeTab === "direct") && filteredUsers.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold text-base-content/40 uppercase tracking-wider hidden md:block">
              Direct Messages ({filteredUsers.length})
            </div>
            {filteredUsers.map((u) => {
              const uId = toIdStr(u._id);
              const isSelected = toIdStr(selectedUser?._id) === uId;
              const isOnline = safeOnlineUsers.map(toIdStr).includes(uId);
              const unreadCount = getUnread(u);
              const hasUnread = unreadCount > 0;
              const uTypers = (uId && typingUsers[uId]) || {};
              const isUserTyping = Boolean(uTypers[uId]) || Object.keys(uTypers).some((id) => id !== toIdStr(authUser?._id));
              return (
                <button
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full p-2.5 flex items-center gap-3 rounded-xl transition-all duration-150 text-left relative ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary shadow-xs"
                      : unreadCount > 0
                      ? "bg-primary/5 hover:bg-primary/10 text-base-content border-l-2 border-primary/70 font-medium"
                      : "hover:bg-base-200/70 text-base-content/80"
                  }`}
                >
                  <div className="relative size-11 sm:size-12 rounded-full bg-base-200 flex-shrink-0 border border-base-300">
                    <img src={u.profilePic || "/avatar.png"} alt={u.fullName} className="w-full h-full object-cover rounded-full" />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full ring-2 ring-base-100" />
                    )}
                    {hasUnread && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-content text-[10px] font-bold flex items-center justify-center md:hidden">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                  </div>
                  <div className="hidden md:flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-semibold text-sm truncate ${unreadCount > 0 ? "font-bold text-base-content" : ""}`}>{u.fullName}</span>
                      {isOnline && (
                        <span className="text-[10px] text-emerald-500 font-medium">Online</span>
                      )}
                      {hasUnread ? (
                        <span
                          id={`sidebar-unread-badge-user-${u._id}`}
                          className="inline-flex items-center justify-center px-2 py-0.5 min-w-[22px] h-5 rounded-full text-[11px] font-extrabold bg-primary text-primary-content shadow-sm animate-in zoom-in-75 duration-150"
                          title={`${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`}
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      ) : null}
                    </div>
                    {isUserTyping ? (
                      <p className="text-xs text-primary font-medium truncate flex items-center gap-1">
                        <span>typing...</span>
                      </p>
                    ) : (
                      <p className="text-xs text-base-content/60 truncate font-normal">
                        {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? "s" : ""}` : u.about || (isOnline ? "Active now" : "Offline")}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty Search Result State */}
        {!filteredUsers.length && !filteredGroups.length && (
          <div className="text-center py-8 px-4 text-base-content/60 space-y-2">
            <UserCheck className="size-8 mx-auto opacity-40" />
            <p className="text-xs font-medium">
              {searchQuery ? `No chats found matching "${searchQuery}"` : "No conversations found"}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="btn btn-xs btn-ghost text-primary"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {isCreateGroupOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md sm:max-w-lg rounded-3xl bg-base-100 shadow-2xl border border-base-300 flex flex-col overflow-hidden max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 bg-base-100 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-base-content">Create Group Room</h3>
                <p className="text-xs text-base-content/60">Set up a space for team chats or topic channels</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
                  Group Name
                </label>
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="input input-bordered w-full rounded-xl text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Design Team, Project Alpha"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="textarea textarea-bordered w-full rounded-xl text-sm h-20 focus:outline-none focus:border-primary resize-none"
                  placeholder="What is this group for?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-2">
                  Group Avatar
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative size-16 rounded-2xl overflow-hidden bg-base-200 border border-base-300 flex-shrink-0">
                    <img src={newGroupAvatar || "/avatar.png"} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <label className="btn btn-outline btn-sm rounded-xl cursor-pointer hover:bg-primary hover:text-white transition-colors">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 4 * 1024 * 1024) return alert("Image must be under 4MB");
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => setNewGroupAvatar(reader.result);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-2">
                  Select Members
                </label>
                <div className="max-h-48 overflow-y-auto border border-base-200 rounded-xl p-2 space-y-1 bg-base-200/40">
                  {users.filter(u => u._id !== authUser?._id).map((u) => (
                    <label key={u._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-base-100 cursor-pointer text-sm transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u._id)}
                        onChange={() => setSelectedMembers((s) => s.includes(u._id) ? s.filter(id => id !== u._id) : [...s, u._id])}
                        className="checkbox checkbox-sm checkbox-primary rounded"
                      />
                      <img src={u.profilePic || "/avatar.png"} alt={u.fullName} className="size-8 rounded-full object-cover border border-base-300" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{u.fullName}</p>
                        <p className="text-xs text-base-content/60 truncate">{u.email || "Member"}</p>
                      </div>
                    </label>
                  ))}
                  {users.filter(u => u._id !== authUser?._id).length === 0 && (
                    <p className="text-xs text-center text-base-content/50 py-3">No other members available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-base-200/50 border-t border-base-200 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="btn btn-ghost rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newGroupName.trim()) return alert("Please enter a group name");
                  setIsCreatingGroup(true);
                  await createGroup({ name: newGroupName.trim(), members: selectedMembers, avatar: newGroupAvatar, description: newGroupDesc.trim() });
                  setIsCreatingGroup(false);
                  setNewGroupName("");
                  setNewGroupDesc("");
                  setSelectedMembers([]);
                  setNewGroupAvatar(null);
                  setIsCreateGroupOpen(false);
                }}
                className="btn btn-primary rounded-xl text-sm px-5"
                disabled={isCreatingGroup}
              >
                {isCreatingGroup ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
});

export default Sidebar;

