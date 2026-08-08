import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Loader2, KeyRound, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore.js";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = params.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { resetPassword } = useAuthStore();

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return toast.error("Please enter a valid email address");
    }
    if (code.length !== 6) {
      return toast.error("Please enter the 6-digit OTP reset code");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    const res = await resetPassword({ email, code, password });
    setLoading(false);
    if (res?.ok) {
      toast.success("Password reset successfully! Please sign in.");
      navigate("/login");
    }
  };

  const handleSuggestedPassword = (suggestedPwd) => {
    setPassword(suggestedPwd);
    setConfirmPassword(suggestedPwd);
    setShowPwd(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-base-200/50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl shadow-2xl p-8 sm:p-10 space-y-6 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary shadow-sm mx-auto">
            <KeyRound className="size-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Reset Password</h1>
          <p className="text-xs sm:text-sm text-base-content/60">
            Enter the 6-digit OTP received in your mail & your new password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full h-12 text-sm focus:input-primary transition-all"
              placeholder="name@example.com"
            />
          </div>

          {/* OTP Code */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">6-Digit OTP Code</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="input input-bordered w-full h-12 text-center font-bold tracking-[0.4em] text-lg focus:input-primary transition-all"
              placeholder="123456"
            />
          </div>

          {/* New Password */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">New Password</span>
            </label>
            <div className="relative">
              <Lock className="size-5 text-base-content/40 absolute inset-y-0 left-3.5 my-auto pointer-events-none" />
              <input
                type={showPwd ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Confirm Password */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Confirm New Password</span>
            </label>
            <div className="relative">
              <Lock className="size-5 text-base-content/40 absolute inset-y-0 left-3.5 my-auto pointer-events-none" />
              <input
                type={showPwd ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input input-bordered w-full pl-11 h-12 text-sm focus:input-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Password Strength Meter & Generator */}
          <PasswordStrengthMeter
            password={password}
            onSuggestPassword={handleSuggestedPassword}
          />

          {/* Action Button */}
          <button
            type="submit"
            className="btn btn-primary w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all gap-2 mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-sm">
          <Link to="/login" className="inline-flex items-center gap-1.5 link link-primary font-bold hover:underline">
            <ArrowLeft className="size-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-base-content/40 text-center border-t border-base-200 pt-4">
          <ShieldCheck className="size-3.5 text-success" />
          <span>OTP verification via database authentication</span>
        </div>

      </div>
    </div>
  );
}
