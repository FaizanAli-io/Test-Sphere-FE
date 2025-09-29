"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Header(): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [tokenIsValid, setTokenIsValid] = useState(false);

  const isTokenValid = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("token");
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    if (!token || !tokenExpiry) return false;
    const currentTime = new Date().getTime();
    return currentTime < Number.parseInt(tokenExpiry, 10);
  }, []);

  // Check token validity on client side only
  useEffect(() => {
    setTokenIsValid(isTokenValid());
  }, [isTokenValid, pathname]);

  useEffect(() => {
    if (tokenIsValid) {
      const storedRole = localStorage.getItem("role");
      if (storedRole) setRole(storedRole);
    } else {
      setRole(null);
    }
  }, [tokenIsValid]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = useCallback(async () => {
    if (typeof window === "undefined") return;
    localStorage.clear();
    try {
      // Best-effort: clear IndexedDB database if present (client-side only)
      if (typeof window !== "undefined") {
        try {
          const { deleteDB } = await import("idb").catch(() => ({
            deleteDB: null,
          }));
          if (deleteDB) {
            await deleteDB("TestProctoringDB");
          }
        } catch (idbError) {
          console.warn("IndexedDB cleanup failed:", idbError);
        }
      }
    } catch {}
    router.replace("/");
  }, [router]);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        {/* Logo */}
        <Link
          href={
            tokenIsValid ? (role === "teacher" ? "/admin" : "/student") : "/"
          }
          onClick={() => setIsMenuOpen(false)}
          className="text-2xl font-bold text-blue-600 hover:text-blue-800 transition"
        >
          TestSphere
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {!tokenIsValid && (
            <>
              <Link
                href="/how-it-works"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                How it Works
              </Link>
              <Link
                href="/faqs"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                FAQs
              </Link>
              <Link
                href="/auth"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Login / Sign Up
              </Link>
            </>
          )}

          {tokenIsValid && role === "teacher" && (
            <>
              <Link
                href="/admin"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Home
              </Link>
              <Link
                href="/teacherdashboard"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </>
          )}

          {tokenIsValid && role === "student" && (
            <>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Dashboard
              </Link>
              <Link
                href="/student"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Student Portal
              </Link>
              <Link
                href="/studentai"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Ask a Question
              </Link>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex flex-col space-y-1"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span
            className={`h-1 w-6 bg-gray-800 rounded transition ${
              isMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`h-1 w-6 bg-gray-800 rounded transition ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-1 w-6 bg-gray-800 rounded transition ${
              isMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg px-6 py-4 space-y-4">
          {!tokenIsValid && (
            <>
              <Link
                href="/how-it-works"
                className="block text-gray-700 hover:text-blue-600 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link
                href="/faqs"
                className="block text-gray-700 hover:text-blue-600 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQs
              </Link>
              <Link
                href="/auth"
                className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Login / Sign Up
              </Link>
            </>
          )}

          {tokenIsValid && role === "teacher" && (
            <>
              <Link
                href="/admin"
                className="block text-gray-700 hover:text-blue-600 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/teacherdashboard"
                className="block text-gray-700 hover:text-blue-600 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleSignOut();
                }}
                className="block bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-center"
              >
                Sign Out
              </button>
            </>
          )}

          {tokenIsValid && role === "student" && (
            <>
              <Link
                href="/dashboard"
                className="block text-gray-700 hover:text-blue-600 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/student"
                className="block text-gray-700 hover:text-blue-600 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Student Portal
              </Link>
              <Link
                href="/studentai"
                className="block text-gray-700 hover:text-blue-600 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Ask a Question
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleSignOut();
                }}
                className="block bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-center"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
