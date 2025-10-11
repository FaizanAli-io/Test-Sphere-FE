"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  const publicRoutes = useMemo(() => ["/", "/login", "/signup"], []);
  const teacherRoutes = useMemo(() => ["/teacher"], []);
  const studentRoutes = useMemo(() => ["/student"], []);

  const matchesRoute = useMemo(
    () =>
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
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token && !publicRoutes.includes(pathname)) {
      router.replace("/");
      return;
    }

    if (token && role) {
      try {
        const userRole = role.toUpperCase();

        if (matchesRoute(pathname, studentRoutes) && userRole !== "STUDENT") {
          router.replace("/teacher");
          return;
        }

        const teacherRoutesWithClass = [...teacherRoutes, "/class/[classId]"];
        if (
          matchesRoute(pathname, teacherRoutesWithClass) &&
          userRole !== "TEACHER"
        ) {
          router.replace("/student");
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Error with role data:", error);

        localStorage.removeItem("role");
        localStorage.removeItem("token");
        router.replace("/");
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
    matchesRoute
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
