import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore.js";
import AuthImagePattern from "../components/AuthImagePattern.jsx";

export default function SignUpPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const { signup, isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    if (!form.fullName.trim()) return toast.error("Full name is required"), false;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Invalid email"), false;
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters"), false;
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const res = await signup(form);
    if (res?.ok) navigate(`/verify-otp?email=${encodeURIComponent(res.email)}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Create Account</h1>
              <p className="text-base-content/60">Get started with your free account</p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Full Name</span></label>
              <div className="relative">
                <User className="size-5 text-base-content/40 absolute inset-y-0 left-3 my-auto" />
                <input type="text" required className="input input-bordered w-full pl-10" placeholder="John Doe"
                  value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <div className="relative">
                <Mail className="size-5 text-base-content/40 absolute inset-y-0 left-3 my-auto" />
                <input type="email" required className="input input-bordered w-full pl-10" placeholder="you@example.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Password</span></label>
              <div className="relative">
                <Lock className="size-5 text-base-content/40 absolute inset-y-0 left-3 my-auto" />
                <input type={showPwd ? "text" : "password"} required className="input input-bordered w-full pl-10" placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-3 my-auto text-base-content/40">
                  {showPwd ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={isSigningUp}>
              {isSigningUp ? <><Loader2 className="size-5 animate-spin" />Creating...</> : "Create Account"}
            </button>
          </form>
          <p className="text-center text-base-content/60">
            Already have an account? <Link to="/login" className="link link-primary">Sign in</Link>
          </p>
        </div>
      </div>
      <AuthImagePattern title="Join the conversation" subtitle="Sign up to connect, share moments, and stay close with the people who matter." />
    </div>
  );
}