"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // Public routes that don’t need authentication
  const publicRoutes = ["/", "/login", "/signup"];

  useEffect(() => {
    const token = localStorage.getItem("token");

    // If no token and route is protected → redirect to root
    if (!token && !publicRoutes.includes(pathname)) {
      router.replace("/");
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold">
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}
