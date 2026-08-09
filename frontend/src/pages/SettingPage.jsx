import React from "react";
import { Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { THEMES } from "../constants/index.js";
import { useThemeStore } from "../store/useThemeStore.js";
import { useAuthStore } from "../store/useAuthStore.js";

const PREVIEW = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(authUser ? "/chat" : "/");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] container mx-auto px-4 pt-8 pb-12 max-w-5xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-base-content/70">Customize your chat theme and preferences</p>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-circle hover:bg-base-300 transition-colors"
            title="Close Settings & Return"
          >
            <X className="size-6" />
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-1">Theme</h2>
          <p className="text-sm text-base-content/70 mb-4">Choose a theme for your chat interface</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {THEMES.map((t) => (
              <button key={t} onClick={() => setTheme(t)}
                className={`group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                  ${theme === t ? "bg-base-200 border border-primary/50" : "hover:bg-base-200/50"}`}>
                <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    <div className="rounded bg-primary"></div>
                    <div className="rounded bg-secondary"></div>
                    <div className="rounded bg-accent"></div>
                    <div className="rounded bg-neutral"></div>
                  </div>
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center">{t}</span>
              </button>
            ))}
          </div>
        </div>

        <h3 className="text-lg font-semibold mt-8">Preview</h3>
        <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow">
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-base-300 bg-base-100 flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-medium">J</div>
                  <div><div className="font-medium text-sm">John Doe</div><div className="text-xs text-base-content/70">Online</div></div>
                </div>
                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                  {PREVIEW.map((m) => (
                    <div key={m.id} className={`flex ${m.isSent ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl p-3 shadow-sm
                        ${m.isSent ? "bg-primary text-primary-content" : "bg-base-200"}`}>
                        <p className="text-sm">{m.content}</p>
                        <p className={`text-[10px] mt-1.5 ${m.isSent ? "text-primary-content/70" : "text-base-content/70"}`}>12:00 PM</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input type="text" readOnly value="This is a preview"
                      className="input input-bordered flex-1 text-sm h-10" />
                    <button className="btn btn-primary h-10 min-h-0"><Send size={18} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
