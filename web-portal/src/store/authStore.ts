import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
  driverProfile?: any;
  customerProfile?: any;
  address?: any;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  initializeAuth: () => void;
  validateTokens: () => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user }),
      
      setTokens: (accessToken, refreshToken) => {
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        set({ 
          accessToken, 
          refreshToken,
          isAuthenticated: true 
        });
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      login: (user, accessToken, refreshToken) => {
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          error: null,
          isLoading: false
        });
      },
      
      logout: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          isLoading: false
        });
      },
      
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData }
          });
        }
      },
      
      clearError: () => set({ error: null }),
      
      initializeAuth: () => {
        if (typeof window !== 'undefined') {
          const accessToken = localStorage.getItem('accessToken');
          const refreshToken = localStorage.getItem('refreshToken');

          // Validate that tokens exist and are not corrupted
          if (accessToken &&
              refreshToken &&
              accessToken !== 'undefined' &&
              accessToken !== 'null' &&
              accessToken.length > 10 && // Basic validation that it's a real JWT
              refreshToken.length > 10) {

            // Try to get user data from localStorage if available
            try {
              const authStorage = localStorage.getItem('auth-storage');
              if (authStorage) {
                const parsedAuthStorage = JSON.parse(authStorage);
                const user = parsedAuthStorage.state.user;
                set({ user, accessToken, refreshToken, isAuthenticated: true, loading: false });
              } else {
                // If auth-storage is missing but tokens exist, something is wrong. Force logout.
                console.log('Auth storage missing but tokens present, forcing logout.');
                get().logout();
              }
            } catch (e) {
              console.error('Error parsing auth-storage, forcing logout:', e);
              get().logout();
            }
          } else {
            // If tokens are missing or invalid, ensure isAuthenticated is false
            set({ isAuthenticated: false, loading: false });
          }
        }
      },

      validateTokens: () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        // Check if tokens are valid
        if (!accessToken ||
            !refreshToken ||
            accessToken === 'undefined' ||
            accessToken === 'null' ||
            accessToken.length <= 10 ||
            refreshToken.length <= 10) {

          console.log('Invalid tokens detected, forcing logout');
          get().logout();
          return false;
        }

        return true;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
