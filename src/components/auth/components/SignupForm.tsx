import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, CreditCard } from "lucide-react";

import api from "@/hooks/useApi";
import GoogleSignIn from "./GoogleSignIn";
import { extractErrorMessage } from "@/utils/error";

interface RouterLike {
  push: (href: string) => void;
}

interface SignupFormProps {
  email: string;
  password: string;
  loading: boolean;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  setLoading: (loading: boolean) => void;
  setOtpSent: (sent: boolean) => void;
  router: RouterLike;
}

export default function SignupForm({
  email,
  password,
  loading,
  setEmail,
  setPassword,
  setError,
  setSuccess,
  setLoading,
  setOtpSent,
  router
}: SignupFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [cnic, setCnic] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const requestBody = {
        email,
        password,
        name,
        role,
        cnic,
        profileImage: profileImage || undefined
      };

      const res = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify(requestBody)
      });

      const data: { message?: string } = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(
            "Email already registered. If you haven't verified your account, you can try to verify with OTP or login if already verified."
          );
          setOtpSent(true);
          return;
        } else if (res.status === 500) {
          setError(
            "Account created but there was an issue sending verification email. You can try to verify with OTP or login if already verified."
          );
          setOtpSent(true);
          return;
        } else {
          throw new Error(data.message || "Signup failed");
        }
      }

      setOtpSent(true);
      setSuccess("OTP sent to your email! Please verify to continue.");
    } catch (err: unknown) {
      setError(
        extractErrorMessage(
          err,
          "An unexpected error occurred. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <GoogleSignIn
        mode="signup"
        setError={setError}
        setSuccess={setSuccess}
        setLoading={setLoading}
        router={router}
      />

      <div className="relative flex items-center justify-center">
        <div className="absolute w-full border-t border-gray-300"></div>
        <div className="relative bg-white px-4">
          <span className="text-sm text-gray-500">Or continue with email</span>
        </div>
      </div>

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
          <option value="" disabled>
            Select Role
          </option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          CNIC
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={cnic}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setCnic(value);
            }}
            placeholder="3520212345678"
            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            required
            disabled={loading}
            maxLength={13}
            minLength={13}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">13-digit CNIC number</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Profile Image URL{" "}
          <span className="text-gray-400 font-normal">(Optional)</span>
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
  );
}
