"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../app/hooks/useApi";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  KeyRound,
  ArrowLeft,
} from "lucide-react";

export default function Auth() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<
    "login" | "signup" | "forgot" | "reset"
  >("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [autoResending, setAutoResending] = useState(false);

  // Auto-resend OTP if there was an email sending issue
  useEffect(() => {
    if (otpSent && error && error.includes("issue sending verification email")) {
      // Automatically try to resend OTP after a short delay
      const timer = setTimeout(async () => {
        setAutoResending(true);
        try {
          const res = await api("/auth/resend-otp", {
            method: "POST",
            body: JSON.stringify({ email }),
          });

          const data = await res.json();

          if (res.ok) {
            setSuccess("OTP resent to your email! Please check your inbox.");
            setError(""); // Clear the error message
            // Start cooldown timer
            setResendCooldown(60);
            const cooldownTimer = setInterval(() => {
              setResendCooldown((prev) => {
                if (prev <= 1) {
                  clearInterval(cooldownTimer);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } else {
            console.error("Auto-resend failed:", data.message);
          }
        } catch (err) {
          console.error("Auto-resend error:", err);
        } finally {
          setAutoResending(false);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [otpSent, error, email]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("STUDENT");
    setUniqueIdentifier("");
    setProfileImage("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpSent(false);
    setError("");
    setSuccess("");
    setResendCooldown(0);
    setAutoResending(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("role", data.user.role);
      window.dispatchEvent(new Event("authChange"));
      setSuccess(`Welcome back, ${data.user.name}!`);

      setTimeout(() => {
        router.push("/" + data.user.role.toLowerCase());
      }, 1000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Generate unique identifier if not provided
      const identifier =
        uniqueIdentifier ||
        `${email.split("@")[0].slice(0, 10)}-${Math.floor(
          Math.random() * 10000
        )}`.slice(0, 20);

      const requestBody = {
        email,
        password,
        name,
        role,
        uniqueIdentifier: identifier,
        profileImage: profileImage || undefined,
      };

      console.log("Signup Request Body:", requestBody);

      const res = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error cases
        if (res.status === 409) {
          // Email already exists - check if user needs to verify OTP
          setError("Email already registered. If you haven't verified your account, you can try to verify with OTP or login if already verified.");
          // Set otpSent to true to allow OTP verification attempt
          setOtpSent(true);
          return;
        } else if (res.status === 500) {
          // Internal server error - user might be registered but OTP sending failed
          setError("Account created but there was an issue sending verification email. You can try to verify with OTP or login if already verified.");
          // Allow user to proceed to OTP verification even if email sending failed
          setOtpSent(true);
          return;
        } else {
          throw new Error(data.message || "Signup failed");
        }
      }

      // Only set otpSent if we get a successful response
      setOtpSent(true);
      setSuccess("OTP sent to your email! Please verify to continue.");
      
      // Start initial cooldown timer
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      setSuccess("Account verified successfully! Logging you in...");

      // Auto login after verification
      setTimeout(async () => {
        const loginRes = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();

        if (loginRes.ok) {
          localStorage.setItem("token", loginData.token);
          localStorage.setItem("role", loginData.user.role);
          window.dispatchEvent(new Event("authChange"));
          router.push("/" + loginData.user.role.toLowerCase());
        }
      }, 1000);
    } catch (error: any) {
      setError(error.message);
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
      
      // Start 60-second cooldown
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setOtpSent(true);
      setSuccess("OTP sent to your email! Please check your inbox.");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      setSuccess("Password reset successful! You can now login.");
      setTimeout(() => {
        resetForm();
        setAuthMode("login");
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: "login" | "signup" | "forgot" | "reset") => {
    resetForm();
    setAuthMode(mode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-center justify-between mb-2">
              {(authMode === "forgot" || authMode === "reset" || otpSent) && (
                <button
                  onClick={() => {
                    resetForm();
                    setAuthMode("login");
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1 text-center">
                <h1 className="text-3xl font-bold">
                  {authMode === "login" && "Welcome Back"}
                  {authMode === "signup" && !otpSent && "Create Account"}
                  {authMode === "signup" && otpSent && "Verify Email"}
                  {authMode === "forgot" && !otpSent && "Forgot Password"}
                  {authMode === "forgot" && otpSent && "Reset Password"}
                  {authMode === "reset" && "Reset Password"}
                </h1>
              </div>
            </div>
            <p className="text-indigo-100 text-center text-sm">
              {authMode === "login" && "Sign in to continue your journey"}
              {authMode === "signup" &&
                !otpSent &&
                "Join us today and get started"}
              {authMode === "signup" &&
                otpSent &&
                "Enter the OTP sent to your email"}
              {authMode === "forgot" &&
                !otpSent &&
                "We'll send you a reset code"}
              {authMode === "forgot" && otpSent && "Enter OTP and new password"}
            </p>
          </div>

          {/* Form Container */}
          <div className="p-8">
            {/* Alert Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            )}

            {/* SIGNUP FORM */}
            {authMode === "signup" && !otpSent && (
              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
                    required
                    disabled={loading}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unique Identifier{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={uniqueIdentifier}
                    onChange={(e) => setUniqueIdentifier(e.target.value)}
                    placeholder="Auto-generated if left empty"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    disabled={loading}
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Image URL{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            )}

            {/* OTP VERIFICATION FOR SIGNUP */}
            {authMode === "signup" && otpSent && (
              <div className="space-y-6">
                {/* OTP Instructions */}
                <div className={`text-center border rounded-xl p-4 ${
                  error && error.includes("issue sending verification email") 
                    ? "bg-yellow-50 border-yellow-200" 
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <div className="flex items-center justify-center mb-2">
                    <Mail className={`w-5 h-5 mr-2 ${
                      error && error.includes("issue sending verification email") 
                        ? "text-yellow-600" 
                        : "text-blue-600"
                    }`} />
                    <span className={`text-sm font-semibold ${
                      error && error.includes("issue sending verification email") 
                        ? "text-yellow-800" 
                        : "text-blue-800"
                    }`}>
                      {error && error.includes("issue sending verification email") 
                        ? "Email Verification (Resend Required)" 
                        : "Email Verification Required"}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    error && error.includes("issue sending verification email") 
                      ? "text-yellow-700" 
                      : "text-blue-700"
                  }`}>
                    {autoResending 
                      ? "Automatically resending verification code..."
                      : error && error.includes("issue sending verification email") 
                        ? "There was an issue sending the verification email. Please use the resend button below to get your verification code."
                        : `We've sent a 6-digit verification code to ${email}`
                    }
                  </p>
                  <p className={`text-xs mt-1 ${
                    error && error.includes("issue sending verification email") 
                      ? "text-yellow-600" 
                      : "text-blue-600"
                  }`}>
                    {error && error.includes("issue sending verification email") 
                      ? "Click 'Resend Verification Code' below to receive your OTP."
                      : "Please check your email and enter the code below to complete your registration."
                    }
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
                              index < otp.length
                                ? "bg-green-500"
                                : "bg-gray-300"
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
                      {loading ? (
                        "Resending..."
                      ) : resendCooldown > 0 ? (
                        `Resend in ${resendCooldown}s`
                      ) : (
                        "Resend Verification Code"
                      )}
                    </button>
                    
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setAuthMode("login");
                        }}
                        disabled={loading}
                        className="text-sm text-gray-600 hover:text-gray-700 font-medium hover:underline"
                      >
                        Already verified? Try logging in
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authMode === "forgot" && !otpSent && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? "Sending OTP..." : "Send Reset Code"}
                </button>
              </form>
            )}

            {/* RESET PASSWORD FORM */}
            {authMode === "forgot" && otpSent && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="Enter 6-digit OTP"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-center text-2xl tracking-widest font-semibold"
                      required
                      disabled={loading}
                      maxLength={6}
                      pattern="\d{6}"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleForgotPassword(new Event("submit") as any)
                  }
                  disabled={loading}
                  className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Resend OTP
                </button>
              </form>
            )}

            {/* Footer Links */}
            {!otpSent && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {authMode === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("signup")}
                        disabled={loading}
                        className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline disabled:opacity-50"
                      >
                        Sign up
                      </button>
                    </>
                  ) : authMode === "signup" ? (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("login")}
                        disabled={loading}
                        className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline disabled:opacity-50"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Remember your password?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("login")}
                        disabled={loading}
                        className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline disabled:opacity-50"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
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
