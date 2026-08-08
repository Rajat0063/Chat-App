import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, MailCheck, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import toast from "react-hot-toast";

export default function VerifyOtpPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get("email") || "";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);
  const { verifyOtp, resendOtp } = useAuthStore();

  useEffect(() => {
    if (!email) navigate("/signup");
  }, [email, navigate]);

  // Resend Countdown Timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    // Handle paste of 6 digits
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted) {
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) {
          newOtp[i] = pasted[i] || "";
        }
        setOtp(newOtp);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullCode = otp.join("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (fullCode.length !== 6) {
      return toast.error("Please enter the complete 6-digit verification code");
    }
    setSubmitting(true);
    const res = await verifyOtp({ email, code: fullCode });
    setSubmitting(false);
    if (res?.ok) navigate("/chat");
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    await resendOtp(email);
    setResending(false);
    setCountdown(60);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-base-200/50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl shadow-2xl p-8 sm:p-10 space-y-8 relative z-10">
        
        {/* Icon & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary shadow-sm mx-auto">
            <MailCheck className="size-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Verify Your Email</h1>
          <p className="text-sm text-base-content/70 leading-relaxed max-w-xs mx-auto">
            We sent a 6-digit verification code to <br />
            <span className="font-bold text-base-content">{email}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="size-11 sm:size-12 text-center text-xl sm:text-2xl font-bold border-2 border-base-300 rounded-xl bg-base-100 focus:border-primary focus:outline-none transition-all shadow-sm"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || fullCode.length !== 6}
            className="btn btn-primary w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>

        {/* Resend Section */}
        <div className="pt-2 border-t border-base-200 text-center space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="text-base-content/60">Didn't receive the code?</span>
            {countdown > 0 ? (
              <span className="text-base-content/50 font-medium">
                Resend in <span className="text-primary font-bold">{countdown}s</span>
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="link link-primary font-bold flex items-center gap-1 hover:underline"
              >
                {resending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                <span>Resend Code</span>
              </button>
            )}
          </div>

          <div className="pt-2">
            <Link to="/signup" className="inline-flex items-center gap-1 text-xs text-base-content/60 hover:text-primary transition-colors">
              <ArrowLeft className="size-3" />
              <span>Back to Sign Up</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-base-content/40 text-center">
          <ShieldCheck className="size-3.5 text-success" />
          <span>Code valid for 10 minutes</span>
        </div>

      </div>
    </div>
  );
}
