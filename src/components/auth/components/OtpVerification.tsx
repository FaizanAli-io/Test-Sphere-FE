import { useState, useEffect, useRef } from "react";
import { Mail, KeyRound } from "lucide-react";

import api from "@/hooks/useApi";
import { extractErrorMessage } from "@/utils/error";

interface RouterLike {
  push: (href: string) => void;
}

interface OtpVerificationProps {
  email: string;
  password: string;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  setLoading: (loading: boolean) => void;
  onBackToLogin: () => void;
  router: RouterLike;
}

export default function OtpVerification({
  email,
  password,
  loading,
  error,
  setError,
  setSuccess,
  setLoading,
  onBackToLogin,
  router,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [autoResending, setAutoResending] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-resend OTP if there was an email sending issue
  useEffect(() => {
    if (error && error.includes("issue sending verification email")) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        setAutoResending(true);
        try {
          const res = await api("/auth/resend-otp", {
            method: "POST",
            body: JSON.stringify({ email }),
          });

          // We intentionally ignore response body unless needed later
          if (res.ok) {
            setSuccess("OTP resent to your email! Please check your inbox.");
            setError("");
            setResendCooldown(60);
          }
        } catch (err) {
          console.error("Auto-resend error:", err);
        } finally {
          setAutoResending(false);
          timeoutRef.current = null;
        }
      }, 2000);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [error, email, setAutoResending, setSuccess, setError, setResendCooldown]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          const newVal = prev <= 1 ? 0 : prev - 1;
          if (newVal === 0 && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return newVal;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [resendCooldown]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await api("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });

      const data: { message?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      setSuccess("Account verified successfully! Logging you in...");

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        const loginRes = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const loginData: {
          token?: string;
          user?: { role: string };
        } = await loginRes.json();

        if (loginRes.ok) {
          if (loginData.token) localStorage.setItem("token", loginData.token);
          if (loginData.user?.role) {
            localStorage.setItem("role", loginData.user.role);
            window.dispatchEvent(new Event("authChange"));
            router.push("/" + loginData.user.role.toLowerCase());
          }
        }
        timeoutRef.current = null;
      }, 1000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setLoading(true);

    try {
      const res = await api("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setSuccess("OTP resent to your email! Please check your inbox.");
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={`text-center border rounded-xl p-4 ${
          error && error.includes("issue sending verification email")
            ? "bg-yellow-50 border-yellow-200"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <div className="flex items-center justify-center mb-2">
          <Mail
            className={`w-5 h-5 mr-2 ${
              error && error.includes("issue sending verification email")
                ? "text-yellow-600"
                : "text-blue-600"
            }`}
          />
          <span
            className={`text-sm font-semibold ${
              error && error.includes("issue sending verification email")
                ? "text-yellow-800"
                : "text-blue-800"
            }`}
          >
            {error && error.includes("issue sending verification email")
              ? "Email Verification (Resend Required)"
              : "Email Verification Required"}
          </span>
        </div>
        <p
          className={`text-sm ${
            error && error.includes("issue sending verification email")
              ? "text-yellow-700"
              : "text-blue-700"
          }`}
        >
          {autoResending
            ? "Automatically resending verification code..."
            : error && error.includes("issue sending verification email")
              ? "There was an issue sending the verification email. Please use the resend button below to get your verification code."
              : `We've sent a 6-digit verification code to ${email}`}
        </p>
      </div>

      <form onSubmit={handleVerifyOtp} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
            Enter Verification Code
          </label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-center text-3xl tracking-[0.5em] font-bold bg-gray-50"
              required
              disabled={loading}
              maxLength={6}
              pattern="\d{6}"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>
          <div className="flex justify-center mt-3">
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index < otp.length ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Verifying...
            </div>
          ) : (
            "Verify & Continue"
          )}
        </button>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading || resendCooldown > 0}
            className={`w-full py-2 text-sm font-semibold border rounded-lg transition ${
              resendCooldown > 0
                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                : "text-indigo-600 hover:text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            }`}
          >
            {loading
              ? "Resending..."
              : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Verification Code"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium hover:underline"
            >
              Already verified? Try logging in
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
