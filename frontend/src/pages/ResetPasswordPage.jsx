import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore.js";
import AuthImagePattern from "../components/AuthImagePattern.jsx";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuthStore();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Email is required");
    if (code.length !== 6) return toast.error("Enter the 6-digit reset code");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    const res = await resetPassword({ email, code, password });
    setLoading(false);
    if (res.ok) navigate("/login");
  };

  return (
    <div className="h-[calc(100vh-4rem)] grid lg:grid-cols-2 overflow-hidden">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 overflow-hidden">
        <div className="w-full max-w-md space-y-8">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/5 px-4 py-2 mb-6">
              <div className="size-10 rounded-2xl bg-primary text-white flex items-center justify-center">
                <KeyRound className="size-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-primary font-semibold">Chatty</p>
                <h1 className="text-3xl font-semibold">Reset password</h1>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-base-200 bg-base-100 shadow-lg p-8 overflow-hidden w-full">
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold">Enter your reset details</h2>
              <p className="text-base-content/60">Use the 6-digit code sent to your email and set a new password for Chatty.</p>
            </div>

            <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-28rem)] pr-1">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Email</span></label>
                  <div className="relative">
                    <Mail className="size-5 text-base-content/40 absolute inset-y-0 left-3 my-auto" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="input input-bordered w-full pl-10" placeholder="you@example.com" required />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Verification code</span></label>
                  <div className="relative">
                    <KeyRound className="size-5 text-base-content/40 absolute inset-y-0 left-3 my-auto" />
                    <input inputMode="numeric" maxLength={6} value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="input input-bordered w-full pl-10" placeholder="123456" required />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">New password</span></label>
                  <div className="relative">
                    <Lock className="size-5 text-base-content/40 absolute inset-y-0 left-3 my-auto" />
                    <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      className="input input-bordered w-full pl-10" placeholder="••••••••" required />
                    <button type="button" onClick={() => setShow((s) => !s)}
                      className="absolute inset-y-0 right-3 my-auto text-base-content/40">
                      {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Confirm password</span></label>
                  <div className="relative">
                    <Lock className="size-5 text-base-content/40 absolute inset-y-0 left-3 my-auto" />
                    <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      className="input input-bordered w-full pl-10" placeholder="••••••••" required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? <><Loader2 className="size-5 animate-spin" />Updating...</> : "Update password"}
                </button>
              </form>
            </div>

            <p className="text-center text-base-content/60 mt-4">
              Remembered your password? <Link to="/login" className="link link-primary">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <AuthImagePattern
          title="Welcome back!"
          subtitle="Sign in to continue your conversations and catch up with your messages."
        />
      </div>
    </div>
  );
}
