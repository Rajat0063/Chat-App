import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore.js";
import AuthImagePattern from "../components/AuthImagePattern.jsx";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

export default function SignUpPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const { signup, isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    if (!form.fullName.trim()) return toast.error("Full name is required"), false;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Please enter a valid email address"), false;
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters"), false;
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const res = await signup(form);
    if (res?.ok) {
      navigate(`/verify-otp?email=${encodeURIComponent(res.email)}`);
    }
  };

  const handleSuggestedPassword = (suggestedPwd) => {
    setForm((prev) => ({ ...prev, password: suggestedPwd }));
    setShowPwd(true); // Automatically show suggested password so user can see it
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 bg-base-100">
      
      {/* Left Form Column */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-auto">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary mb-2 shadow-sm">
              <MessageSquare className="size-7" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Create Account</h1>
            <p className="text-sm text-base-content/60">
              Get started with your free Chatty account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Full Name</span></label>
              <div className="relative">
                <User className="size-5 text-base-content/40 absolute inset-y-0 left-3.5 my-auto pointer-events-none" />
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="input input-bordered w-full pl-11 h-12 text-sm focus:input-primary transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label className="label py-1"><span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Password</span></label>
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

              {/* Password Strength Meter & Generator */}
              <PasswordStrengthMeter
                password={form.password}
                onSuggestPassword={handleSuggestedPassword}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2 mt-2"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="size-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-2 text-center text-sm text-base-content/70">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary font-bold hover:underline">
              Sign in instead
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-base-content/50 border-t border-base-200 pt-4">
            <ShieldCheck className="size-4 text-success" />
            <span>Requires 6-digit email OTP verification</span>
          </div>

        </div>
      </div>

      {/* Right Hero Visual Column */}
      <AuthImagePattern
        title="Join Chatty Today"
        subtitle="Experience instant messaging with custom groups, rich photo attachments, and password security."
        icon={User}
      />

    </div>
  );
}
