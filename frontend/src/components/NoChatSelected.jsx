import React, { useState, useEffect } from "react";
import {
  MessageSquare, ShieldCheck, Zap, Image, Users, Sparkles, UserCheck,
  PlusCircle, Database, Search, ArrowRight, Bookmark, CheckCircle2,
  RefreshCw, Lock, Radio, Activity, Copy, Check
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { axiosInstance } from "../lib/axios.js";

export default function NoChatSelected() {
  const { authUser, onlineUsers } = useAuthStore();
  const { users, groups, setSelectedUser, setSelectedGroup } = useChatStore();

  const [activeTab, setActiveTab] = useState("overview"); // overview, notes, otp
  const [searchTerm, setSearchTerm] = useState("");
  
  // Scratchpad Notes State
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("chatty_scratchpad_notes");
      return saved ? JSON.parse(saved) : [
        { id: "1", title: "Meeting Agenda", content: "Discuss real-time socket performance and MongoDB OTP persistence.", date: "Today" },
        { id: "2", title: "Project Links", content: "Repo: Chatty Realtime App with JWT & Socket.io", date: "Yesterday" }
      ];
    } catch {
      return [];
    }
  });
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // OTP DB Debug State
  const [otpDebugEmail, setOtpDebugEmail] = useState(authUser?.email || "");
  const [otpDebugData, setOtpDebugData] = useState(null);
  const [isLoadingOtpDebug, setIsLoadingOtpDebug] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState("");

  useEffect(() => {
    localStorage.setItem("chatty_scratchpad_notes", JSON.stringify(notes));
  }, [notes]);

  const safeOnlineCount = Math.max(0, (onlineUsers?.length || 0) - 1);

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    const item = {
      id: Date.now().toString(),
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotes([item, ...notes]);
    setNewNoteTitle("");
    setNewNoteContent("");
    toast.success("Note saved to scratchpad!");
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter((n) => n.id !== id));
    toast.success("Note removed");
  };

  const fetchOtpDebug = async () => {
    if (!otpDebugEmail.trim()) return toast.error("Please enter an email");
    setIsLoadingOtpDebug(true);
    try {
      const res = await axiosInstance.get(`/auth/debug-otp?email=${encodeURIComponent(otpDebugEmail.trim())}`);
      setOtpDebugData(res.data);
      toast.success("Fetched MongoDB OTP Records!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch OTP status");
    } finally {
      setIsLoadingOtpDebug(false);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedOtp(code);
    toast.success("Code copied!");
    setTimeout(() => setCopiedOtp(""), 2000);
  };

  return (
    <div className="w-full flex flex-1 flex-col p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-base-100/60 via-base-100 to-base-200/40 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-base-100/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-base-300/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="size-14 sm:size-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 p-0.5 shadow-lg shadow-primary/20">
                <div className="w-full h-full bg-base-100 rounded-[14px] flex items-center justify-center">
                  <MessageSquare className="size-7 text-primary" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex size-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-4 bg-emerald-500 border-2 border-base-100" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Welcome, {authUser?.fullName || "User"}
                </h1>
                <span className="badge badge-primary badge-outline text-[10px] font-bold">Pro Workspace</span>
              </div>
              <p className="text-xs sm:text-sm text-base-content/60 mt-1">
                Real-time Chat, Group Channels & Database Integrated Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <Radio className="size-3.5 animate-pulse" />
              <span>Realtime Engine Active</span>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-base-300/80 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("overview")}
            className={`btn btn-sm rounded-xl gap-2 transition-all ${
              activeTab === "overview" ? "btn-primary shadow-sm" : "btn-ghost text-base-content/70"
            }`}
          >
            <Activity className="size-4" />
            <span>Overview & Quick Start</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`btn btn-sm rounded-xl gap-2 transition-all ${
              activeTab === "notes" ? "btn-primary shadow-sm" : "btn-ghost text-base-content/70"
            }`}
          >
            <Bookmark className="size-4" />
            <span>Workspace Scratchpad</span>
            {notes.length > 0 && <span className="badge badge-sm badge-neutral">{notes.length}</span>}
          </button>

          <button
            onClick={() => setActiveTab("otp")}
            className={`btn btn-sm rounded-xl gap-2 transition-all ${
              activeTab === "otp" ? "btn-primary shadow-sm" : "btn-ghost text-base-content/70"
            }`}
          >
            <Database className="size-4" />
            <span>MongoDB OTP Inspector</span>
            <span className="badge badge-xs badge-success">Saved in DB</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-base-100 p-4 rounded-2xl border border-base-300/80 shadow-xs flex flex-col">
                <span className="text-xs text-base-content/60 font-medium">Total Contacts</span>
                <span className="text-2xl font-black text-primary mt-1">{users?.length || 0}</span>
                <span className="text-[10px] text-emerald-500 font-semibold mt-2 flex items-center gap-1">
                  <UserCheck className="size-3" /> Ready to chat
                </span>
              </div>

              <div className="bg-base-100 p-4 rounded-2xl border border-base-300/80 shadow-xs flex flex-col">
                <span className="text-xs text-base-content/60 font-medium">Online Members</span>
                <span className="text-2xl font-black text-emerald-500 mt-1">{safeOnlineCount}</span>
                <span className="text-[10px] text-emerald-500 font-semibold mt-2 flex items-center gap-1">
                  <Zap className="size-3" /> Socket Connected
                </span>
              </div>

              <div className="bg-base-100 p-4 rounded-2xl border border-base-300/80 shadow-xs flex flex-col">
                <span className="text-xs text-base-content/60 font-medium">Group Channels</span>
                <span className="text-2xl font-black text-indigo-500 mt-1">{groups?.length || 0}</span>
                <span className="text-[10px] text-indigo-500 font-semibold mt-2 flex items-center gap-1">
                  <Users className="size-3" /> Rooms available
                </span>
              </div>

              <div className="bg-base-100 p-4 rounded-2xl border border-base-300/80 shadow-xs flex flex-col">
                <span className="text-xs text-base-content/60 font-medium">Message Engine</span>
                <span className="text-2xl font-black text-emerald-500 mt-1">0ms</span>
                <span className="text-[10px] text-emerald-500 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Deduplication Guard
                </span>
              </div>
            </div>

            {/* Quick Search Contacts & Groups */}
            <div className="bg-base-100 p-5 rounded-2xl border border-base-300/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-bold text-base">Quick Start Conversations</h3>
                  <p className="text-xs text-base-content/60">Click any contact or group to open instant real-time chat</p>
                </div>
                
                <div className="relative w-full sm:w-64">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Search people or groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input input-sm w-full pl-9 rounded-xl border-base-300 text-xs"
                  />
                </div>
              </div>

              {/* Online / Popular Users List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-base-content/70 uppercase tracking-wider">People ({filteredUsers.length})</div>
                {filteredUsers.length === 0 ? (
                  <div className="text-xs text-base-content/50 py-3 text-center bg-base-200/40 rounded-xl">No users found</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredUsers.map((u) => {
                      const isOnline = onlineUsers?.includes(u._id);
                      return (
                        <div
                          key={u._id}
                          onClick={() => setSelectedUser(u)}
                          className="flex items-center justify-between p-3 rounded-xl bg-base-200/40 hover:bg-base-200 border border-base-300/60 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <img
                                src={u.profilePic || "/avatar.png"}
                                alt={u.fullName}
                                className="size-10 rounded-full object-cover border border-base-300"
                              />
                              {isOnline && (
                                <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-base-100" />
                              )}
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-xs truncate group-hover:text-primary transition-colors">{u.fullName}</div>
                              <div className="text-[10px] text-base-content/60 truncate">{u.email}</div>
                            </div>
                          </div>

                          <button className="btn btn-xs btn-primary rounded-lg opacity-80 group-hover:opacity-100">
                            <span>Chat</span>
                            <ArrowRight className="size-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Groups List */}
              {filteredGroups.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-base-200">
                  <div className="text-xs font-bold text-base-content/70 uppercase tracking-wider">Group Rooms ({filteredGroups.length})</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredGroups.map((g) => (
                      <div
                        key={g._id}
                        onClick={() => setSelectedGroup(g)}
                        className="flex items-center justify-between p-3 rounded-xl bg-base-200/40 hover:bg-base-200 border border-base-300/60 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm border border-indigo-500/20">
                            <Users className="size-5" />
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs truncate group-hover:text-indigo-500 transition-colors">{g.name}</div>
                            <div className="text-[10px] text-base-content/60 truncate">{g.members?.length || 1} members</div>
                          </div>
                        </div>

                        <button className="btn btn-xs btn-outline btn-secondary rounded-lg">
                          <span>Join</span>
                          <ArrowRight className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Production Quality Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-base-100 border border-base-300/80 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Zap className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Instant Delivery</div>
                  <div className="text-[11px] text-base-content/60 mt-0.5">Socket.IO real-time broadcast</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-base-100 border border-base-300/80 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Anti-Duplication</div>
                  <div className="text-[11px] text-base-content/60 mt-0.5">Client Temp ID & Store Guards</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-base-100 border border-base-300/80 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Database className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">MongoDB Stored OTP</div>
                  <div className="text-[11px] text-base-content/60 mt-0.5">Audited & saved on User & Otp schemas</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCRATCHPAD NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-base-100 p-5 rounded-2xl border border-base-300/80 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Bookmark className="size-4 text-primary" /> Workspace Scratchpad & Drafts
                </h3>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Save personal notes, message drafts, code snippets, or agendas locally in your session.
                </p>
              </div>

              <form onSubmit={handleAddNote} className="space-y-3 bg-base-200/50 p-4 rounded-xl border border-base-300/60">
                <input
                  type="text"
                  placeholder="Note Title (e.g., Team Sync Notes)"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="input input-sm w-full rounded-lg border-base-300 text-xs font-semibold"
                />
                <textarea
                  placeholder="Write your draft message or workspace reminder here..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={2}
                  className="textarea textarea-sm w-full rounded-lg border-base-300 text-xs"
                />
                <div className="flex justify-end">
                  <button type="submit" disabled={!newNoteTitle.trim() || !newNoteContent.trim()} className="btn btn-sm btn-primary rounded-xl gap-1">
                    <PlusCircle className="size-4" /> Save Note
                  </button>
                </div>
              </form>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-base-content/70">Saved Notes ({notes.length})</div>
                {notes.length === 0 ? (
                  <div className="text-xs text-base-content/50 py-6 text-center bg-base-200/30 rounded-xl">No saved notes yet</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {notes.map((n) => (
                      <div key={n.id} className="p-4 rounded-xl bg-base-200/40 border border-base-300/80 relative flex flex-col justify-between gap-2 group">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-primary">{n.title}</h4>
                            <span className="text-[10px] text-base-content/50">{n.date}</span>
                          </div>
                          <p className="text-xs text-base-content/80 mt-1 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-base-300/40">
                          <button onClick={() => handleDeleteNote(n.id)} className="text-[11px] text-error hover:underline">
                            Delete Note
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OTP MONGODB INSPECTOR */}
        {activeTab === "otp" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-base-100 p-5 rounded-2xl border border-base-300/80 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Database className="size-5" /> MongoDB OTP Persistence Inspector
                  </h3>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Verify that OTPs are actively stored in both MongoDB <code className="bg-base-200 px-1 py-0.5 rounded font-mono">otps</code> collection AND <code className="bg-base-200 px-1 py-0.5 rounded font-mono">users</code> schema fields (<code className="bg-base-200 px-1 py-0.5 rounded font-mono">verificationOtp</code>).
                  </p>
                </div>

                <div className="badge badge-success gap-1 text-[10px] py-2 px-3 font-bold">
                  <CheckCircle2 className="size-3" /> MongoDB Active
                </div>
              </div>

              {/* Email lookup form */}
              <div className="flex items-center gap-2 bg-base-200/60 p-3 rounded-xl border border-base-300/70">
                <input
                  type="email"
                  placeholder="Enter user email (e.g. test@example.com)..."
                  value={otpDebugEmail}
                  onChange={(e) => setOtpDebugEmail(e.target.value)}
                  className="input input-sm flex-1 rounded-lg border-base-300 text-xs font-mono"
                />
                <button onClick={fetchOtpDebug} disabled={isLoadingOtpDebug} className="btn btn-sm btn-primary rounded-lg gap-1">
                  {isLoadingOtpDebug ? <RefreshCw className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                  <span>Inspect Database</span>
                </button>
              </div>

              {/* Inspection Results */}
              {otpDebugData && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* User Schema OTP Fields */}
                    <div className="p-4 rounded-xl bg-base-200/50 border border-base-300/80 space-y-2">
                      <div className="text-xs font-bold text-primary flex items-center justify-between">
                        <span>User Document Schema Fields</span>
                        <span className="text-[10px] text-base-content/60 font-normal">Collection: 'users'</span>
                      </div>
                      <div className="text-xs space-y-1 font-mono bg-base-100 p-2.5 rounded-lg border border-base-300">
                        <div><span className="text-base-content/60">verificationOtp:</span> <strong className="text-emerald-500">{otpDebugData.userFieldOtpInDb?.verificationOtp || "(cleared after verify)"}</strong></div>
                        <div><span className="text-base-content/60">verificationOtpExpires:</span> {otpDebugData.userFieldOtpInDb?.verificationOtpExpires ? new Date(otpDebugData.userFieldOtpInDb.verificationOtpExpires).toLocaleTimeString() : "N/A"}</div>
                        <div><span className="text-base-content/60">isVerified:</span> {otpDebugData.userFieldOtpInDb?.isVerified ? "true ✅" : "false ⏳"}</div>
                        <div><span className="text-base-content/60">resetOtp:</span> {otpDebugData.userFieldOtpInDb?.resetOtp || "None"}</div>
                      </div>
                    </div>

                    {/* Otps Collection Records */}
                    <div className="p-4 rounded-xl bg-base-200/50 border border-base-300/80 space-y-2">
                      <div className="text-xs font-bold text-indigo-500 flex items-center justify-between">
                        <span>MongoDB 'otps' Collection Log</span>
                        <span className="text-[10px] text-base-content/60 font-normal">{otpDebugData.otpRecordsCount} records</span>
                      </div>
                      <div className="text-xs space-y-1 font-mono bg-base-100 p-2.5 rounded-lg border border-base-300 max-h-36 overflow-y-auto">
                        {otpDebugData.otpRecordsInDb?.length === 0 ? (
                          <div className="text-base-content/50 italic">No OTP records for this email</div>
                        ) : (
                          otpDebugData.otpRecordsInDb.map((rec) => (
                            <div key={rec._id} className="pb-1.5 mb-1.5 border-b border-base-200 last:border-0 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-primary">{rec.code}</span> ({rec.purpose})
                                <div className="text-[10px] text-base-content/60">{rec.isUsed ? "✅ Used" : "⏳ Active"} | {new Date(rec.createdAt).toLocaleTimeString()}</div>
                              </div>
                              <button onClick={() => handleCopy(rec.code)} className="btn btn-ghost btn-xs text-base-content/60 hover:text-primary">
                                {copiedOtp === rec.code ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="size-4" /> Why OTP is safely stored in MongoDB:
                </div>
                <p className="text-base-content/70 leading-relaxed">
                  1. Upon signup or resend, OTP code is saved in <code className="bg-base-100 px-1 py-0.5 rounded font-mono">otps</code> collection and set on <code className="bg-base-100 px-1 py-0.5 rounded font-mono">User.verificationOtp</code> in MongoDB.
                  <br />
                  2. Upon verification, the record is marked as <code className="bg-base-100 px-1 py-0.5 rounded font-mono">isUsed: true</code> with timestamp so database audit logs persist for 24 hours.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
