import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import SidebarSkeleton from "./skeletons/SidebarSkeleton.jsx";

export default function Sidebar() {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { getGroups, groups, setSelectedGroup, selectedGroup, createGroup } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [newGroupAvatar, setNewGroupAvatar] = useState(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const { authUser } = useAuthStore();

  useEffect(() => { getUsers(); }, [getUsers]);
  useEffect(() => { getGroups(); }, [getGroups]);

  const filtered = showOnlineOnly ? users.filter((u) => onlineUsers.includes(u._id)) : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full flex-none w-20 sm:w-24 md:w-64 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 overflow-x-hidden min-w-0">
      <div className="border-b border-base-300 w-full p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input type="checkbox" checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)} className="checkbox checkbox-sm" />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({Math.max(0, onlineUsers.length - 1)} online)</span>
        </div>
      </div>
      <div className="overflow-y-auto w-full py-3 px-2 min-w-0">
        <div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-sm px-1 pb-3 mb-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <button onClick={() => setIsCreateGroupOpen(true)}
              title="New group"
              className="btn btn-primary p-2 sm:px-3 sm:py-2 sm:rounded-full flex items-center justify-center gap-2">
              <Users className="size-7" />
              <span className="hidden md:inline">New group</span>
            </button>
          </div>
        </div>
        <div className="space-y-2 mb-3">
          {groups.map((g) => (
            <button key={g._id} onClick={() => setSelectedGroup(g)}
              className={`w-full p-3 min-h-[4rem] flex items-center gap-3 justify-center sm:justify-start rounded-xl hover:bg-base-300 transition-colors ${selectedGroup?._id === g._id ? "bg-base-300" : ""}`}>
              <div className="relative mx-auto sm:mx-0 size-12 sm:size-14 rounded-full overflow-hidden bg-base-200 flex-shrink-0">
                <img src={g.avatar || "/avatar.png"} alt={g.name} className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:flex flex-col text-left min-w-0 flex-1">
                <div className="font-medium truncate">{g.name}</div>
                <div className="text-xs text-zinc-500">{g.members?.length || 0} members</div>
              </div>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {filtered.map((u) => (
            <button key={u._id} onClick={() => setSelectedUser(u)}
              className={`w-full p-3 min-h-[4rem] flex items-center gap-3 justify-center sm:justify-start hover:bg-base-300 transition-colors rounded-xl ${selectedUser?._id === u._id ? "bg-base-300 ring-1 ring-base-300" : ""}`}>
              <div className="relative mx-auto sm:mx-0 size-12 sm:size-14 rounded-full overflow-visible bg-base-200 flex-shrink-0">
                <img src={u.profilePic || "/avatar.png"} alt={u.fullName} className="w-full h-full object-cover rounded-full" />
                {onlineUsers.includes(u._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100 z-10" />
                )}
              </div>
              <div className="hidden sm:block lg:block text-left min-w-0 flex-1">
                <div className="font-medium truncate">{u.fullName}</div>
                <div className="text-sm text-zinc-400 truncate">{onlineUsers.includes(u._id) ? "Online" : "Offline"}</div>
              </div>
            </button>
          ))}
        </div>
        {!filtered.length && <div className="text-center text-zinc-500 py-4">No users</div>}
      </div>

      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full h-full sm:h-auto max-w-full sm:max-w-lg md:max-w-2xl rounded-3xl bg-base-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-base-200">
              <div>
                <h3 className="text-lg font-semibold">Create group</h3>
                <p className="text-sm text-base-content/60">Add name, avatar, description and members.</p>
              </div>
              <button type="button" onClick={() => setIsCreateGroupOpen(false)} className="btn btn-ghost btn-sm btn-circle">×</button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <label className="block text-sm text-zinc-500">Group name</label>
                  <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                    className="input input-bordered w-full" placeholder="Enter group name" />

                  <label className="block text-sm text-zinc-500">Description (optional)</label>
                  <textarea value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="textarea textarea-bordered w-full" placeholder="Add a short description" />

                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">Group avatar (optional)</label>
                    <div className="flex items-center gap-3">
                      <div className="relative size-20 rounded-full overflow-hidden bg-base-200">
                        <img src={newGroupAvatar || "/avatar.png"} alt="preview" className="w-full h-full object-cover" />
                      </div>
                      <label className="btn btn-sm btn-ghost">
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          if (file.size > 4 * 1024 * 1024) return alert("Image must be under 4MB");
                          const reader = new FileReader(); reader.readAsDataURL(file);
                          reader.onload = () => setNewGroupAvatar(reader.result);
                        }} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <label className="block text-sm text-zinc-500">Add members</label>
                  <div className="flex-1 overflow-y-auto border border-base-200 rounded-md p-2" style={{ maxHeight: 320 }}>
                    {users.filter(u => u._id !== authUser?._id).map((u) => (
                      <label key={u._id} className="flex items-center gap-2 p-2 rounded hover:bg-base-200 cursor-pointer">
                        <input type="checkbox" checked={selectedMembers.includes(u._id)}
                          onChange={() => setSelectedMembers((s) => s.includes(u._id) ? s.filter(id => id !== u._id) : [...s, u._id])}
                          className="checkbox checkbox-sm" />
                        <img src={u.profilePic || "/avatar.png"} alt={u.fullName} className="w-8 h-8 rounded-full" />
                        <span className="text-sm truncate">{u.fullName}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-auto flex justify-end gap-2">
                    <button type="button" onClick={() => setIsCreateGroupOpen(false)} className="btn btn-ghost">Cancel</button>
                    <button type="button" onClick={async () => {
                      if (!newGroupName.trim()) return alert("Please enter a group name");
                      setIsCreatingGroup(true);
                      await createGroup({ name: newGroupName.trim(), members: selectedMembers, avatar: newGroupAvatar, description: newGroupDesc.trim() });
                      setIsCreatingGroup(false);
                      setNewGroupName(""); setNewGroupDesc(""); setSelectedMembers([]); setNewGroupAvatar(null);
                      setIsCreateGroupOpen(false);
                    }} className="btn btn-primary" disabled={isCreatingGroup}>
                      {isCreatingGroup ? "Creating..." : "Create group"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}