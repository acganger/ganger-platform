/**
 * Unified Color Token System for Ganger Platform
 * 
 * This file defines all color tokens used across the platform to ensure
 * consistency and maintainability. All applications should use these tokens
 * instead of hardcoded color values.
 */

export const colors = {
  // Core Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0', 
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main brand green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Main brand purple
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },

  // Semantic Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Neutral Colors (Most frequently used)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // White and Black
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Application-Specific Colors
  handouts: {
    education: '#06b6d4',   // cyan-500
    treatment: '#f59e0b',   // amber-500
    medication: '#ef4444',  // red-500
    procedure: '#8b5cf6',   // violet-500
  },

  medical: {
    urgent: '#ef4444',      // red-500 - Requires immediate attention
    critical: '#dc2626',    // red-600 - Critical status
    processing: '#3b82f6',  // blue-500 - Under review/processing
    approved: '#22c55e',    // green-500 - Approved/confirmed
    pending: '#f59e0b',     // amber-500 - Awaiting action
    cancelled: '#6b7280',   // gray-500 - Cancelled/inactive
  },

  eos: {
    // EOS L10 specific colors for meetings and team management
    50: '#f0f9ff',
    100: '#e0f2fe', 
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // EOS brand blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Status indicators for pharmaceutical scheduling
  pharma: {
    available: '#22c55e',   // green-500
    booked: '#3b82f6',      // blue-500  
    pending: '#f59e0b',     // amber-500
    cancelled: '#ef4444',   // red-500
    confirmed: '#059669',   // emerald-600
  },

  // Inventory status colors
  inventory: {
    inStock: '#22c55e',     // green-500
    lowStock: '#f59e0b',    // amber-500
    outOfStock: '#ef4444',  // red-500
    onOrder: '#3b82f6',     // blue-500
    expired: '#dc2626',     // red-600
  },
} as const;

/**
 * CSS Custom Properties for Dynamic Theming
 * These can be used to enable theme switching if needed in the future
 */
export const cssVariables = {
  '--color-primary': colors.primary[500],
  '--color-primary-foreground': colors.white,
  '--color-secondary': colors.secondary[500], 
  '--color-secondary-foreground': colors.white,
  '--color-accent': colors.accent[500],
  '--color-accent-foreground': colors.white,
  
  '--color-success': colors.success[500],
  '--color-warning': colors.warning[500],
  '--color-error': colors.error[500],
  '--color-info': colors.info[500],
  
  '--color-background': colors.white,
  '--color-foreground': colors.neutral[900],
  '--color-muted': colors.neutral[100],
  '--color-muted-foreground': colors.neutral[500],
  
  '--color-border': colors.neutral[200],
  '--color-ring': colors.primary[500],
} as const;

/**
 * Tailwind CSS Color Extension
 * Export colors in format compatible with Tailwind CSS configuration
 */
export const tailwindColors = {
  primary: colors.primary,
  secondary: colors.secondary, 
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  neutral: colors.neutral,
  eos: colors.eos,
  handouts: colors.handouts,
  medical: colors.medical,
  pharma: colors.pharma,
  inventory: colors.inventory,
} as const;

/**
 * Color Token Utilities
 */
export const colorUtils = {
  /**
   * Get a color value by token path
   * @param path - Color token path (e.g., 'primary.500', 'medical.urgent')
   */
  getColor: (path: string): string => {
    const keys = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = colors;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        // eslint-disable-next-line no-console
        console.warn(`Color token '${path}' not found`);
        return colors.neutral[500]; // Fallback color
      }
    }
    
    return value;
  },

  /**
   * Generate CSS custom property name for a color token
   * @param path - Color token path
   */
  getCSSVariable: (path: string): string => {
    return `--color-${path.replace('.', '-')}`;
  },
} as const;

export type ColorToken = keyof typeof colors;
export type ColorScale = typeof colors.primary;
export type SemanticColor = 'success' | 'warning' | 'error' | 'info';
export type ApplicationColor = 'handouts' | 'medical' | 'eos' | 'pharma' | 'inventory';