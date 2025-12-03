import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authAPI, userAPI } from '../services/api';
import socketService from '../services/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: (accessToken, refreshToken, user) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, isAuthenticated: true, error: null });

        // Connect socket
        socketService.connect(accessToken);
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          // Ignore logout errors
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          socketService.disconnect();
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authAPI.getMe();
          const user = response.data.user;
          set({ user, isAuthenticated: true, error: null });

          // Connect socket if not connected
          if (!socketService.isConnected()) {
            socketService.connect(token);
          }
        } catch (error: any) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false, error: error.response?.data?.message });
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userAPI.updateProfile(data);
          set({ user: response.data.user });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'خطا در به‌روزرسانی' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
