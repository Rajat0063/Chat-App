import React, { useState, useEffect } from "react";
import {
  MessageSquare, ShieldCheck, Zap, Users, UserCheck,
  PlusCircle, Search, ArrowRight, Bookmark, CheckCircle2,
  Radio, Activity, LifeBuoy, AlertTriangle, Send, Check, Clock,
  MessageCircle, ThumbsUp, Flame
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { axiosInstance } from "../lib/axios.js";

export default function NoChatSelected() {
  const { authUser, onlineUsers } = useAuthStore();
  const { users, groups, setSelectedUser, setSelectedGroup, requestJoinGroup } = useChatStore();

  const [activeTab, setActiveTab] = useState("overview"); // overview, notes, feedback
  const [searchTerm, setSearchTerm] = useState("");
  
  // Scratchpad Notes State
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("chatty_scratchpad_notes");
      return saved ? JSON.parse(saved) : [
        { id: "1", title: "Project Sync", content: "Chat application updated with real-time socket delivery & feedback system.", date: "Today" },
      ];
    } catch {
      return [];
    }
  });
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Feedback & Bug Reporting State
  const [feedbackType, setFeedbackType] = useState("bug");
  const [feedbackSeverity, setFeedbackSeverity] = useState("medium");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [isLoadingFeedbacks, setIsLoadingLoadingFeedbacks] = useState(false);

  useEffect(() => {
    localStorage.setItem("chatty_scratchpad_notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (activeTab === "feedback") {
      fetchMyFeedbacks();
    }
  }, [activeTab]);

  const fetchMyFeedbacks = async () => {
    setIsLoadingLoadingFeedbacks(true);
    try {
      const res = await axiosInstance.get("/feedback/my");
      setMyFeedbacks(res.data || []);
    } catch (err) {
      console.error("Failed to load feedback history:", err);
    } finally {
      setIsLoadingLoadingFeedbacks(false);
    }
  };

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

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackSubject.trim() || !feedbackDescription.trim()) {
      return toast.error("Please fill in both subject and description");
    }

    setIsSubmittingFeedback(true);
    try {
      const res = await axiosInstance.post("/feedback/submit", {
        type: feedbackType,
        severity: feedbackSeverity,
        subject: feedbackSubject.trim(),
        description: feedbackDescription.trim(),
      });
      toast.success(res.data?.message || "Report submitted to application builder!");
      setFeedbackSubject("");
      setFeedbackDescription("");
      fetchMyFeedbacks();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const safeOnlineCount = Math.max(0, (onlineUsers?.length || 0) - 1);

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isGroupMember = (group) => {
    const myId = authUser?._id?.toString();
    return Boolean(
      group?.isMember ||
      group?.isOwner ||
      (Array.isArray(group?.members) && group.members.some((member) => (member?._id || member)?.toString() === myId))
    );
  };

  return (
    <div className="w-full min-w-0 flex flex-1 flex-col p-2.5 sm:p-6 lg:p-8 bg-gradient-to-b from-base-100/60 via-base-100 to-base-200/40 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-base-100/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-base-300/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full">
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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
                  Welcome, {authUser?.fullName || "User"}
                </h1>
                <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary whitespace-nowrap">
                  Pro Workspace
                </span>
              </div>
              <p className="text-xs sm:text-sm text-base-content/60 mt-1 leading-relaxed max-w-xl">
                Real-time Chat, Group Channels & Application Feedback Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap">
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
            onClick={() => setActiveTab("feedback")}
            className={`btn btn-sm rounded-xl gap-2 transition-all ${
              activeTab === "feedback" ? "btn-primary shadow-sm" : "btn-ghost text-base-content/70"
            }`}
          >
            <LifeBuoy className="size-4 text-warning" />
            <span>Report Issue & Feedback</span>
            {myFeedbacks.length > 0 && <span className="badge badge-sm badge-outline">{myFeedbacks.length}</span>}
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
                <span className="text-xs text-base-content/60 font-medium">Message Delivery</span>
                <span className="text-2xl font-black text-emerald-500 mt-1">Instant</span>
                <span className="text-[10px] text-emerald-500 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Anti-Duplicate Guard
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
                    {filteredGroups.map((g) => {
                      const isMember = isGroupMember(g);
                      const joinRequestStatus = g.joinRequestStatus || (Array.isArray(g.joinRequests) ? (g.joinRequests.find((entry) => (entry?.user?._id || entry?.user)?.toString() === authUser?._id?.toString())?.status || null) : null);
                      return (
                        <div
                          key={g._id}
                          onClick={() => {
                            if (isMember) {
                              setSelectedGroup(g);
                              return;
                            }
                            if (joinRequestStatus !== "pending") {
                              requestJoinGroup(g._id);
                            }
                          }}
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

                          <button
                            type="button"
                            className={`btn btn-xs rounded-lg ${joinRequestStatus === "pending" ? "btn-disabled bg-base-300 text-base-content/50" : "btn-outline btn-secondary"}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (isMember) {
                                setSelectedGroup(g);
                                return;
                              }
                              if (joinRequestStatus !== "pending") requestJoinGroup(g._id);
                            }}
                          >
                            <span>{isMember ? "Open" : joinRequestStatus === "pending" ? "Requested" : "Join"}</span>
                            <ArrowRight className="size-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Highlights */}
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
                  <div className="text-[11px] text-base-content/60 mt-0.5">Zero double messages on click</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-base-100 border border-base-300/80 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-warning/10 text-warning">
                  <LifeBuoy className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Feedback System</div>
                  <div className="text-[11px] text-base-content/60 mt-0.5">Direct complaint & bug report hub</div>
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

        {/* TAB 3: FEEDBACK & BUG REPORTING */}
        {activeTab === "feedback" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Feedback Form Card */}
            <div className="bg-base-100 p-5 sm:p-6 rounded-2xl border border-base-300/80 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-warning">
                    <LifeBuoy className="size-5" /> Notify Application Builder / Submit Feedback
                  </h3>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Encountered a bug, speed issue, or have a complaint/suggestion? Send feedback directly to the application builder.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Issue Category */}
                  <div>
                    <label className="label text-xs font-bold text-base-content/70">Category</label>
                    <select
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      className="select select-sm select-bordered w-full rounded-xl text-xs"
                    >
                      <option value="bug">🐛 Bug / Technical Error</option>
                      <option value="inconvenience">⚡ Performance / Inconvenience</option>
                      <option value="complaint">😡 Complaint / Bad UX</option>
                      <option value="feature">💡 Feature Request / Idea</option>
                      <option value="other">💬 Other Feedback</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="label text-xs font-bold text-base-content/70">Severity / Urgency</label>
                    <select
                      value={feedbackSeverity}
                      onChange={(e) => setFeedbackSeverity(e.target.value)}
                      className="select select-sm select-bordered w-full rounded-xl text-xs"
                    >
                      <option value="low">🟢 Minor / Low</option>
                      <option value="medium">🟡 Normal / Medium</option>
                      <option value="high">🟠 High Urgency</option>
                      <option value="critical">🔴 Critical / Blocking</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="label text-xs font-bold text-base-content/70">Subject / Summary</label>
                  <input
                    type="text"
                    placeholder="Brief summary of the issue or feedback..."
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                    className="input input-sm input-bordered w-full rounded-xl text-xs"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="label text-xs font-bold text-base-content/70">Detailed Description / Steps to Reproduce</label>
                  <textarea
                    placeholder="Describe what happened, what went wrong, or what improvement you'd like to see..."
                    value={feedbackDescription}
                    onChange={(e) => setFeedbackDescription(e.target.value)}
                    rows={4}
                    className="textarea textarea-bordered w-full rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback || !feedbackSubject.trim() || !feedbackDescription.trim()}
                    className="btn btn-sm btn-primary rounded-xl gap-2 font-bold"
                  >
                    {isSubmittingFeedback ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    <span>Submit Feedback to Builder</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Submitted Feedback History */}
            <div className="bg-base-100 p-5 rounded-2xl border border-base-300/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                  <MessageCircle className="size-4 text-primary" /> My Submitted Feedback History ({myFeedbacks.length})
                </h4>
                <button
                  onClick={fetchMyFeedbacks}
                  className="btn btn-ghost btn-xs text-xs text-base-content/60 hover:text-primary"
                >
                  Refresh History
                </button>
              </div>

              {isLoadingFeedbacks ? (
                <div className="text-xs text-base-content/50 py-6 text-center">Loading feedback records...</div>
              ) : myFeedbacks.length === 0 ? (
                <div className="text-xs text-base-content/50 py-6 text-center bg-base-200/40 rounded-xl">
                  No feedback or complaints submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {myFeedbacks.map((f) => (
                    <div
                      key={f._id}
                      className="p-4 rounded-xl bg-base-200/40 border border-base-300/70 space-y-2"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`badge badge-sm font-bold ${
                            f.type === 'bug' ? 'badge-error' :
                            f.type === 'complaint' ? 'badge-warning' :
                            f.type === 'feature' ? 'badge-info' : 'badge-neutral'
                          }`}>
                            {f.type.toUpperCase()}
                          </span>

                          <span className="font-bold text-xs">{f.subject}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`badge badge-xs ${
                            f.status === 'resolved' ? 'badge-success' :
                            f.status === 'in_review' ? 'badge-warning' : 'badge-ghost'
                          }`}>
                            {f.status === 'resolved' ? '✅ Resolved' : f.status === 'in_review' ? '⏳ In Review' : '📥 Pending'}
                          </span>
                          <span className="text-[10px] text-base-content/50">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-base-content/80 whitespace-pre-wrap leading-relaxed bg-base-100 p-2.5 rounded-lg border border-base-300/60">
                        {f.description}
                      </p>

                      {f.adminResponse && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <strong>Builder Note:</strong> {f.adminResponse}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
