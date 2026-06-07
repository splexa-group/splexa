"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/services/auth";

export function AuthRehydrator() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setReady = useAuthStore((s) => s.setReady);

  useEffect(() => {
    if (user) {
      setReady();
      return;
    }

    authApi
      .me()
      .then(setAuth)
      .catch(() => {
        /* 401 interceptor handles redirect to /login */
      })
      .finally(setReady);
  }, [user, setAuth, setReady]);

  return null;
}
