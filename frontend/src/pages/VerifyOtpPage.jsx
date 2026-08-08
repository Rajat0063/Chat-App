import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";

export default function VerifyOtpPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get("email") || "";
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { verifyOtp, resendOtp } = useAuthStore();

  useEffect(() => { if (!email) navigate("/signup"); }, [email, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setSubmitting(true);
    const res = await verifyOtp({ email, code });
    setSubmitting(false);
    if (res.ok) navigate("/chat");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-base-100 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="size-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
            <MailCheck className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mt-3">Verify your email</h1>
          <p className="text-base-content/60 mt-1">
            We sent a 6-digit code to <span className="font-medium">{email}</span>
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            inputMode="numeric" maxLength={6} required value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="input input-bordered w-full text-center text-2xl tracking-[0.5em] font-bold"
            placeholder="------" />
          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? <><Loader2 className="size-5 animate-spin" />Verifying...</> : "Verify"}
          </button>
        </form>
        <div className="text-center text-sm">
          Didn't get a code?{" "}
          <button onClick={() => resendOtp(email)} className="link link-primary">Resend</button>
        </div>
      </div>
    </div>
  );
}