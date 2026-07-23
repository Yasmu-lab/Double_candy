import { create } from 'zustand';
import { api, ApiError, type CustomerDto } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { useCartStore } from './cartStore';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  customer: CustomerDto | null;
  justLoggedIn: boolean;
  init: () => Promise<void>;
  signUp: (name: string, phone: string, password: string, email: string) => Promise<void>;
  signIn: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: Partial<{ name: string; phone: string; email: string | null }>) => Promise<void>;
  setPhotoUrl: (photoUrl: string) => void;
  clearJustLoggedIn: () => void;
}

async function bootstrapFromSession(name: string, phone: string): Promise<CustomerDto> {
  return api.bootstrapMe({ name, phone });
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'loading',
  customer: null,
  justLoggedIn: false,

  init: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      set({ status: 'unauthenticated' });
    } else {
      try {
        const customer = await api.getMe();
        set({ status: 'authenticated', customer });
      } catch (e) {
        const meta = session.user.user_metadata as { name?: string; phone?: string };
        if (e instanceof ApiError && e.code === 'CUSTOMER_NOT_LINKED' && meta?.name && meta?.phone) {
          try {
            const customer = await bootstrapFromSession(meta.name, meta.phone);
            set({ status: 'authenticated', customer });
          } catch {
            set({ status: 'unauthenticated' });
          }
        } else {
          set({ status: 'unauthenticated' });
        }
      }
    }

    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        set({ status: 'unauthenticated', customer: null, justLoggedIn: false });
      }
    });
  },

  signUp: async (name, phone, password, email) => {
    // Real email becomes this account's actual Auth identity (unlike the old synthetic
    // phone-based one) — that's what lets supabase.auth.resetPasswordForEmail() work natively
    // for self-service password recovery later. The login UI still only ever asks for phone.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });
    if (error) throw error;
    if (!data.session) {
      throw new Error('SIGNUP_NEEDS_CONFIRMATION');
    }
    const customer = await bootstrapFromSession(name, phone);
    set({ status: 'authenticated', customer, justLoggedIn: false });
  },

  signIn: async (phone, password) => {
    // Auth accounts are keyed by email, but the UI only asks for phone — resolve the real
    // identity email (or the synthetic fallback for accounts that predate real-email support)
    // server-side first.
    const { email } = await api.resolvePhoneEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const customer = await api.getMe();
    set({ status: 'authenticated', customer, justLoggedIn: true });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ status: 'unauthenticated', customer: null, justLoggedIn: false });
    useCartStore.getState().resetLocal();
  },

  updateProfile: async (input) => {
    const customer = await api.updateMe(input);
    set({ customer });
  },

  setPhotoUrl: (photoUrl) => {
    const customer = get().customer;
    if (customer) set({ customer: { ...customer, photoUrl } });
  },

  clearJustLoggedIn: () => set({ justLoggedIn: false }),
}));

export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] || '';
