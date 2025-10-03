"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../app/hooks/useApi";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Login failed");
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        alert(`Logged in as ${data.user.role}`);
        router.push(data.user.role === "teacher" ? "/admin" : "/student");
      } else {
        const emailPrefix = email.split("@")[0].slice(0, 10); // limit to 10 chars
        const randomNum = Math.floor(Math.random() * 10000); // 4 digits max
        const uniqueIdentifier = `${emailPrefix}-${randomNum}`.slice(0, 20);

        const signupRes = await api("/auth/signup", {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            uniqueIdentifier,
          }),
        });

        const signupData = await signupRes.json();

        if (!signupRes.ok) {
          throw new Error(signupData.message || "Signup failed");
        }

        // Automatically log in the user after signup
        const loginRes = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok) {
          throw new Error(loginData.message || "Login after signup failed");
        }

        localStorage.setItem("token", loginData.token);
        localStorage.setItem("role", loginData.user.role);
        alert(`Logged in as ${loginData.user.role}`);
        router.push(loginData.user.role === "teacher" ? "/admin" : "/student");
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await api("/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      alert(`Signup successful as ${data.role}`);
      if (role === "teacher") {
        router.push("/admin");
      } else {
        router.push("/student");
      }
    } catch (error: any) {
      setError(error.message);
      console.error("OTP verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-blue-100">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border rounded-xl text-gray-800 placeholder-gray-400 
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  required
                  disabled={loading}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border rounded-xl text-gray-800 placeholder-gray-400 
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              required
              disabled={loading || otpSent}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border rounded-xl text-gray-800 placeholder-gray-400 
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              required
              disabled={loading || otpSent}
              minLength={6}
            />
          </div>

          {!isLogin && otpSent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OTP
              </label>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full mt-3 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          )}

          {!otpSent && (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            </button>
          )}
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setOtpSent(false);
              setError("");
              setOtp("");
            }}
            disabled={loading}
            className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
          >
            {isLogin ? "Sign up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
