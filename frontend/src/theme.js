// SigniStruct Color Palette
// Primary: Deep Blue (inspired by professional signing/document theme)
// Secondary: Teal (for signatures and actions)
// Accent: Coral/Orange (for highlights and important elements)

export const colors = {
  // Primary Colors
  primary: '#1E3A8A',      // Deep Blue
  primaryLight: '#3B82F6',  // Light Blue
  primaryDark: '#1E40AF',   // Darker Blue
  primaryVeryLight: '#EFF6FF', // Very Light Blue

  // Secondary Colors  
  secondary: '#0D9488',     // Teal
  secondaryLight: '#14B8A6', // Light Teal
  secondaryDark: '#0F766E', // Dark Teal

  // Accent Colors
  accent: '#EA580C',        // Coral/Orange (signature highlight)
  accentLight: '#FB923C',   // Light Orange
  accentDark: '#C2410C',    // Dark Orange

  // Neutral Colors
  white: '#FFFFFF',
  lightGray: '#F9FAFB',     // Very light background
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
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Shadows
  shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  shadowXl: '0 20px 25px rgba(0, 0, 0, 0.1)',
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
