"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Exclude auth-related public pages
  const isPublicPage = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-otp"].includes(pathname);

  useEffect(() => {
    if (isPublicPage) return;

    // --- Inactivity Tracking ---
    const updateActivity = () => {
      localStorage.setItem("last_active", Date.now().toString());
    };

    const checkInactivity = () => {
      const lastActiveStr = localStorage.getItem("last_active");
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (Date.now() - lastActive > INACTIVITY_LIMIT_MS) {
          // Inactive for > 1 hour -> Force logout
          fetch("/api/auth/logout", { method: "POST" })
            .then(() => {
              localStorage.removeItem("last_active");
              router.push("/login");
            })
            .catch(console.error);
        }
      } else {
        updateActivity();
      }
    };

    // Attach listeners
    window.addEventListener("mousemove", updateActivity, { passive: true });
    window.addEventListener("keydown", updateActivity, { passive: true });
    window.addEventListener("click", updateActivity, { passive: true });
    window.addEventListener("scroll", updateActivity, { passive: true });

    // Check inactivity every minute
    const inactivityCheckInterval = setInterval(checkInactivity, 60 * 1000);
    // Initial check on mount
    checkInactivity();

    // --- Token Refresh Polling ---
    const refreshToken = async () => {
      const lastActiveStr = localStorage.getItem("last_active");
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        // Only refresh if active recently (prevent unnecessary refreshes if they left tab open but inactive)
        if (Date.now() - lastActive < INACTIVITY_LIMIT_MS) {
          try {
            const res = await fetch("/api/auth/refresh", { method: "POST" });
            if (!res.ok) {
              // If refresh fails (e.g., refresh token expired), they should log in again
              router.push("/login");
            }
          } catch (error) {
            console.error("Failed to refresh token", error);
          }
        }
      }
    };

    // Refresh initially just in case the access token is close to expiring on reload
    refreshToken();
    // Then set interval
    refreshIntervalRef.current = setInterval(refreshToken, REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      clearInterval(inactivityCheckInterval);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [isPublicPage, router]);

  return <>{children}</>;
}
