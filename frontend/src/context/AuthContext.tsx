import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Developer } from '../types.js';
import { authService } from '../services/api.js';

interface AuthContextType {
  user: Developer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<Developer>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Developer | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('devvault_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch (err: any) {
        console.error('Failed to load user profile on startup:', err);
        // Token might have expired or is invalid, clear it
        localStorage.removeItem('devvault_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login({ email, password });
      localStorage.setItem('devvault_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.register({ username, email, password });
      localStorage.setItem('devvault_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('devvault_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData: Partial<Developer>) => {
    setError(null);
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const deleteAccount = async () => {
    setError(null);
    try {
      await authService.deleteAccount();
      logout();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete account.';
      setError(msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
