import type { LoginUser, UserProfile } from "@splexa-group/shared/models";
import { create } from "zustand";

interface AuthState {
  user: UserProfile | LoginUser | null;
  isReady: boolean;
  setAuth: (user: UserProfile | LoginUser) => void;
  clearAuth: () => void;
  setReady: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isReady: false,
  setAuth: (user) => set({ user }),
  clearAuth: () => set({ user: null }),
  setReady: () => set({ isReady: true }),
}));
