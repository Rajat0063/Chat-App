import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import AuthImagePattern from "../components/AuthImagePattern.jsx";

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await login(form);
    if (res?.needsVerification) {
      navigate(`/verify-otp?email=${encodeURIComponent(res.email)}`);
    } else if (res?.ok) {
      navigate("/chat");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 bg-base-100">
      
      {/* Left Form Column */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary mb-2 shadow-sm">
              <MessageSquare className="size-7" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome Back</h1>
            <p className="text-sm text-base-content/60">
              Sign in to Chatty to continue your conversations
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            
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

          <div className="flex items-center justify-center gap-2 text-xs text-base-content/50 border-t border-base-200 pt-6">
            <ShieldCheck className="size-4 text-success" />
            <span>256-bit encrypted SSL socket authentication</span>
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
