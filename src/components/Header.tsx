"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut, UserCircle, Loader2, GraduationCap } from "lucide-react";
import ProfileModal from "./ProfileModal";
import { api } from "../hooks/useApi";

interface UserProfile {
  id: number;
  name: string;
  role: string;
  email: string;
  verified: boolean;
  createdAt: string;
  profileImage?: string;
  uniqueIdentifier?: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const publicRoutes = ["/", "/login", "/signup"];

  const fetchUser = useCallback(async () => {
    try {
      setLoadingUser(true);
      const res = await api("/auth/me", { auth: true, method: "GET" });
      if (!res.ok) {
        // Not authenticated or failed
        setUser(null);
        setIsAuth(false);
        return;
      }
      const data = await res.json();
      setUser(data);
      setIsAuth(true);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
      setIsAuth(false);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    // initial auth check
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsAuth(!!token);
    if (token) fetchUser();

    const onAuthChange = () => {
      const t =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      setIsAuth(!!t);
      if (t) fetchUser();
      else {
        setUser(null);
      }
    };

    window.addEventListener("storage", onAuthChange);
    window.addEventListener("authChange", onAuthChange);
    return () => {
      window.removeEventListener("storage", onAuthChange);
      window.removeEventListener("authChange", onAuthChange);
    };
  }, [fetchUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuth(false);
    window.dispatchEvent(new Event("authChange"));
    router.replace("/");
  };

  // Hide header on absolute public pages or when unauthenticated
  if (publicRoutes.includes(pathname ?? "") || !isAuth) return null;

  const handleProfileSaved = (updated: UserProfile) => {
    setUser(updated);
  };

  return (
    <>
      <header className="w-full bg-gradient-to-b from-white to-gray-50 backdrop-blur-md border-b border-gray-200 shadow-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          {/* TestSphere logo (left) */}
          <div className="flex items-center">
            <button
              onClick={() => router.push("/" + user?.role.toLowerCase())}
              className="flex items-center gap-2 group"
              aria-label="Go to Dashboard"
            >
              <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center shadow-lg ring-2 ring-white group-hover:shadow-indigo-500/30 group-hover:scale-105 transition-all duration-200">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3 hidden sm:block">
                <span className="text-gray-900 font-bold text-lg tracking-tight">
                  Test{"    "}
                  <span className="text-indigo-600">Sphere</span>
                </span>
                <span className="block text-xs text-gray-500 -mt-0.5 font-medium">
                  Proctoring Simplified
                </span>
              </div>
            </button>
          </div>

          {/* Spacer to push buttons to the right */}
          <div className="flex-1" />

          {/* Three buttons on the right: PrepGuru, Logout, Profile */}
          <div className="flex items-center gap-3">
            {/* PrepGuru button */}
            <button
              onClick={() => router.push("/prepguru")}
              className="inline-flex items-center px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-white shadow-md hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              aria-label="Go to PrepGuru"
            >
              <span className="bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                <span className="text-xs font-bold">P</span>
              </span>
              <span className="hidden sm:inline">PrepGuru</span>
            </button>

            {/* Logout button (with animation) */}
            <button
              onClick={handleLogout}
              className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-red-200 text-red-600 shadow-sm hover:bg-red-50 hover:shadow-md transition-all duration-200"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-sm font-medium hidden sm:inline">
                Logout
              </span>
            </button>

            {/* Profile button */}
            <button
              onClick={() => {
                setShowProfileModal(true);
                // ensure we have latest profile when opening
                fetchUser();
              }}
              className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-2 ring-indigo-100 ring-offset-2 shadow-md flex items-center justify-center overflow-hidden bg-white hover:scale-105 hover:ring-indigo-300 transition-all duration-200"
              aria-label="Open profile"
            >
              {loadingUser ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              ) : user?.profileImage ? (
                <>
                  <Image
                    src={user.profileImage}
                    alt={user.name || "User"}
                    fill
                    className="object-cover"
                    onError={() => {
                      // Use state-based approach instead of DOM manipulation
                      // This will trigger a re-render with the fallback div
                      setUser((prev) =>
                        prev ? { ...prev, profileImage: undefined } : prev
                      );
                    }}
                  />
                  {/* Hidden fallback that will be shown if setUser triggers re-render */}
                  <div className="w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() ? (
                      user.name.charAt(0).toUpperCase()
                    ) : (
                      <UserCircle className="w-6 h-6" strokeWidth={2} />
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ? (
                    user.name.charAt(0).toUpperCase()
                  ) : (
                    <UserCircle className="w-6 h-6" strokeWidth={2} />
                  )}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {showProfileModal && (
        <ProfileModal
          userProfile={user}
          loading={loadingUser}
          onClose={() => setShowProfileModal(false)}
          onSaved={(updated) => {
            handleProfileSaved(updated);
            setShowProfileModal(false);
          }}
        />
      )}
    </>
  );
}
