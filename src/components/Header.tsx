"use client";

import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, GraduationCap, Menu, X, User } from "lucide-react";
import api from "../hooks/useApi";

// Enhanced, animated, accessible header
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const publicRoutes = ["/", "/login", "/signup"];

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;
      const res = await api("/auth/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const authed = !!token;
      setIsAuth(authed);
      if (authed && !userProfile) fetchUserProfile();
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("authChange", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("authChange", checkAuth);
    };
  }, [fetchUserProfile, userProfile]);

  const handleShowProfile = () => {
    setShowProfileModal(true);
    fetchUserProfile();
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("authChange"));
    router.replace("/");
  };

  // Hide header on public routes or unauthenticated
  if (publicRoutes.includes(pathname ?? "") || !isAuth) return null;

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <>
      <header
        className="fixed top-0 w-full z-50 supports-[backdrop-filter]:bg-white/70 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]"
        role="banner"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 lg:px-8 py-3.5">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
            aria-label="Go to home"
          >
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-2.5 rounded-xl group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              TestSphere
            </span>
          </Link>

          {/* Desktop actions */}
          <nav
            className="hidden md:flex items-center space-x-3"
            aria-label="Primary navigation"
          >
            <button
              onClick={() => router.push("/prepguru")}
              className={`relative flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all duration-500 font-semibold overflow-hidden group shadow-lg bg-size-200 bg-pos-0 hover:bg-pos-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                isActive("/prepguru")
                  ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 text-white shadow-indigo-500/40"
                  : "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/40"
              }`}
              aria-current={isActive("/prepguru") ? "page" : undefined}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="text-sm relative z-10">PrepGuru</span>
            </button>
            <button
              onClick={handleShowProfile}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:shadow-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-haspopup="dialog"
              aria-expanded={showProfileModal}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/35 hover:scale-105 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-800" />
            ) : (
              <Menu className="w-6 h-6 text-gray-800" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden origin-top transition-[opacity,transform] duration-300 ease-out ${
            isMenuOpen
              ? "animate-slideDown"
              : "pointer-events-none opacity-0 -translate-y-2"
          } bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl`}
          aria-hidden={!isMenuOpen}
        >
          {isMenuOpen && (
            <div className="px-6 py-5 space-y-3">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/prepguru");
                }}
                className={`w-full flex items-center justify-center px-5 py-3.5 rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 text-white ${
                  isActive("/prepguru") ? "ring-2 ring-indigo-400/60" : ""
                }`}
                aria-current={isActive("/prepguru") ? "page" : undefined}
              >
                PrepGuru
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleShowProfile();
                }}
                className="w-full flex items-center justify-center space-x-2 px-5 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-medium hover:shadow-md"
                aria-haspopup="dialog"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center justify-center space-x-2 px-5 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/35 hover:scale-[1.02] font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Local component-specific styles */}
        <style jsx>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-slideDown {
            animation: slideDown 0.35s ease-out;
          }
          .animate-fadeIn {
            animation: fadeIn 0.25s ease-out;
          }
          .animate-scaleIn {
            animation: scaleIn 0.35s ease-out;
          }
          .bg-size-200 {
            background-size: 200%;
          }
          .bg-pos-0 {
            background-position: 0%;
          }
          .bg-pos-100 {
            background-position: 100%;
          }
          .card-gradient-blue,
          .card-gradient-indigo,
          .card-gradient-purple,
          .card-gradient-green {
            @apply p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md;
            background: linear-gradient(135deg, var(--tw-gradient-stops));
          }
          .card-gradient-blue {
            --tw-gradient-from: #f8fafc;
            --tw-gradient-to: rgba(59, 130, 246, 0.08);
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
          }
          .card-gradient-indigo {
            --tw-gradient-from: #f8fafc;
            --tw-gradient-to: rgba(79, 70, 229, 0.08);
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
          }
          .card-gradient-purple {
            --tw-gradient-from: #f8fafc;
            --tw-gradient-to: rgba(139, 92, 246, 0.08);
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
          }
          .card-gradient-green {
            --tw-gradient-from: #f8fafc;
            --tw-gradient-to: rgba(34, 197, 94, 0.08);
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
          }
          .card-gradient-blue:hover {
            border-color: #93c5fd;
          }
          .card-gradient-indigo:hover {
            border-color: #818cf8;
          }
          .card-gradient-purple:hover {
            border-color: #a78bfa;
          }
          .card-gradient-green:hover {
            border-color: #86efac;
          }
          .label {
            @apply text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1;
          }
          .value {
            @apply text-gray-800 font-medium;
          }
          .custom-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 9999px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-slideDown,
            .animate-fadeIn,
            .animate-scaleIn {
              animation: none !important;
            }
            .hover\:scale-105:hover,
            .hover\:scale-\[1\.02\]:hover {
              transform: none !important;
            }
          }
        `}</style>
      </header>
      {/* Profile Modal (Portal) */}
      {showProfileModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-label="User profile"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowProfileModal(false)}
            />
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto custom-scroll border border-gray-100">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-all duration-300 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close profile modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="px-7 pt-8 pb-8">
                <h2 className="text-2xl font-bold mb-6 text-black">
                  Profile Information
                </h2>
                {loading ? (
                  <div
                    className="flex justify-center items-center py-12"
                    aria-live="polite"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-blue-200 rounded-full" />
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                    </div>
                  </div>
                ) : userProfile ? (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-100">
                      {userProfile.profileImage ? (
                        <img
                          src={userProfile.profileImage}
                          alt="Profile avatar"
                          className="w-20 h-20 rounded-2xl object-cover shadow-lg ring-4 ring-blue-100"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                          <span className="text-white text-2xl font-bold">
                            {userProfile.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-black mb-1">
                          {userProfile.name}
                        </h3>
                        <p className="text-black font-medium text-sm px-3 py-1 bg-gray-100 rounded-lg inline-block">
                          {userProfile.role}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="card-gradient-blue">
                        <p className="label text-black font-extrabold text-sm">
                          Email
                        </p>
                        <p className="value text-black">{userProfile.email}</p>
                      </div>
                      <div className="card-gradient-indigo">
                        <p className="label text-black font-extrabold text-sm">
                          Member Since
                        </p>
                        <p className="value text-black">
                          {new Date(userProfile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="card-gradient-purple">
                        <p className="label text-black font-extrabold text-sm">
                          User ID
                        </p>
                        <p className="value font-mono text-sm break-all text-black">
                          {userProfile.uniqueIdentifier}
                        </p>
                      </div>
                      <div className="card-gradient-green">
                        <p className="label text-black font-extrabold text-sm">
                          Email Status
                        </p>
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full shadow-lg ${
                              userProfile.verified
                                ? "bg-green-500 shadow-green-500/50"
                                : "bg-yellow-500 shadow-yellow-500/50"
                            }`}
                            aria-label={
                              userProfile.verified
                                ? "Email verified"
                                : "Email not verified"
                            }
                          />
                          <p className={`font-medium text-black`}>
                            {userProfile.verified ? "Verified" : "Not Verified"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="mt-6 w-full text-sm font-medium text-black underline decoration-gray-300 hover:decoration-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500" role="alert">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="font-medium">
                      Failed to load profile information
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="mt-6 inline-flex items-center text-sm font-medium text-black underline decoration-gray-300 hover:decoration-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
