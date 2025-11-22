"use client";

import { useEffect } from "react";

/**
 * Cleanup component to unregister any lingering service workers
 * This prevents 404 errors for old service worker files
 */
export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          registrations.forEach((registration) => {
            registration.unregister();
            console.log("🧹 Unregistered old service worker");
          });
        }
      });
    }
  }, []);

  return null;
}
