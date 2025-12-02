import { useState, useRef, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import api from "@/hooks/useApi";
import GoogleSignIn from "./GoogleSignIn";
import { extractErrorMessage } from "@/utils/error";

interface RouterLike {
  push: (href: string) => void;
}

interface LoginFormProps {
  email: string;
  password: string;
  loading: boolean;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  setLoading: (loading: boolean) => void;
  onForgotPassword: () => void;
  router: RouterLike;
}

export default function LoginForm({
  email,
  password,
  loading,
  setEmail,
  setPassword,
  setError,
  setSuccess,
  setLoading,
  onForgotPassword,
  router,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data: {
        message?: string;
        accessToken?: string;
        user?: { role: string; name?: string };
      } = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.accessToken && data.user?.role) {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("role", data.user.role);

        await new Promise((resolve) => setTimeout(resolve, 50));

        window.dispatchEvent(new Event("authChange"));
        if (data.user.name) setSuccess(`Welcome back, ${data.user.name}!`);

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set timeout with proper cleanup
        timeoutRef.current = setTimeout(() => {
          router.push("/" + data.user!.role.toLowerCase());
          timeoutRef.current = null;
        }, 1000);
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <GoogleSignIn
        mode="login"
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
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
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
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
  );
}
