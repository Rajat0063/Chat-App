import { useState } from "react";
import { Camera, Mail, User, Trash2, Loader2, KeyRound } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

export default function ProfilePage() {
  const { authUser, isUpdatingProfile, updateProfile, deleteAccount } = useAuthStore();
  const { changePassword, isChangingPassword } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return alert("Image must be under 4MB");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      setSelectedImg(base64);
      await updateProfile({ profilePic: base64 });
    };
  };

  const saveName = async () => {
    if (!fullName.trim() || fullName.trim() === authUser.fullName) return;
    await updateProfile({ fullName: fullName.trim() });
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteAccount();
    setDeleting(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return alert("Please fill all fields");
    if (newPassword.length < 6) return alert("New password must be at least 6 characters");
    if (newPassword !== confirmPassword) return alert("Passwords do not match");
    const res = await changePassword({ currentPassword, newPassword });
    if (res?.ok) {
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-base-100 rounded-2xl p-6 sm:p-8 space-y-8 shadow">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="mt-2 text-base-content/60">Your profile information</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="relative inline-flex">
              <img src={selectedImg || authUser.profilePic || "/avatar.png"} alt="avatar"
                className="size-32 rounded-full object-cover border-4 border-base-300" />
              <label htmlFor="avatar-upload"
                className={`absolute bottom-3 right-3 bg-base-content hover:scale-105 p-2 rounded-full cursor-pointer transition
                ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}`}>
                <Camera className="w-5 h-5 text-base-200" />
                <input id="avatar-upload" type="file" accept="image/*" className="hidden"
                  onChange={onImageChange} disabled={isUpdatingProfile} />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm text-zinc-400 flex items-center gap-2"><User className="w-4 h-4" />Full Name</label>
              <div className="flex gap-2 mt-1.5">
                <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="input input-bordered w-full" />
                <button onClick={saveName} className="btn btn-primary" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? <Loader2 className="size-5 animate-spin" /> : "Save"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-400 flex items-center gap-2"><Mail className="w-4 h-4" />Email Address</label>
              <input value={authUser.email} disabled
                className="input input-bordered w-full mt-1.5 cursor-not-allowed opacity-70" />
              <p className="text-xs text-zinc-500 mt-2">
                Email cannot be changed. To use a different email, delete this account and create a new one.
              </p>
            </div>
          </div>

          <div className="bg-base-200 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-medium">Account Information</h2>
            <div className="flex items-center justify-between py-2 border-b border-base-300 text-sm">
              <span>Member Since</span><span>{new Date(authUser.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span>Account Status</span><span className="text-green-500">Active</span>
            </div>
          </div>

          <div className="bg-base-200 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-medium flex items-center gap-2"><KeyRound className="size-5 text-primary" />Change Password</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-zinc-400">Current password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input input-bordered w-full mt-1.5" placeholder="••••••••" />
              </div>
              <div>
                <label className="text-sm text-zinc-400">New password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="input input-bordered w-full mt-1.5" placeholder="••••••••" />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Confirm new password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input input-bordered w-full mt-1.5" placeholder="••••••••" />
              </div>

              {/* Password Strength Meter & Generator */}
              <PasswordStrengthMeter
                password={newPassword}
                onSuggestPassword={(pwd) => {
                  setNewPassword(pwd);
                  setConfirmPassword(pwd);
                }}
              />

              <div className="flex justify-end pt-2">
                <button onClick={handleChangePassword} className="btn btn-primary" disabled={isChangingPassword}>
                  {isChangingPassword ? <Loader2 className="size-5 animate-spin" /> : "Update password"}
                </button>
              </div>
            </div>
          </div>

          <div className="border border-error/30 rounded-xl p-6 bg-error/5">
            <h2 className="text-lg font-medium text-error flex items-center gap-2"><Trash2 className="size-5" />Danger zone</h2>
            <p className="text-sm text-base-content/60 mt-1">
              Deleting your account is permanent and will remove your profile, contacts list and all your messages.
            </p>
            {!confirming ? (
              <button onClick={() => setConfirming(true)} className="btn btn-error btn-outline btn-sm mt-3">Delete account</button>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={handleDelete} disabled={deleting} className="btn btn-error btn-sm">
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : "Yes, delete forever"}
                </button>
                <button onClick={() => setConfirming(false)} className="btn btn-ghost btn-sm">Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
