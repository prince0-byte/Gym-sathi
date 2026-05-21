import { create } from "zustand";

interface AuthState {
  accessToken: string | null; refreshToken: string | null;
  role: string | null; gymId: number | null;
  gymName: string | null; subscriptionStatus: string | null;
  isHydrated: boolean;
  setAuth: (data: { access_token: string; refresh_token: string; role: string; gym_id: number; gym_name: string; subscription_status: string }) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null, refreshToken: null, role: null,
  gymId: null, gymName: null, subscriptionStatus: null, isHydrated: false,
  setAuth: (data) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("gym_id", String(data.gym_id));
      localStorage.setItem("gym_name", data.gym_name);
      localStorage.setItem("subscription_status", data.subscription_status);
    }
    set({ accessToken: data.access_token, refreshToken: data.refresh_token,
          role: data.role, gymId: data.gym_id, gymName: data.gym_name,
          subscriptionStatus: data.subscription_status });
  },
  logout: () => {
    if (typeof window !== "undefined") localStorage.clear();
    set({ accessToken: null, refreshToken: null, role: null, gymId: null, gymName: null, subscriptionStatus: null });
  },
  hydrate: () => {
    if (typeof window !== "undefined") {
      set({
        accessToken: localStorage.getItem("access_token"),
        refreshToken: localStorage.getItem("refresh_token"),
        role: localStorage.getItem("role"),
        gymId: Number(localStorage.getItem("gym_id")) || null,
        gymName: localStorage.getItem("gym_name"),
        subscriptionStatus: localStorage.getItem("subscription_status"),
        isHydrated: true,
      });
    }
  },
}));
