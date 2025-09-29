// src/components/Auth.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulated token (in real app, fetch from backend)
    const fakeToken = "abcd1234";
    const expiry = new Date().getTime() + 60 * 60 * 1000; // 1 hour later

    // Decide role (for demo: if email includes "teacher", role=teacher else student)
    const role = email.includes("teacher") ? "teacher" : "student";

    // Save to localStorage
    localStorage.setItem("token", fakeToken);
    localStorage.setItem("tokenExpiry", expiry.toString());
    localStorage.setItem("role", role);

    alert(`${isLogin ? "Logged in" : "Signed up"} as ${role}`);

    // Redirect based on role
    if (role === "teacher") {
      router.push("/admin");
    } else {
      router.push("/student");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-blue-100">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h1>
        <p className="text-center text-gray-500 mb-8">
          {isLogin
            ? "Login to access your courses and materials"
            : "Sign up to start your learning journey"}
        </p>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
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
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* Switch */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? "Sign up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
