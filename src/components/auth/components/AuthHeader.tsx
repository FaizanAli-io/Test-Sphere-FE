import { ArrowLeft } from "lucide-react";

interface AuthHeaderProps {
  authMode: "login" | "signup" | "forgot" | "reset";
  otpSent: boolean;
  onBack: () => void;
  showBackButton: boolean;
}

export default function AuthHeader({
  authMode,
  otpSent,
  onBack,
  showBackButton,
}: AuthHeaderProps) {
  const getTitle = () => {
    if (authMode === "login") return "Welcome Back";
    if (authMode === "signup" && !otpSent) return "Create Account";
    if (authMode === "signup" && otpSent) return "Verify Email";
    if (authMode === "forgot" && !otpSent) return "Forgot Password";
    if (authMode === "forgot" && otpSent) return "Reset Password";
    if (authMode === "reset") return "Reset Password";
    return "";
  };

  const getSubtitle = () => {
    if (authMode === "login") return "Sign in to continue your journey";
    if (authMode === "signup" && !otpSent)
      return "Join us today and get started";
    if (authMode === "signup" && otpSent)
      return "Enter the OTP sent to your email";
    if (authMode === "forgot" && !otpSent) return "We'll send you a reset code";
    if (authMode === "forgot" && otpSent) return "Enter OTP and new password";
    return "";
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
      <div className="flex items-center justify-between mb-2">
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold">{getTitle()}</h1>
        </div>
      </div>
      <p className="text-indigo-100 text-center text-sm">{getSubtitle()}</p>
    </div>
  );
}
