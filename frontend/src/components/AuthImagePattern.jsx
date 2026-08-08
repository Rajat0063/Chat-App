import { MessageSquare, ShieldCheck, Zap, Sparkles, CheckCircle2 } from "lucide-react";

export default function AuthImagePattern({ title, subtitle, icon: Icon = MessageSquare }) {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-base-200 via-base-300/40 to-base-200 p-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-10 right-10 size-72 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 left-10 size-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-bold text-lg">
          <div className="size-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <MessageSquare className="size-5 text-primary" />
          </div>
          <span>Chatty</span>
        </div>
        <div className="badge badge-primary badge-outline text-xs py-2 px-3 gap-1">
          <Sparkles className="size-3" /> Secure Auth
        </div>
      </div>

      {/* Center Interactive Visual Card */}
      <div className="relative z-10 max-w-md mx-auto my-auto space-y-6 text-center">
        {/* Animated Grid / Avatar Stack */}
        <div className="relative mx-auto w-full max-w-sm bg-base-100/80 backdrop-blur border border-base-300 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-base-200">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
              <Icon className="size-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Encrypted Connection</div>
              <div className="text-[11px] text-base-content/60">JWT & AES-256 Protocol</div>
            </div>
          </div>

          {/* Sample Chat Bubble */}
          <div className="space-y-2.5 text-left text-xs">
            <div className="chat chat-start">
              <div className="chat-bubble bg-base-200 text-base-content text-xs">
                Welcome! Enter your credentials to access live messages.
              </div>
            </div>
            <div className="chat chat-end">
              <div className="chat-bubble chat-bubble-primary text-xs">
                Sub-10ms delivery & 32 themes await! 🚀
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-around text-[11px] text-base-content/70 border-t border-base-200">
            <span className="flex items-center gap-1"><ShieldCheck className="size-3.5 text-success" /> OTP Guard</span>
            <span className="flex items-center gap-1"><Zap className="size-3.5 text-warning" /> WebSockets</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="size-3.5 text-info" /> SSL Active</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">{title}</h2>
          <p className="text-base-content/70 text-sm leading-relaxed max-w-sm mx-auto">{subtitle}</p>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 text-xs text-base-content/50 text-center">
        Protected by end-to-end token encryption & real-time WebSocket protocol.
      </div>
    </div>
  );
}
