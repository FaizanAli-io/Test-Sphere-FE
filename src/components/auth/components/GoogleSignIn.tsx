import React, { useState } from "react";

import api from "@/hooks/useApi";
import { extractErrorMessage } from "@/utils/error";
import { auth, googleProvider } from "@/utils/firebase";

import { signInWithPopup } from "firebase/auth";
import GoogleSignupModal from "./GoogleSignupModal";

interface GoogleSignInProps {
  mode: "login" | "signup";
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  setLoading: (loading: boolean) => void;
  router: {
    push: (href: string) => void;
  };
}

export default function GoogleSignIn({
  mode,
  setError,
  setSuccess,
  setLoading,
  router
}: GoogleSignInProps) {
  const [showModal, setShowModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<{
    email: string | null;
    uid: string;
    displayName: string | null;
    photoURL: string | null;
  } | null>(null);

  const completeSignup = async (details: {
    role: "STUDENT" | "TEACHER";
    cnic: string;
  }) => {
    if (!pendingUser) return;
    try {
      setLoading(true);

      const signupPayload = {
        email: pendingUser.email,
        firebaseId: pendingUser.uid,
        name:
          pendingUser.displayName || pendingUser.email?.split("@")[0] || "User",
        role: details.role,
        cnic: details.cnic,
        profileImage: pendingUser.photoURL || undefined
      };

      const res = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify(signupPayload)
      });

      const data: {
        message?: string;
        accessToken?: string;
        user?: { role: string; name?: string };
      } = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Signup failed");
      }

      if (data.accessToken) localStorage.setItem("token", data.accessToken);
      if (data.user?.role) localStorage.setItem("role", data.user.role);

      window.dispatchEvent(new Event("authChange"));
      setSuccess(data.user?.name ? `Welcome, ${data.user.name}!` : "Success!");
      setShowModal(false);
      setPendingUser(null);

      setTimeout(() => {
        if (data.user?.role) {
          router.push("/" + data.user.role.toLowerCase());
        } else {
          router.push("/");
        }
      }, 1000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      console.error(" Google Signup Error:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      googleProvider.setCustomParameters({
        prompt: "select_account"
      });

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (mode === "signup") {
        setPendingUser({
          email: user.email,
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
        setShowModal(true);
        setLoading(false);
        return;
      }

      const loginPayload = {
        email: user.email,
        firebaseId: user.uid
      };

      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginPayload)
      });

      const data: {
        message?: string;
        accessToken?: string;
        user?: { role: string; name?: string };
      } = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.accessToken) localStorage.setItem("token", data.accessToken);
      if (data.user?.role) localStorage.setItem("role", data.user.role);
      window.dispatchEvent(new Event("authChange"));
      setSuccess(data.user?.name ? `Welcome, ${data.user.name}!` : "Success!");
      setTimeout(() => {
        if (data.user?.role) {
          router.push("/" + data.user.role.toLowerCase());
        } else {
          router.push("/");
        }
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);

      if (
        errorMessage.includes("Cross-Origin-Opener-Policy") ||
        errorMessage.includes("window.close")
      ) {
        console.warn("COOP policy warning (non-blocking):", errorMessage);

        return;
      }

      setError(errorMessage);
      console.error("❌ Google Auth Error:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium flex items-center justify-center space-x-2 hover:bg-gray-50 transition duration-200"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z"
            fill="#4285F4"
          />
          <path
            d="M12.24 24.0008C15.4764 24.0008 18.2058 22.9382 20.1944 21.1039L16.3274 18.1055C15.2516 18.8375 13.8626 19.252 12.24 19.252C9.07376 19.252 6.40373 17.1399 5.4762 14.3003H1.47168V17.3912C3.75289 21.4434 7.77719 24.0008 12.24 24.0008Z"
            fill="#34A853"
          />
          <path
            d="M5.47621 14.3003C5.04369 12.8099 5.04369 11.1961 5.47621 9.70575V6.61481H1.47167C-0.194208 10.0056 -0.194208 14.0004 1.47167 17.3912L5.47621 14.3003Z"
            fill="#FBBC04"
          />
          <path
            d="M12.24 4.74966C13.9508 4.7232 15.6043 5.36697 16.8433 6.54867L20.2694 3.12262C18.1 1.0855 15.2207 -0.034466 12.24 0.000808666C7.77719 0.000808666 3.75289 2.55822 1.47168 6.61481L5.47622 9.70575C6.39873 6.86616 9.07376 4.74966 12.24 4.74966Z"
            fill="#EA4335"
          />
        </svg>
        <span>
          {mode === "login" ? "Login with Google" : "Sign up with Google"}
        </span>
      </button>

      <GoogleSignupModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setPendingUser(null);
        }}
        onSubmit={completeSignup}
      />
    </>
  );
}
