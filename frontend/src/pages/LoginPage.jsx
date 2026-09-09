import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, ArrowRight, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import AuthImagePattern from "../components/AuthImagePattern.jsx";

const DEMO_USERS = [
  { name: "Rajat", role: "Creator", email: "rajat@example.com", password: "123456" },
  { name: "Rajesh", role: "User", email: "raajeshyadav5641@gmail.com", password: "password123" },
  { name: "Abhinav", role: "Teammate", email: "abhinav@example.com", password: "123456" },
  { name: "Tester", role: "Demo", email: "test@example.com", password: "123456" },
];

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [notFoundEmail, setNotFoundEmail] = useState("");
  const { login, isLoggingIn } = useAuthStore();
  const navigate = useNavigate();

  const handleLoginWithData = async (credentials) => {
    setNotFoundEmail("");
    const res = await login(credentials);
    if (res?.needsVerification) {
      navigate(`/verify-otp?email=${encodeURIComponent(res.email)}${res.devOtp ? `&code=${encodeURIComponent(res.devOtp)}` : ""}`);
    } else if (res?.ok) {
      navigate("/chat");
    } else if (res?.userNotFound) {
      setNotFoundEmail(credentials.email);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await handleLoginWithData(form);
  };

  const selectDemoUser = (user, autoSubmit = false) => {
    setForm({ email: user.email, password: user.password });
    setNotFoundEmail("");
    if (autoSubmit) {
      handleLoginWithData({ email: user.email, password: user.password });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 bg-base-100">
      
      {/* Left Form Column */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary mb-1 shadow-sm">
              <MessageSquare className="size-7" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome Back</h1>
            <p className="text-sm text-base-content/60">
              Sign in to Chatty to continue your conversations
            </p>
          </div>

          {/* Quick Demo Login Box */}
          <div className="bg-base-200/70 border border-base-300 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>Instant Demo Accounts</span>
              </span>
              <span className="badge badge-sm badge-ghost text-[10px]">1-Click Login</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => selectDemoUser(user, true)}
                  disabled={isLoggingIn}
                  className="btn btn-xs sm:btn-sm btn-outline hover:btn-primary flex flex-col h-auto py-1.5 px-2 text-left rounded-xl transition-all normal-case"
                  title={`Sign in as ${user.name} (${user.email})`}
                >
                  <span className="font-bold text-xs truncate w-full">{user.name}</span>
                  <span className="text-[10px] text-base-content/50 truncate w-full">{user.role}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User Not Found Warning helper */}
          {notFoundEmail && (
            <div className="alert alert-warning py-2.5 px-4 text-xs rounded-xl flex items-center justify-between">
              <span>No account for <strong>{notFoundEmail}</strong>.</span>
              <Link
                to={`/signup?email=${encodeURIComponent(notFoundEmail)}`}
                className="btn btn-xs btn-neutral"
              >
                Sign Up Now
              </Link>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Email Address</span></label>
              <div className="relative">
                <Mail className="size-5 text-base-content/40 absolute inset-y-0 left-3.5 my-auto pointer-events-none" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input input-bordered w-full pl-11 h-12 text-sm focus:input-primary transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control">
              <div className="flex items-center justify-between label py-1">
                <span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Password</span>
                <Link to="/forgot-password" className="link link-primary text-xs font-semibold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="size-5 text-base-content/40 absolute inset-y-0 left-3.5 my-auto pointer-events-none" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input input-bordered w-full pl-11 pr-11 h-12 text-sm focus:input-primary transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-3.5 my-auto text-base-content/40 hover:text-base-content transition-colors"
                >
                  {showPwd ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="size-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-2 text-center text-sm text-base-content/70">
            Don't have an account?{" "}
            <Link to="/signup" className="link link-primary font-bold hover:underline">
              Create account free
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-base-content/50 border-t border-base-200 pt-4">
            <ShieldCheck className="size-4 text-success" />
            <span>256-bit encrypted authentication & session token</span>
          </div>

        </div>
      </div>

      {/* Right Hero Visual Column */}
      <AuthImagePattern
        title="Real-Time Conversations"
        subtitle="Sign in to connect instantly with your contacts, view online statuses, and chat across all 32 custom themes."
        icon={MessageSquare}
      />

    </div>
  );
}
