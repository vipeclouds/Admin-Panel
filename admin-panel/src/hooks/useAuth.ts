"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminToken, syncAdminTokenCookie } from "@/lib/auth";

export const useAuth = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setIsAuthenticated(false);
      router.replace("/login");
      return;
    }
    syncAdminTokenCookie();
    setIsAuthenticated(true);
  }, [router]);

  return { isAuthenticated };
};
