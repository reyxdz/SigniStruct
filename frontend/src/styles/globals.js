import { colors, typography, spacing } from '../theme';

export const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: ${typography.fontFamily};
    font-size: ${typography.sizes.base};
    font-weight: ${typography.weights.normal};
    line-height: 1.6;
    color: ${colors.gray800};
    background-color: ${colors.lightGray};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  code {
    font-family: ${typography.monoFamily};
  }

  a {
    color: ${colors.primary};
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${colors.primaryDark};
    }
  }

  button {
    font-family: ${typography.fontFamily};
    cursor: pointer;
  }

  input,
  textarea,
  select {
    font-family: ${typography.fontFamily};
  }

  /* Utility Classes */
  .container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 ${spacing.lg};
  }

  .text-center {
    text-align: center;
  }

  .mt-sm { margin-top: ${spacing.sm}; }
  .mt-md { margin-top: ${spacing.md}; }
  .mt-lg { margin-top: ${spacing.lg}; }
  .mb-sm { margin-bottom: ${spacing.sm}; }
  .mb-md { margin-bottom: ${spacing.md}; }
  .mb-lg { margin-bottom: ${spacing.lg}; }

  .p-sm { padding: ${spacing.sm}; }
  .p-md { padding: ${spacing.md}; }
  .p-lg { padding: ${spacing.lg}; }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${colors.gray100};
  }

  ::-webkit-scrollbar-thumb {
    background: ${colors.gray300};
    border-radius: 4px;

    &:hover {
      background: ${colors.gray400};
    }
  }
`;
