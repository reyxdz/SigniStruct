import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography } from '../../theme';
import SignInForm from '../../components/Auth/SignInForm';
import { FiArrowLeft } from 'react-icons/fi';

const SignIn = () => {
  const navigate = useNavigate();

  const signInPageStyles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: colors.lightGray,
    },
    leftSection: {
      flex: 1,
      backgroundColor: colors.primary,
      color: colors.white,
      padding: spacing['4xl'],
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: 'linear-gradient(135deg, rgba(37, 99, 235, 1) 0%, rgba(8, 145, 178, 0.8) 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      '@media (max-width: 768px)': {
        display: 'none',
      },
    },
    brandSection: {
      textAlign: 'center',
    },
    logo: {
      fontSize: typography.sizes['4xl'],
      fontWeight: typography.weights.bold,
      marginBottom: spacing['2xl'],
    },
    tagline: {
      fontSize: typography.sizes.lg,
      marginBottom: spacing.lg,
      lineHeight: '1.6',
      opacity: 0.95,
    },
    features: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
      marginTop: spacing['3xl'],
      textAlign: 'left',
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
    },
    rightSection: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing['4xl'],
      backgroundColor: colors.white,
      '@media (max-width: 768px)': {
        padding: spacing['2xl'],
      },
    },
    backButton: {
      position: 'absolute',
      top: spacing['2xl'],
      left: spacing['2xl'],
      backgroundColor: 'transparent',
      border: 'none',
      color: colors.primary,
      cursor: 'pointer',
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      transition: 'opacity 0.2s ease',
    },
    formContainer: {
      width: '100%',
      maxWidth: '400px',
    },
    heading: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subheading: {
      fontSize: typography.sizes.sm,
      color: colors.gray600,
      marginBottom: spacing['3xl'],
      textAlign: 'center',
    },
  };

  return (
    <div style={signInPageStyles.container}>
      {/* Left Section - Branding */}
      <div style={signInPageStyles.leftSection}>
        <div style={signInPageStyles.brandSection}>
          <div style={signInPageStyles.logo}>SigniStruct</div>
          <p style={signInPageStyles.tagline}>
            The all-in-one platform for creating forms and collecting digital signatures
          </p>
          <div style={signInPageStyles.features}>
            <div style={signInPageStyles.featureItem}>
              <span style={{ fontSize: '1.5rem' }}>✓</span>
              <span>Create beautiful forms in minutes</span>
            </div>
            <div style={signInPageStyles.featureItem}>
              <span style={{ fontSize: '1.5rem' }}>✓</span>
              <span>Collect legally binding signatures</span>
            </div>
            <div style={signInPageStyles.featureItem}>
              <span style={{ fontSize: '1.5rem' }}>✓</span>
              <span>Bank-level security & encryption</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div style={signInPageStyles.rightSection}>
        <button
          style={signInPageStyles.backButton}
          onClick={() => navigate('/')}
          onMouseOver={(e) => {
            e.target.style.opacity = '0.7';
          }}
          onMouseOut={(e) => {
            e.target.style.opacity = '1';
          }}
        >
          <FiArrowLeft /> Back to Home
        </button>

        <div style={signInPageStyles.formContainer}>
          <h1 style={signInPageStyles.heading}>Welcome Back</h1>
          <p style={signInPageStyles.subheading}>
            Sign in to your account to continue
          </p>
          <SignInForm />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
