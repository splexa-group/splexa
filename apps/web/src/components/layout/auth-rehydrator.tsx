'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/services/auth';

export function AuthRehydrator() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (user) return;
    authApi.me().then(setAuth).catch(() => {
      // 401 interceptor in api/client.ts handles redirect to /login
    });
  }, [user, setAuth]);

  return null;
}
