import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
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
    if (res?.needsVerification) navigate(`/verify-otp?email=${encodeURIComponent(res.email)}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
              <p className="text-base-content/60">Sign in to your account</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <div className="relative">
                <Mail className="size-5 text-base-content/40 absolute inset-y-0 left-3 my-auto" />
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input input-bordered w-full pl-10" placeholder="you@example.com" />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Password</span></label>
              <div className="relative">
                <Lock className="size-5 text-base-content/40 absolute inset-y-0 left-3 my-auto" />
                <input type={showPwd ? "text" : "password"} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input input-bordered w-full pl-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-3 my-auto text-base-content/40">
                  {showPwd ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="link link-primary text-sm">Forgot password?</Link>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoggingIn}>
              {isLoggingIn ? <><Loader2 className="size-5 animate-spin" />Loading...</> : "Sign in"}
            </button>
          </form>

          <p className="text-center text-base-content/60">
            Don't have an account? <Link to="/signup" className="link link-primary">Create account</Link>
          </p>
        </div>
      </div>
      <AuthImagePattern title="Welcome back!" subtitle="Sign in to continue your conversations and catch up with your messages." />
    </div>
  );
}