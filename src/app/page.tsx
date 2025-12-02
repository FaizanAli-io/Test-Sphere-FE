"use client";

import dynamic from "next/dynamic";

const Auth = dynamic(() => import("@/components/Auth"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
    </div>
  ),
  ssr: false,
});

export default function AuthPage() {
  return <Auth />;
}
