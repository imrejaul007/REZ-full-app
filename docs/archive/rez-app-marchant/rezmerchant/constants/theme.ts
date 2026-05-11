/**
 * Merchant App Design Tokens — single source of truth for new screens.
 *
 * @deprecated colors — The `colors` export in this file uses static hex values
 * with no dark-mode support. Use constants/Colors.ts instead, which provides
 * theme-aware light/dark variants. Typography, spacing, borderRadius, and
 * shadows tokens remain valid and continue to be exported.
 *
 * For new code, import from this file rather than hardcoding hex values.
 * The more complete token set lives in constants/DesignTokens.ts and
 * constants/Colors.ts; this file re-exports a flat, ergonomic subset
 * aligned with the bug-report specification so imports stay concise:
 *
 *   import { colors, spacing, borderRadius } from '@/constants/theme';
 *
 * Brand colours:
 *   Primary purple: #6366f1 (indigo-500) — used for primary actions
 *   Primary dark:   #4f46e5 (indigo-600) — hover / pressed states
 *   Brand purple:   #7C3AED (violet-700) — merchant app identity colour
 */

export const colors = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  brandPurple: '#7C3AED',
  brandPurpleDark: '#4f46e5',
  text: '#1f2937',
  textMuted: '#6b7280',
  background: '#f9fafb',
  surface: '#ffffff',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  border: '#e5e7eb',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// TS-M5 FIX: Named Spacing token (PascalCase) with xxl step for full 8pt grid coverage.
// Import as: import { Spacing } from '@/constants/theme';
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
