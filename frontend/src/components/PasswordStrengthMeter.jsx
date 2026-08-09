import { useState } from "react";
import { Check, X, Sparkles, Copy, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export const generateStrongPassword = () => {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowers = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%^&*()_+-=";

  const getRandom = (str) => str[Math.floor(Math.random() * str.length)];

  // Guarantee at least one of each
  let passwordArray = [
    getRandom(uppers),
    getRandom(lowers),
    getRandom(numbers),
    getRandom(symbols),
  ];

  const allChars = uppers + lowers + numbers + symbols;
  for (let i = 4; i < 16; i++) {
    passwordArray.push(getRandom(allChars));
  }

  // Shuffle array
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join("");
};

export default function PasswordStrengthMeter({ password = "", onSuggestPassword }) {
  const [copied, setCopied] = useState(false);

  const checks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains a number (0-9)", met: /[0-9]/.test(password) },
    { label: "Contains special character (!@#$)", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.met).length;

  const getStrengthLabel = () => {
    if (!password) return { text: "Too short", color: "bg-base-300", labelColor: "text-base-content/40" };
    if (score <= 1) return { text: "Weak", color: "bg-error", labelColor: "text-error" };
    if (score <= 2) return { text: "Fair", color: "bg-warning", labelColor: "text-warning" };
    if (score <= 3) return { text: "Good", color: "bg-info", labelColor: "text-info" };
    if (score <= 4) return { text: "Strong", color: "bg-success", labelColor: "text-success" };
    return { text: "Very Strong 🔒", color: "bg-emerald-500", labelColor: "text-emerald-500" };
  };

  const { text: strengthText, color: barColor, labelColor } = getStrengthLabel();

  const handleGenerate = () => {
    const newPwd = generateStrongPassword();
    if (onSuggestPassword) {
      onSuggestPassword(newPwd);
    }
    navigator.clipboard.writeText(newPwd);
    setCopied(true);
    toast.success("Generated strong password & copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 bg-base-200/50 border border-base-300/80 rounded-xl p-3.5 mt-2">
      {/* Header & Suggest Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <ShieldCheck className="size-4 text-primary" />
          <span>Password Strength:</span>
          <span className={`font-bold ${labelColor}`}>{strengthText}</span>
        </div>

        {onSuggestPassword && (
          <button
            type="button"
            onClick={handleGenerate}
            className="btn btn-xs btn-primary btn-outline gap-1 text-[11px] hover:scale-105 transition-all"
            title="Generate a cryptographically secure strong password"
          >
            <Sparkles className="size-3 text-primary animate-pulse" />
            <span>Suggest Strong Password</span>
          </button>
        )}
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              level <= score ? barColor : "bg-base-300"
            }`}
          />
        ))}
      </div>

      {/* Requirements List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] pt-1">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {c.met ? (
              <Check className="size-3.5 text-success font-bold shrink-0" />
            ) : (
              <X className="size-3.5 text-base-content/30 shrink-0" />
            )}
            <span className={c.met ? "text-base-content/90 font-medium" : "text-base-content/50"}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
