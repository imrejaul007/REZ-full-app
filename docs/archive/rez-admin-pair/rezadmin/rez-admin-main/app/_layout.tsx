/**
 * Root Layout — Admin App
 *
 * TS-L1 NOTE — i18n PENDING (Phase 2):
 * All user-visible strings in this app are currently hardcoded in English.
 * A centralized strings object is available at constants/strings.ts to document
 * the intent and serve as the migration source when react-i18next is added.
 * See TS-L1 in docs/Bugs/15-TYPESCRIPT-UI.md for tracking.
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import React, { useState, useEffect } from 'react';
import { useFonts } from 'expo-font';
import {
  Platform,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';

// Initialize Sentry — only on native platforms; Sentry's react-native SDK does not
// support web and calling Sentry.init() on web causes runtime errors.
if (Platform.OS !== 'web') {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    enabled: !__DEV__,
    tracesSampleRate: 0.2,
    environment: process.env.EXPO_PUBLIC_ENV || 'production',
    integrations: [Sentry.reactNativeTracingIntegration()],
    beforeSend(event) {
      // Scrub sensitive fields
      if (event.request?.data) {
        const data = event.request.data as Record<string, any>;
        ['password', 'token', 'pin', 'otp', 'cardNumber'].forEach((k) => {
          if (data[k]) data[k] = '[SCRUBBED]';
        });
      }
      return event;
    },
  });

  // Warn when DSN is missing in production so the omission is never silent
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN && !__DEV__) {
    logger.error(
      '[Sentry] WARNING: EXPO_PUBLIC_SENTRY_DSN is not set. Crash reporting is disabled in production.'
    );
  }
}

// Only import react-native-reanimated on native platforms
if (Platform.OS !== 'web') {
  require('react-native-reanimated');
}

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/config/reactQuery';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider as AdminThemeProvider } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/DesignTokens';
import { installProductionConsoleGuard, logger } from '@/utils/logger';
import { getApiUrl } from '@/config/api';
import { VALID_ADMIN_ROLES } from '@/constants/roles';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Check if user has an admin role
 * Permissive validation - logs unknown roles instead of rejecting them
 */
const isAdminRole = (role: string | undefined): boolean => {
  if (!role) return false;

  // If role is recognized, allow it
  if (VALID_ADMIN_ROLES.includes(role as any)) {
    return true;
  }

  // Unknown role - reject access on the frontend as well.
  // The backend is authoritative, but the frontend must not grant dashboard access
  // to unrecognised roles — a compromised or spoofed token with role:"anything" must
  // not reach admin screens. New backend roles must also be added to VALID_ADMIN_ROLES.
  if (__DEV__) {
    logger.warn(
      `[Admin] Unknown role: "${role}" - denying access. Add to VALID_ADMIN_ROLES if intentional.`
    );
  }

  return false; // Strict: reject unknown roles
};

// Custom Theme to match DesignTokens (Red admin theme)
const CustomDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.gray[50],
    primary: Colors.primary[500],
    text: Colors.text.primary,
    border: Colors.border.default,
    card: Colors.background.primary,
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.gray[900],
    primary: Colors.primary[400],
    text: Colors.gray[100],
    border: Colors.gray[700],
    card: Colors.gray[800],
  },
};

// Inner layout with auth guard — must be inside AuthProvider
function AuthGuardedLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, isInitializing, user } = useAuth();
  const segments = useSegments();

  // Check route groups — use both to avoid relying on a single segment value on web
  const firstSegment = segments[0];
  const inAuthGroup = firstSegment === '(auth)';
  const inDashboard = firstSegment === '(dashboard)';

  // Redirect based on auth state via useEffect — the Stack must stay mounted
  // so the navigator is ready to handle REPLACE actions. Declarative <Redirect>
  // early-returns unmount the Stack, causing "action was not handled" errors on web.
  useEffect(() => {
    if (isInitializing) return;

    if (isAuthenticated && isAdminRole(user?.role) && !inDashboard) {
      router.replace('/(dashboard)');
    } else if (isAuthenticated && !isAdminRole(user?.role) && inDashboard) {
      router.replace('/(auth)/login');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitializing, inAuthGroup, inDashboard, user?.role]);

  // ADMIN-010: Show loading only during initial auth check.
  // The login screen has its own button spinner for login progress.
  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colorScheme === 'dark' ? Colors.gray[900] : Colors.gray[50],
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colorScheme === 'dark' ? Colors.gray[900] : Colors.gray[50],
      }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? Colors.gray[900] : Colors.gray[50],
          },
        }}
      >
        {/* Entry Point */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Authentication Flow */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Main Dashboard — all admin screens live under (dashboard) */}
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />

        {/* BUG-061 FIX: removed dead Stack.Screen entries for "merchants",
            "users", "coin-rewards", and "settings" — none of those exist as
            top-level app routes. All such screens live under (dashboard)/. */}

        {/* Not Found */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar
        style={colorScheme === 'dark' ? 'light' : 'dark'}
        backgroundColor="transparent"
        translucent
      />
    </View>
  );
}

