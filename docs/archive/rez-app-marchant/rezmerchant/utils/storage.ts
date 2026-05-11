import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// MED-005 FIX: Sensitive keys (auth tokens, refresh tokens, credentials) must be stored
// in SecureStore on native platforms so they are encrypted at rest (iOS Keychain / Android Keystore).
// AsyncStorage is cleartext and readable by any app on a rooted/jailbroken device.
// Non-sensitive keys (UI preferences, cached data) continue to use AsyncStorage for performance.
const SENSITIVE_KEYS = new Set([
  'accessToken',
  'refreshToken',
  'merchantToken',
  'authToken',
  'token',
  'pinHash',
  'sessionId',
]);

function isSensitiveKey(key: string): boolean {
  // Check exact match or if the key contains a known sensitive pattern
  if (SENSITIVE_KEYS.has(key)) return true;
  const lower = key.toLowerCase();
  return (
    lower.includes('token') ||
    lower.includes('secret') ||
    lower.includes('password') ||
    lower.includes('pin')
  );
}

// Web-compatible storage wrapper
class StorageManager {
  private isWeb = Platform.OS === 'web';

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb && typeof window !== 'undefined') {
        // Web: localStorage (acceptable — tokens are in memory/cookie on web anyway)
        try {
          return await AsyncStorage.getItem(key);
        } catch (error) {
          if (__DEV__)
            console.warn('AsyncStorage failed on web, falling back to localStorage:', error);
          return localStorage.getItem(key);
        }
      } else if (isSensitiveKey(key)) {
        // Native + sensitive: use SecureStore (hardware-backed encryption)
        try {
          return await SecureStore.getItemAsync(key);
        } catch (secureErr) {
          // SecureStore can fail on emulators or when biometric prompt is declined
          if (__DEV__)
            console.warn(
              `[StorageManager] SecureStore.getItem failed for "${key}" — falling back to AsyncStorage (CLEARTEXT)`,
              secureErr
            );
          return await AsyncStorage.getItem(key);
        }
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      if (__DEV__) console.error('Storage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb && typeof window !== 'undefined') {
        try {
          await AsyncStorage.setItem(key, value);
        } catch (error) {
          if (__DEV__)
            console.warn('AsyncStorage failed on web, falling back to localStorage:', error);
          localStorage.setItem(key, value);
        }
      } else if (isSensitiveKey(key)) {
        // Native + sensitive: SecureStore with NO silent cleartext fallback
        // If SecureStore fails, throw — never silently downgrade sensitive data to cleartext.
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (secureErr) {
          if (__DEV__)
            console.error(
              `[StorageManager] SecureStore.setItem failed for "${key}" — NOT falling back to AsyncStorage`,
              secureErr
            );
          throw secureErr; // surface the error rather than silently writing cleartext
        }
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      if (__DEV__) console.error('Storage setItem error:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb && typeof window !== 'undefined') {
        try {
          await AsyncStorage.removeItem(key);
        } catch (error) {
          if (__DEV__)
            console.warn('AsyncStorage failed on web, falling back to localStorage:', error);
          localStorage.removeItem(key);
        }
      } else if (isSensitiveKey(key)) {
        // Delete from both stores (handles migration from old cleartext storage)
        await Promise.allSettled([SecureStore.deleteItemAsync(key), AsyncStorage.removeItem(key)]);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      if (__DEV__) console.error('Storage removeItem error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    // Note: SecureStore has no bulk-clear API — items must be deleted individually.
    // This clears AsyncStorage only (non-sensitive data). Sensitive keys are managed
    // via removeItem() calls at logout.
    try {
      if (this.isWeb && typeof window !== 'undefined') {
        try {
          await AsyncStorage.clear();
        } catch (error) {
          if (__DEV__)
            console.warn('AsyncStorage failed on web, falling back to localStorage:', error);
          localStorage.clear();
        }
      } else {
        await AsyncStorage.clear();
        // Clear all known sensitive keys from SecureStore
        await Promise.allSettled(
          [...SENSITIVE_KEYS].map((key) => SecureStore.deleteItemAsync(key))
        );
      }
    } catch (error) {
      if (__DEV__) console.error('Storage clear error:', error);
      throw error;
    }
  }
}

export const storage = new StorageManager();
