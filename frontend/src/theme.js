// SigniStruct Color Palette
// Professional and Modern Design System
// Primary: Professional Blue (document & signing theme)
// Accent: Dynamic color scheme with supporting colors

export const colors = {
  // Primary Colors (Professional Blue)
  primary: '#2563EB',       // Professional Blue
  primaryLight: '#60A5FA',  // Light Blue
  primaryDark: '#1E40AF',   // Dark Blue
  primaryVeryLight: '#F0F9FF', // Very Light Blue background

  // Secondary Colors (Supporting Teal)
  secondary: '#0891B2',     // Cyan/Teal
  secondaryLight: '#06B6D4', // Light Teal
  secondaryDark: '#0E7490', // Dark Teal

  // Accent Colors (Energetic - for signatures/actions)
  accent: '#DC2626',        // Dynamic Red (signature/action highlight)
  accentLight: '#FEE2E2',   // Light Red background
  accentDark: '#991B1B',    // Dark Red

  // Neutral Colors (Light backgrounds for modern look)
  white: '#FFFFFF',
  lightGray: '#F8FAFC',     // Lightest background
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',

  // Status Colors
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#2563EB',

  // Shadows (subtle for modern look)
  shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

export const typography = {
  fontFamily: "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
  monoFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",

  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',  // 48px
};

export const borderRadius = {
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  full: '9999px',
};

export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultraWide: '1536px',
};

export const transitions = {
  fast: '150ms ease-in-out',
  base: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};
