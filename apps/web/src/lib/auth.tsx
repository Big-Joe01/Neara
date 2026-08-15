import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser, UserRole } from '@neara/types';
import { api, setTokens, clearTokens, getAccessToken } from './api';
export { ApiError } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface RegisterInput {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  displayName?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) { setLoading(false); return; }
    try {
      const me = await api.get<AuthUser>('/users/me');
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUser(); }, [loadUser]);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await api.post<{ user: AuthUser; tokens: { accessToken: string; refreshToken: string } }>(
      '/auth/login', { identifier, password }, { auth: false },
    );
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await api.post<{ user: AuthUser; tokens: { accessToken: string; refreshToken: string } }>(
      '/auth/register', input, { auth: false },
    );
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await api.get<AuthUser>('/users/me');
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
