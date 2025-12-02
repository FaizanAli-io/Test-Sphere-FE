"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import AuthHeader from "./components/AuthHeader";
import AuthFooter from "./components/AuthFooter";
import AlertMessage from "./components/AlertMessage";
import OtpVerification from "./components/OtpVerification";
import ResetPasswordForm from "./components/ResetPasswordForm";
import ForgotPasswordForm from "./components/ForgotPasswordForm";

export default function Auth() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setOtpSent(false);
    setError("");
    setSuccess("");
  };

  const switchMode = (mode: "login" | "signup" | "forgot" | "reset") => {
    resetForm();
    setAuthMode(mode);
  };

  const handleBackButton = () => {
    resetForm();
    setAuthMode("login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <AuthHeader
            authMode={authMode}
            otpSent={otpSent}
            onBack={handleBackButton}
            showBackButton={authMode === "forgot" || authMode === "reset" || otpSent}
          />

          <div className="p-8">
            <AlertMessage error={error} success={success} />

            {authMode === "login" && (
              <LoginForm
                email={email}
                password={password}
                loading={loading}
                setEmail={setEmail}
                setPassword={setPassword}
                setError={setError}
                setSuccess={setSuccess}
                setLoading={setLoading}
                onForgotPassword={() => switchMode("forgot")}
                router={router}
              />
            )}

            {authMode === "signup" && !otpSent && (
              <SignupForm
                email={email}
                password={password}
                loading={loading}
                setEmail={setEmail}
                setPassword={setPassword}
                setError={setError}
                setSuccess={setSuccess}
                setLoading={setLoading}
                setOtpSent={setOtpSent}
                router={router}
              />
            )}

            {authMode === "signup" && otpSent && (
              <OtpVerification
                email={email}
                password={password}
                loading={loading}
                error={error}
                setError={setError}
                setSuccess={setSuccess}
                setLoading={setLoading}
                onBackToLogin={handleBackButton}
                router={router}
              />
            )}

            {authMode === "forgot" && !otpSent && (
              <ForgotPasswordForm
                email={email}
                loading={loading}
                setEmail={setEmail}
                setError={setError}
                setSuccess={setSuccess}
                setLoading={setLoading}
                setOtpSent={setOtpSent}
              />
            )}

            {authMode === "forgot" && otpSent && (
              <ResetPasswordForm
                email={email}
                loading={loading}
                setError={setError}
                setSuccess={setSuccess}
                setLoading={setLoading}
                onResetComplete={handleBackButton}
              />
            )}

            {!otpSent && (
              <AuthFooter authMode={authMode} loading={loading} onSwitchMode={switchMode} />
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            By continuing, you agree to our{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
