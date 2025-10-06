"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, GraduationCap, Menu, X } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const publicRoutes = ["/", "/login", "/signup"];

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsAuth(!!token);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("authChange", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("authChange", checkAuth);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("authChange"));
    router.replace("/");
  };

  // Don’t show header on login/signup/public routes
  if (publicRoutes.includes(pathname)) {
    return null;
  }

  if (!isAuth) return null;

  return (
    <header className="fixed top-0 w-full z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 lg:px-8 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg group-hover:shadow-lg transition-all">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TestSphere
          </span>
        </Link>

        {/* Desktop actions */}
        <nav className="hidden md:flex items-center space-x-4">
          <button
            onClick={() => router.push("/prepguru")}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            <span className="text-sm">PrepGuru</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </nav>

        {/* Mobile Menu */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-gray-800" />
          ) : (
            <Menu className="w-6 h-6 text-gray-800" />
          )}
        </button>
      </div>

      {/* Mobile Menu Options */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-6 py-4 space-y-3">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                router.push("/prepguru");
              }}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all font-semibold"
            >
              PrepGuru
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleSignOut();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
