import { AuthUser } from "@/types/user";
import { create } from "zustand";

interface AuthState {
  user: AuthUser | null;
  isReady: boolean;
  setAuth: (user: AuthUser) => void;
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
