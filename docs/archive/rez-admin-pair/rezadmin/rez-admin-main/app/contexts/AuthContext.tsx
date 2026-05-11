import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { VALID_ADMIN_ROLES, ADMIN_ROLES, AdminRole } from '../../constants/roles';

const TOKEN_KEY = 'admin_token';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  walletId?: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string; // AA-AUT-011: Track last login timestamp
}

interface AuthContextValue {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  hasRole: (role: AdminRole) => boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  lastActivityAt?: number; // AA-AUT-001: Track last activity for session timeout
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastActivityAt, setLastActivityAt] = useState<number>(Date.now()); // AA-AUT-001
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

  /** Restore session from secure storage on mount */
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          // Decode JWT payload (base64url) — validate structure strictly
          const parts = stored.split('.');
          if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
          }
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          // AA-AUT-002: Validate role is in allowed set
          if (payload?.sub && VALID_ADMIN_ROLES.includes(payload.role as AdminRole)) {
            setUser({
              id: payload.sub,
              name: payload.name ?? 'Admin',
              email: payload.email ?? '',
              role: payload.role as AdminRole,
              walletId: payload.walletId,
              avatar: payload.avatar,
              createdAt: payload.createdAt ?? new Date().toISOString(),
              lastLoginAt: payload.lastLoginAt, // AA-AUT-011
            });
            setLastActivityAt(Date.now()); // AA-AUT-001
          } else {
            // Invalid or expired token — clear it
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            setToken(null);
          }
        }
      } catch {
        // Corrupt store — start unauthenticated
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      } finally {
        setIsInitializing(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (newToken: string) => {
    setIsLoading(true);
    try {
      // AA-AUT-002: Validate JWT structure strictly
      const parts = newToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      // Validate role is in allowed set
      if (!VALID_ADMIN_ROLES.includes(payload.role as AdminRole)) {
        throw new Error('Invalid user role');
      }
      const adminUser: AdminUser = {
        id: payload.sub ?? '',
        name: payload.name ?? 'Admin',
        email: payload.email ?? '',
        role: (payload.role as AdminRole),
        walletId: payload.walletId,
        avatar: payload.avatar,
        createdAt: payload.createdAt ?? new Date().toISOString(),
        lastLoginAt: new Date().toISOString(), // AA-AUT-011
      };
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      setToken(newToken);
      setUser(adminUser);
      setLastActivityAt(Date.now()); // AA-AUT-001
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role: AdminRole): boolean => user?.role === role || user?.role === ADMIN_ROLES.SUPER_ADMIN,
    [user]
  );

  // AA-AUT-001: Session timeout check on activity
  useEffect(() => {
    if (!token || !user) return;

    const checkTimeout = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityAt > SESSION_TIMEOUT_MS) {
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkTimeout);
  }, [token, user, lastActivityAt]);

  // AA-AUT-001: Track user activity (simplified for context scope)
  const updateActivity = useCallback(() => {
    setLastActivityAt(Date.now());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user && VALID_ADMIN_ROLES.includes(user.role), // AA-AUT-020: Include role check
      isLoading,
      isInitializing,
      lastActivityAt,
      hasRole,
      login,
      logout,
    }),
    [user, token, isLoading, isInitializing, lastActivityAt, hasRole, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
