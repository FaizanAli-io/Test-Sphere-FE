"use client";

import dynamic from "next/dynamic";

const PrepGuru = dynamic(() => import("@/components/PrepGuru"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
    </div>
  ),
  ssr: false,
});

export default function PrepGuruPage() {
  return <PrepGuru />;
}
