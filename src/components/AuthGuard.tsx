"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  const publicRoutes = useMemo(() => ["/", "/login", "/signup"], []);
  const teacherRoutes = useMemo(() => ["/teacher"], []);
  const studentRoutes = useMemo(() => ["/student"], []);

  const matchesRoute = useCallback(
    (path: string, patterns: string[]): boolean => {
      return patterns.some((pattern) => {
        if (pattern.includes("[") && pattern.includes("]")) {
          const regexPattern = pattern.replace(/\[.*?\]/g, "[^/]+");
          const regex = new RegExp(`^${regexPattern}$`);
          return regex.test(path);
        }
        return path === pattern || path.startsWith(pattern + "/");
      });
    },
    []
  );

  useEffect(() => {
    // Check if we're on the client side before accessing localStorage
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    // Early exit for public routes
    if (publicRoutes.includes(pathname ?? "")) {
      setLoading(false);
      return;
    }

    if (!token) {
      router.replace("/");
      setLoading(false);
      return;
    }

    if (token && role) {
      try {
        const userRole = role.toUpperCase();

        // Check role-based access
        if (
          pathname &&
          matchesRoute(pathname, studentRoutes) &&
          userRole !== "STUDENT"
        ) {
          router.replace("/teacher");
          setLoading(false);
          return;
        }

        const teacherRoutesWithClass = [...teacherRoutes, "/class/[classId]"];
        if (
          pathname &&
          matchesRoute(pathname, teacherRoutesWithClass) &&
          userRole !== "TEACHER"
        ) {
          router.replace("/student");
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Error with role data:", error);

        localStorage.removeItem("role");
        localStorage.removeItem("token");
        router.replace("/");
        setLoading(false);
        return;
      }
    } else {
      setLoading(false);
    }
  }, [
    pathname,
    router,
    publicRoutes,
    studentRoutes,
    teacherRoutes,
    matchesRoute,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold">
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}
