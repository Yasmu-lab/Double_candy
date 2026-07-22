import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  name: string;
  phone: string;
  isAuthenticated: boolean;
  login: (name: string, phone: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      name: '',
      phone: '',
      isAuthenticated: false,
      login: (name, phone) => set({ name, phone, isAuthenticated: true }),
      logout: () => set({ name: '', phone: '', isAuthenticated: false }),
    }),
    { name: 'double-candy-auth' },
  ),
);

export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] || '';