// ── App status types ─────────────────────────────────────────────────────────

interface AppStatusResponse {
  maintenance?: { enabled: boolean; message?: string };
  forceUpdate?: { required: boolean; message?: string; updateUrl?: string };
}

type AppStatus = 'checking' | 'ok' | 'maintenance' | 'update_required';

// ── Maintenance / force-update screens ───────────────────────────────────────

function MaintenanceScreen({ message }: { message?: string }) {
  return (
    <View style={appStatusStyles.container}>
      <Text style={appStatusStyles.icon}>🔧</Text>
      <Text style={appStatusStyles.title}>Down for Maintenance</Text>
      <Text style={appStatusStyles.body}>
        {message || 'The admin panel is temporarily unavailable. Please check back shortly.'}
      </Text>
    </View>
  );
}

function ForceUpdateScreen({ message, updateUrl }: { message?: string; updateUrl?: string }) {
  return (
    <View style={appStatusStyles.container}>
      <Text style={appStatusStyles.icon}>⬆️</Text>
      <Text style={appStatusStyles.title}>Update Required</Text>
      <Text style={appStatusStyles.body}>
        {message || 'A critical update is available. Please update the admin app to continue.'}
      </Text>
      {updateUrl && (
        <TouchableOpacity style={appStatusStyles.button} onPress={() => Linking.openURL(updateUrl)}>
          <Text style={appStatusStyles.buttonText}>Update Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const appStatusStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: { fontSize: 15, color: '#687076', textAlign: 'center', lineHeight: 22 },
  button: {
    marginTop: 24,
    backgroundColor: '#DC2626',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
});

// ── Root layout ───────────────────────────────────────────────────────────────

function RootLayout() {
  const colorScheme = useColorScheme();
  const [appStatus, setAppStatus] = useState<AppStatus>('checking');
  const [statusPayload, setStatusPayload] = useState<AppStatusResponse>({});

  // TS-M6 FIX: Load custom fonts to match merchant app typography strategy.
  // SpaceMono-Regular.ttf should be placed in assets/fonts/ when available.
  // The hook is intentionally non-blocking — the app proceeds with system
  // fonts if the file is absent (e.g., in development before assets are added).
  const [fontsLoaded] = useFonts({
    // Fallback: System font is used until this file is provided in assets/fonts/
    // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  React.useEffect(() => {
    installProductionConsoleGuard();
  }, []);

  // Startup check: fetch app-status / config endpoint
  React.useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 s timeout

    const checkAppStatus = async () => {
      try {
        const baseUrl = getApiUrl().replace(/\/$/, '');

        const response = await fetch(`${baseUrl}/config/app-status`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data: AppStatusResponse = await response.json();
          setStatusPayload(data);

          if (data?.maintenance?.enabled) {
            setAppStatus('maintenance');
            return;
          }
          if (data?.forceUpdate?.required) {
            setAppStatus('update_required');
            return;
          }
        }
        // Any non-ok status or missing flags — allow app to proceed
        setAppStatus('ok');
      } catch {
        // Network failure or timeout — never block the app
        setAppStatus('ok');
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkAppStatus();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  if (appStatus === 'checking') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (appStatus === 'maintenance') {
    return <MaintenanceScreen message={statusPayload?.maintenance?.message} />;
  }

  if (appStatus === 'update_required') {
    return (
      <ForceUpdateScreen
        message={statusPayload?.forceUpdate?.message}
        updateUrl={statusPayload?.forceUpdate?.updateUrl}
      />
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
          <AdminThemeProvider>
            <AuthProvider>
              <AuthGuardedLayout />
            </AuthProvider>
          </AdminThemeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default Platform.OS !== 'web' ? Sentry.wrap(RootLayout) : RootLayout;
