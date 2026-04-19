import { create } from 'zustand';
import type { AuthUser } from '@/services/api/auth';
import { fetchMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '@/services/api/auth';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  load: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    displayName?: string;
    inviteCode?: string;
  }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  load: async () => {
    set({ isLoading: true });
    const user = await fetchMe();
    set({ user, isLoading: false });
  },

  login: async (email, password) => {
    const user = await apiLogin(email, password);
    set({ user });
  },

  register: async (input) => {
    const user = await apiRegister(input);
    set({ user });
  },

  logout: () => {
    apiLogout();
    set({ user: null });
  },
}));
