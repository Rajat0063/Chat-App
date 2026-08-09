import React from "react";
import { MessageSquare, ShieldCheck, Zap, Image, Users, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";

export default function NoChatSelected() {
  const { authUser, onlineUsers } = useAuthStore();
  const { users, groups } = useChatStore();

  const safeOnlineCount = Math.max(0, (onlineUsers?.length || 0) - 1);

  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-6 sm:p-12 bg-gradient-to-b from-base-100/40 via-base-100 to-base-200/30 overflow-y-auto">
      <div className="max-w-xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Animated Main Icon & Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative inline-flex">
            <div className="size-20 rounded-3xl bg-gradient-to-tr from-primary to-indigo-500 p-0.5 shadow-xl shadow-primary/20">
              <div className="w-full h-full bg-base-100 rounded-[22px] flex items-center justify-center">
                <MessageSquare className="size-10 text-primary" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 flex size-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-5 bg-emerald-500 border-2 border-base-100" />
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span>Welcome back, {authUser?.fullName?.split(" ")[0] || "Friend"}!</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Your Workspace Chat Dashboard
          </h2>
          <p className="text-sm sm:text-base text-base-content/60 max-w-md mx-auto leading-relaxed">
            Select a contact or group from the sidebar to send messages, share media, or start real-time conversations.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-base-200/50 rounded-2xl border border-base-300/80">
          <div className="text-center p-2">
            <div className="text-xl font-bold text-primary">{users?.length || 0}</div>
            <div className="text-[11px] text-base-content/60 font-medium">Contacts</div>
          </div>
          <div className="text-center p-2 border-x border-base-300/80">
            <div className="text-xl font-bold text-emerald-500">{safeOnlineCount}</div>
            <div className="text-[11px] text-base-content/60 font-medium">Online Now</div>
          </div>
          <div className="text-center p-2">
            <div className="text-xl font-bold text-indigo-500">{groups?.length || 0}</div>
            <div className="text-[11px] text-base-content/60 font-medium">Group Rooms</div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-3.5 rounded-xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Zap className="size-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Real-time Socket</div>
              <div className="text-[10px] text-base-content/60">Instant delivery</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Image className="size-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Media Sharing</div>
              <div className="text-[10px] text-base-content/60">Images & photos</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-base-100 border border-base-200 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Encrypted Auth</div>
              <div className="text-[10px] text-base-content/60">JWT & Cookies</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

