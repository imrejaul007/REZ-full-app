import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/api/auth';
import { apiClient } from '../services/api/client';
import { socketService } from '../services/api/socket';
import { teamService } from '../services/api/team';
import { User, Merchant, LoginRequest, RegisterRequest } from '../types/api';
import { Permission, MerchantRole } from '../types/team';
import { queryClient } from '@/config/reactQuery';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  merchant: Merchant | null;
  user: User | null;
  token: string | null;
  error: string | null;
  permissions: Permission[];
  role: MerchantRole | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { merchant: Merchant; user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_MERCHANT'; payload: Merchant }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'UPDATE_PERMISSIONS'; payload: { permissions: Permission[]; role: MerchantRole } };

interface AuthContextType {
  state: AuthState;
  token: string | null;
  user: User | null;
  merchant: Merchant | null;
  permissions: Permission[];
  role: MerchantRole | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateMerchant: (merchant: Merchant) => void;
  updateUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check for stored token
  merchant: null,
  user: null,
  token: null,
  error: null,
  permissions: [],
  role: null,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        merchant: action.payload.merchant,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        merchant: null,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      if (__DEV__) console.log('🔄 LOGOUT action dispatched - updating auth state');
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        merchant: null,
        user: null,
        token: null,
        error: null,
        permissions: [],
        role: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_MERCHANT':
      return {
        ...state,
        merchant: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'UPDATE_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload.permissions,
        role: action.payload.role,
      };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isRefreshingPermissionsRef = React.useRef(false);

  // MERCH-001: Clear invalid tokens that might cause 401 errors
  // Defined BEFORE checkStoredToken to avoid temporal dead zone
  const clearInvalidTokens = useCallback(async () => {
    try {
      // Check if stored token is still valid
      const storedToken = await authService.getStoredToken();
      if (storedToken) {
        // Verify token is not malformed or expired in storage
        const isValid = await authService.isAuthenticated();
        if (!isValid) {
          if (__DEV__) console.log('🗑️ Clearing invalid/expired token from storage');
          apiClient.setToken(null);
          await authService.clearAuthData();
        }
      }
    } catch (error) {
      if (__DEV__) console.warn('⚠️ Error checking for invalid tokens:', error);
    }
  }, []);

  // MERCH-039: Prevent concurrent refreshPermissions calls with deduplication
  // Defined BEFORE checkStoredToken to avoid TDZ — checkStoredToken's useCallback
  // dependency array evaluates [refreshPermissions] at call time, so refreshPermissions
  // must be a fully-initialized const before that useCallback call.
  const refreshPermissions = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshingPermissionsRef.current) return;
    isRefreshingPermissionsRef.current = true;

    try {
      if (__DEV__) console.log('🔄 Refreshing permissions...');
      const userTeam = await teamService.getCurrentUserPermissions();

      dispatch({
        type: 'UPDATE_PERMISSIONS',
        payload: {
          permissions: userTeam.permissions,
          role: userTeam.role,
        },
      });

      if (__DEV__) console.log('✅ Permissions refreshed');
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to refresh permissions:', error.message);
      // Don't throw error - permissions are optional
    } finally {
      isRefreshingPermissionsRef.current = false;
    }
  }, []);

  // MERCH-002: Check for stored token on app start
  // Wrapped in useCallback for memoization
  // BUG-19 fix: Eliminated double network call on cold start. Previously,
  // clearInvalidTokens() called isAuthenticated() (→ getProfile() network call)
  // and then checkStoredToken called isAuthenticated() again — two network calls
  // for the same check. Now we make a single isAuthenticated() call. If it
  // returns false we clear data (covering the invalid-token case). If it
  // returns true, getProfile() has already refreshed storage, so we read the
  // stored values once directly without an additional network round-trip.
  const checkStoredToken: () => Promise<void> = useCallback(async () => {
    try {
      if (__DEV__) console.log('🔍 Checking stored authentication...');

      // Single isAuthenticated() call: validates the token via getProfile()
      // network request and, on success, writes fresh data to storage.
      // This replaces the prior clearInvalidTokens() + isAuthenticated() pair
      // that issued two network calls on every cold start.
      const storedToken = await authService.getStoredToken();
      if (!storedToken) {
        if (__DEV__) console.log('❌ No stored token found');
        apiClient.setToken(null);
        dispatch({ type: 'LOGOUT' });
        return;
      }

      const isAuthenticated = await authService.isAuthenticated();

      if (isAuthenticated) {
        // Storage was just refreshed by the getProfile() call inside
        // isAuthenticated(), so these reads return up-to-date values
        // without an extra network round-trip.
        const [user, merchant, token] = await Promise.all([
          authService.getStoredUserData(),
          authService.getStoredMerchantData(),
          authService.getStoredToken(),
        ]);

        if (user && merchant && token) {
          if (__DEV__) console.log('✅ Valid stored authentication found');

          // Check if merchant account is suspended before restoring session
          // Note: verificationStatus type is 'pending'|'verified'|'rejected'; suspension
          // is indicated by isActive === false (or isSuspended if backend provides it).
          if (merchant.isActive === false || (merchant as any).isSuspended === true) {
            if (__DEV__) console.warn('🚫 Merchant account is suspended — forcing logout');
            apiClient.setToken(null);
            await authService.clearAuthData();
            dispatch({ type: 'LOGOUT' });
            Alert.alert(
              'Account Suspended',
              'Your account has been suspended. Please contact support at support@rez.money.',
              [{ text: 'OK' }]
            );
            return;
          }

          apiClient.setToken(token);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, merchant, token },
          });

          // Load permissions
          try {
            await refreshPermissions();
          } catch (permError) {
            if (__DEV__) console.warn('⚠️ Failed to load permissions:', permError);
          }

          // Socket connection is managed by useRealTimeUpdates hook
        } else {
          if (__DEV__) console.warn('❌ Incomplete stored data, logging out');
          apiClient.setToken(null);
          await authService.clearAuthData();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        // isAuthenticated() already cleared storage on failure; just update state.
        if (__DEV__) console.log('❌ No valid authentication found');
        apiClient.setToken(null);
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Error checking stored authentication:', error);
      apiClient.setToken(null);
      await authService.clearAuthData();
      dispatch({ type: 'LOGOUT' });
    }
  }, [refreshPermissions]);

  // Run checkStoredToken on mount
  useEffect(() => {
    checkStoredToken();
  }, [checkStoredToken]);

  // E7: Storage keys that must be wiped on logout.
  // Previously only the auth token was cleared by authService.logout().
  // Things like the paired printer config, KDS settings, dashboard layouts,
  // draft forms, and recent exports persisted across sessions so the next
  // user on the same device could read them. Tracked as a static list so
  // it's easy to audit and extend.
  const LOGOUT_STORAGE_KEYS = [
    '@rez_connected_printer',
    'kds_sound_enabled',
    'kds_settings',
    'recent_exports',
    '@hotel_ota:staff_token',
  ];

  // Define logout before using it in useEffect
  const logout = useCallback(async () => {
    try {
      if (__DEV__) console.log('🚪 Context: Starting logout process...');

      // Disconnect socket
      if (__DEV__) console.log('🔌 Disconnecting socket...');
      socketService.disconnect();

      // Call backend logout and clear storage
      if (__DEV__) console.log('🔐 Calling auth service logout...');
      await authService.logout();

      // E7: Clear merchant-local AsyncStorage keys so a subsequent user
      // on the same device can't read printer pairing info / staff tokens /
      // dashboard layouts from the previous session.
      try {
        await AsyncStorage.multiRemove(LOGOUT_STORAGE_KEYS);
      } catch (storageErr) {
        if (__DEV__) console.warn('[Auth] Failed to clear merchant storage keys', storageErr);
      }

      if (__DEV__) console.log('📤 Dispatching LOGOUT action...');
      apiClient.setToken(null);
      // Clear all React Query cached data to prevent stale data leaking across sessions
      queryClient.clear();
      dispatch({ type: 'LOGOUT' });

      // Force navigation to login immediately
      if (__DEV__) console.log('🚀 Redirecting to login page...');
      router.replace('/(auth)/login');

      if (__DEV__) console.log('✅ Context: Logout completed successfully');
    } catch (error) {
      if (__DEV__) console.error('❌ Context: Error during logout:', error);
      // Always dispatch logout even if API call fails
      if (__DEV__) console.log('📤 Dispatching LOGOUT action (after error)...');
      apiClient.setToken(null);
      queryClient.clear();
      dispatch({ type: 'LOGOUT' });

      // Force navigation to login even after error
      if (__DEV__) console.log('🚀 Redirecting to login page (after error)...');
      router.replace('/(auth)/login');

      if (__DEV__) console.log('✅ Context: Emergency logout completed');
    }
  }, []);

  // #5 — Register logout callback with apiClient so 401 after failed refresh triggers logout
  useEffect(() => {
    apiClient.setOnLogoutCallback(logout);
  }, [logout]);

  // Session timeout enforcement — enforce SESSION_TIMEOUT (default 1 hour) so a
  // merchant cannot remain logged in indefinitely. Uses JWT exp as the primary
  // ceiling so the token expiry and the timeout are aligned.
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT || '3600000', 10);

  const decodeJwtExpiry = (token: string): number | null => {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  const scheduleSessionExpiry = useCallback(
    (token: string) => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

      const jwtExpiry = decodeJwtExpiry(token);
      const timeout = jwtExpiry
        ? Math.max(jwtExpiry - Date.now(), 0)
        : SESSION_TIMEOUT_MS;

      if (__DEV__)
        console.log(
          `ℹ️ [Merchant Auth] Session timeout scheduled: ${Math.round(timeout / 1000 / 60)}min`
        );

      sessionTimeoutRef.current = setTimeout(() => {
        if (__DEV__) console.warn('⚠️ [Merchant Auth] Session timeout reached — logging out');
        logout();
      }, timeout);
    },
    [logout, SESSION_TIMEOUT_MS]
  );

  // Schedule session expiry whenever auth state changes to authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      scheduleSessionExpiry(state.token);
    } else {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
    }
  }, [state.isAuthenticated, state.token, scheduleSessionExpiry]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });

    try {
      if (__DEV__) console.log('🔐 Attempting login for:', email);

      // Call backend API for authentication
      const authResponse = await authService.login({ email, password });

      if (__DEV__) console.log('✅ Login successful');

      // Check if merchant account is suspended before allowing login
      // Note: verificationStatus type is 'pending'|'verified'|'rejected'; suspension
      // is indicated by isActive === false (or isSuspended if backend provides it).
      if (
        authResponse.merchant.isActive === false ||
        (authResponse.merchant as any).isSuspended === true
      ) {
        if (__DEV__) console.warn('🚫 Suspended merchant attempted login — rejecting');
        apiClient.setToken(null);
        dispatch({
          type: 'AUTH_ERROR',
          payload: 'Your account has been suspended. Please contact support at support@rez.money.',
        });
        Alert.alert(
          'Account Suspended',
          'Your account has been suspended. Please contact support at support@rez.money.',
          [{ text: 'OK' }]
        );
        return;
      }

      apiClient.setToken(authResponse.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: authResponse.user,
          merchant: authResponse.merchant,
          token: authResponse.token,
        },
      });

      // Load permissions
      try {
        await refreshPermissions();
      } catch (permError) {
        if (__DEV__) console.warn('⚠️ Failed to load permissions (continuing anyway):', permError);
      }

      // Socket connection is managed by useRealTimeUpdates hook
    } catch (error: any) {
      if (__DEV__) console.error('❌ Login failed:', error.message);
      apiClient.setToken(null);
      dispatch({
        type: 'AUTH_ERROR',
        payload: error.message || 'Login failed',
      });
    }
  };

  const register = async (data: RegisterRequest) => {
    dispatch({ type: 'AUTH_START' });

    try {
      if (__DEV__) console.log('📝 Attempting registration for:', data.email);

      // Call backend API for registration
      const authResponse = await authService.register(data);

      if (__DEV__) console.log('✅ Registration successful');

      apiClient.setToken(authResponse.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: authResponse.user,
          merchant: authResponse.merchant,
          token: authResponse.token,
        },
      });

      // Load permissions
      try {
        await refreshPermissions();
      } catch (permError) {
        if (__DEV__) console.warn('⚠️ Failed to load permissions (continuing anyway):', permError);
      }

      // Socket connection is managed by useRealTimeUpdates hook
    } catch (error: any) {
      if (__DEV__) console.error('❌ Registration failed:', error.message);
      apiClient.setToken(null);
      dispatch({
        type: 'AUTH_ERROR',
        payload: error.message || 'Registration failed',
      });
    }
  };

  // MERCH-003: Add useCallback for expensive computations
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const updateMerchant = useCallback((merchant: Merchant) => {
    dispatch({ type: 'UPDATE_MERCHANT', payload: merchant });
  }, []);

  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  const refreshProfile = async () => {
    try {
      if (__DEV__) console.log('🔄 Refreshing profile...');
      const profileData = await authService.getProfile();

      dispatch({ type: 'UPDATE_USER', payload: profileData.user });
      dispatch({ type: 'UPDATE_MERCHANT', payload: profileData.merchant });

      if (__DEV__) console.log('✅ Profile refreshed');
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to refresh profile:', error.message);
      // If profile data is missing, logout
      if (error?.message?.includes('No profile data found')) {
        await logout();
      }
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (__DEV__) console.log('🔒 Changing password...');
      await authService.changePassword(currentPassword, newPassword);
      if (__DEV__) console.log('✅ Password changed successfully');
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to change password:', error.message);
      throw error;
    }
  };

  // MERCH-003: Memoize permission checks
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return state.permissions.includes(permission);
    },
    [state.permissions]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some((permission) => state.permissions.includes(permission));
    },
    [state.permissions]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.every((permission) => state.permissions.includes(permission));
    },
    [state.permissions]
  );

  const value: AuthContextType = {
    state,
    token: state.token,
    user: state.user,
    merchant: state.merchant,
    permissions: state.permissions,
    role: state.role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    register,
    logout,
    clearError,
    updateMerchant,
    updateUser,
    refreshProfile,
    refreshPermissions,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
