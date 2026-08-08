import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, KeyRound } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuthStore();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res.ok) setSent(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-base-100 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="size-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mt-3">Forgot password?</h1>
          <p className="text-base-content/60 mt-1">We'll email you a link to reset it.</p>
        </div>
        {!sent ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="size-5 text-base-content/40 absolute inset-y-0 left-3 my-auto" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full pl-10" placeholder="you@example.com" />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <><Loader2 className="size-5 animate-spin" />Sending...</> : "Send reset link"}
            </button>
          </form>
        ) : (
          <div className="bg-base-200 rounded-lg p-4 text-center text-sm">
            If an account exists for <b>{email}</b>, a reset link has been sent. Check your inbox.
          </div>
        )}
        <div className="text-center text-sm">
          <Link to="/login" className="link link-primary">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}