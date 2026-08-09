import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import VerifyOtpPage from "./pages/VerifyOtpPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingPage.jsx";

import { useAuthStore } from "./store/useAuthStore.js";
import { useThemeStore } from "./store/useThemeStore.js";

export default function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme} className="min-h-screen bg-base-200">
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <LandingPage />} />
        <Route path="/login"           element={!authUser ? <LoginPage /> : <Navigate to="/chat" />} />
        <Route path="/signup"          element={!authUser ? <SignUpPage /> : <Navigate to="/chat" />} />
        <Route path="/verify-otp"      element={!authUser ? <VerifyOtpPage /> : <Navigate to="/chat" />} />
        <Route path="/forgot-password" element={!authUser ? <ForgotPasswordPage /> : <Navigate to="/chat" />} />
        <Route path="/reset-password"  element={!authUser ? <ResetPasswordPage /> : <Navigate to="/chat" />} />
        <Route path="/chat"            element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/profile"         element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/settings"        element={<SettingsPage />} />
        <Route path="*"                element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-center" />
    </div>
  );
}
