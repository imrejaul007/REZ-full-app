/**
 * Admin role constants
 * ADMIN-022+: Centralize hardcoded role strings
 */

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  SUPPORT: 'support',
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

/**
 * Get human-readable role name
 */
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case ADMIN_ROLES.SUPER_ADMIN:
      return 'Super Admin';
    case ADMIN_ROLES.ADMIN:
      return 'Admin';
    case ADMIN_ROLES.OPERATOR:
      return 'Operator';
    case ADMIN_ROLES.SUPPORT:
      return 'Support';
    default:
      return role;
  }
}

/**
 * List of all valid admin roles
 */
export const VALID_ADMIN_ROLES: AdminRole[] = Object.values(ADMIN_ROLES);

/**
 * Check if a role is a valid admin role
 */
export function isValidAdminRole(role: string): role is AdminRole {
  return VALID_ADMIN_ROLES.includes(role as AdminRole);
}
