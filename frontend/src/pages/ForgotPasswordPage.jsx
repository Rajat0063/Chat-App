import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, KeyRound, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore.js";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Request OTP | 2: Enter OTP & New Password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const { forgotPassword, resetPassword } = useAuthStore();
  const navigate = useNavigate();

  // Step 1: Request OTP to Email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return toast.error("Please enter a valid email address");
    }
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res?.ok) {
      toast.success("A 6-digit reset code has been sent to your email!");
      setStep(2); // Stay on same tab, advance to Step 2!
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      return toast.error("Please enter the 6-digit reset code from your email");
    }
    if (password.length < 6) {
      return toast.error("New password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    const res = await resetPassword({ email, code, password });
    setLoading(false);
    if (res?.ok) {
      toast.success("Password updated successfully! Please sign in with your new password.");
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
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl shadow-2xl p-8 sm:p-10 space-y-6 relative z-10">
        
        {/* Step Indicator Badges */}
        <div className="flex items-center justify-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${step === 1 ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/60"}`}>
            <span>1. Send Code</span>
          </div>
          <div className="h-px w-6 bg-base-300" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${step === 2 ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/60"}`}>
            <span>2. Reset Password</span>
          </div>
        </div>

        {/* STEP 1: REQUEST OTP */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary shadow-sm mx-auto">
                <KeyRound className="size-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Forgot Password?</h1>
              <p className="text-sm text-base-content/60 leading-relaxed">
                Enter your email address to receive a 6-digit OTP verification code.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Email Address</span>
                </label>
                <div className="relative">
                  <Mail className="size-5 text-base-content/40 absolute inset-y-0 left-3.5 my-auto pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input input-bordered w-full pl-11 h-12 text-sm focus:input-primary transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP Code</span>
                    <ArrowRight className="size-5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-sm">
              <Link to="/login" className="inline-flex items-center gap-1.5 link link-primary font-bold hover:underline">
                <ArrowLeft className="size-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2: ENTER OTP & NEW PASSWORD */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-success/10 text-success shadow-sm mx-auto">
                <CheckCircle2 className="size-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Set New Password</h1>
              <p className="text-xs sm:text-sm text-base-content/60">
                Enter the 6-digit OTP sent to <span className="font-bold text-base-content">{email}</span>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              
              {/* OTP Code Input */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">6-Digit OTP Code</span>
                </label>
                <div className="relative">
                  <KeyRound className="size-5 text-base-content/40 absolute inset-y-0 left-3.5 my-auto pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="input input-bordered w-full pl-11 h-12 text-center font-bold tracking-[0.4em] text-lg focus:input-primary transition-all"
                    placeholder="123456"
                  />
                </div>
              </div>

              {/* New Password Input */}
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

              {/* Confirm Password Input */}
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

              {/* Password Strength Meter */}
              <PasswordStrengthMeter
                password={password}
                onSuggestPassword={handleSuggestedPassword}
              />

              {/* Action Buttons */}
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

            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-base-content/60 hover:text-primary transition-colors"
              >
                <ArrowLeft className="size-3" />
                <span>Resend or change email</span>
              </button>

              <Link to="/login" className="link link-primary font-bold hover:underline">
                Sign in instead
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs text-base-content/40 text-center border-t border-base-200 pt-4">
          <ShieldCheck className="size-3.5 text-success" />
          <span>OTP code stored securely in encrypted database</span>
        </div>

      </div>
    </div>
  );
}
