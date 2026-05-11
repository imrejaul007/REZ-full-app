/**
 * RoleGuard HOC — RBAC enforcement for sensitive admin screens.
 *
 * ADM-002 FIX: Many sensitive screens had no role checks. This HOC wraps
 * components that require specific admin roles and renders an Access Denied
 * screen when the current user's role does not match the required roles.
 *
 * Usage:
 *   // Wrap at export level (recommended — screen never renders for unauthorized roles)
 *   export default withRole(SensitiveScreen, ['admin', 'senior-admin']);
 *
 *   // Or guard a sub-section within a screen:
 *   if (!useHasAnyRole(['finance'])) return <AccessDenied />;
 *
 * The HOC returns null (renders nothing) when the user is not authenticated.
 * This prevents any content flash before redirecting to login.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { isValidAdminRole } from '@/constants/roles';

export type AdminRole =
  | 'admin'
  | 'senior-admin'
  | 'super-admin'
  | 'finance'
  | 'support'
  | 'viewer';

/**
 * HOC: wrap a component to require one or more roles.
 * - Returns null if user is not yet loaded (auth is loading)
 * - Returns null if user is not authenticated
 * - Returns Access Denied UI if user's role is not in requiredRoles
 * - Otherwise renders the wrapped component normally
 */
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRoles: AdminRole[]
) {
  return function RoleGuardedComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading || !isAuthenticated) {
      return null;
    }

    const userRole = user?.role;
    const isAuthorized =
      userRole &&
      isValidAdminRole(userRole) &&
      requiredRoles.includes(userRole as AdminRole);

    if (!isAuthorized) {
      return (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔒</Text>
          </View>
          <Text style={styles.title}>Access Denied</Text>
          <Text style={styles.message}>
            Your role ({userRole || 'unknown'}) does not have permission to view this screen.
            {'\n'}Required: {requiredRoles.join(', ')}
          </Text>
          <Text style={styles.hint}>
            If you believe this is an error, contact your administrator.
          </Text>
        </View>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Hook: check if the current user has any of the given roles.
 * Use this for fine-grained role checks within a component.
 *
 * @example
 * const hasAccess = useHasAnyRole(['admin', 'senior-admin']);
 * if (!hasAccess) return <AccessDenied />;
 */
export function useHasAnyRole(roles: AdminRole[]): boolean {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading || !isAuthenticated || !user?.role) return false;
  return isValidAdminRole(user.role) && roles.includes(user.role as AdminRole);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.light.background,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#687076',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
