import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography } from '../../theme';
import SignInForm from '../../components/Auth/SignInForm';
import { FiArrowLeft } from 'react-icons/fi';
import logoImg from '../../assets/images/signify_logo.png';


import { LuCheck } from 'react-icons/lu';

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
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflow: 'hidden',
    },
    brandSection: {
      textAlign: 'center',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      marginBottom: spacing['2xl'],
    },
    logoImg: {
      height: '60px',
      width: 'auto',
      filter: 'brightness(0) invert(1)',
    },
    logoText: {
      fontSize: typography.sizes['4xl'],
      fontWeight: typography.weights.bold,
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
          <div style={signInPageStyles.logoContainer}>
            <img src={logoImg} alt="SigniStruct" style={signInPageStyles.logoImg} />
            <div style={signInPageStyles.logoText}>SigniStruct</div>
          </div>
          <p style={signInPageStyles.tagline}>
            The complete, free platform for creating forms and signing documents online
          </p>
          <div style={signInPageStyles.features}>
            <div style={signInPageStyles.featureItem}>
              <span style={{ fontSize: '1.5rem' }}><LuCheck /></span>
              <span>100% Free - Forever</span>
            </div>
            <div style={signInPageStyles.featureItem}>
              <span style={{ fontSize: '1.5rem' }}><LuCheck /></span>
              <span>Create unlimited forms & documents</span>
            </div>
            <div style={signInPageStyles.featureItem}>
              <span style={{ fontSize: '1.5rem' }}><LuCheck /></span>
              <span>Bank-level security included</span>
            </div>
            <div style={signInPageStyles.featureItem}>
              <span style={{ fontSize: '1.5rem' }}><LuCheck /></span>
              <span>No payment info needed</span>
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
