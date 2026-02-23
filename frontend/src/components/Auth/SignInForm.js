import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiMail, FiLock, FiEyeOff, FiEye } from 'react-icons/fi';
import { signIn, setAuthToken } from '../../services/api';

const SignInForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const signInFormStyles = {
    container: {
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
    },
    formGroup: {
      marginBottom: spacing['2xl'],
    },
    label: {
      display: 'block',
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.gray900,
      marginBottom: spacing.sm,
    },
    inputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },
    inputIcon: {
      position: 'absolute',
      left: spacing.md,
      color: colors.gray400,
      fontSize: '1.2rem',
      pointerEvents: 'none',
    },
    input: {
      width: '100%',
      padding: `${spacing.md} ${spacing.md} ${spacing.md} calc(${spacing.md} * 2.5 + 1.2rem)`,
      border: `2px solid ${colors.gray200}`,
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.sm,
      fontFamily: 'inherit',
      transition: transitions.fast,
      boxSizing: 'border-box',
    },
    inputFocus: {
      borderColor: colors.primary,
      outline: 'none',
    },
    togglePasswordBtn: {
      position: 'absolute',
      right: spacing.md,
      background: 'none',
      border: 'none',
      color: colors.gray400,
      cursor: 'pointer',
      fontSize: '1.2rem',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
    },
    error: {
      fontSize: typography.sizes.xs,
      color: '#ef4444',
      marginTop: spacing.xs,
    },
    signInBtn: {
      width: '100%',
      padding: spacing.md,
      backgroundColor: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
      cursor: 'pointer',
      transition: transitions.fast,
      marginBottom: spacing.md,
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      margin: `${spacing['2xl']} 0`,
      color: colors.gray400,
      fontSize: typography.sizes.sm,
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: colors.gray200,
    },
    googleBtn: {
      width: '100%',
      padding: spacing.md,
      backgroundColor: colors.white,
      color: colors.gray900,
      border: `2px solid ${colors.gray200}`,
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
      cursor: 'pointer',
      transition: transitions.fast,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      marginBottom: spacing['2xl'],
    },
    footer: {
      textAlign: 'center',
      fontSize: typography.sizes.sm,
      color: colors.gray600,
    },
    link: {
      color: colors.primary,
      textDecoration: 'none',
      cursor: 'pointer',
      fontWeight: typography.weights.semibold,
    },
    forgotPassword: {
      textAlign: 'right',
      fontSize: typography.sizes.xs,
      marginTop: spacing.sm,
    },
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await signIn({ email, password });
      
      // Store token
      setAuthToken(response.data.token);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to sign in. Please check your credentials.';
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Google OAuth will be implemented in Phase 1
    console.log('Google sign-in initiated');
  };

  return (
    <div style={signInFormStyles.container}>
      <form onSubmit={handleSignIn}>
        {/* Email Field */}
        <div style={signInFormStyles.formGroup}>
          <label style={signInFormStyles.label}>Email Address</label>
          <div style={signInFormStyles.inputWrapper}>
            <FiMail style={signInFormStyles.inputIcon} />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.gray200;
              }}
              style={signInFormStyles.input}
            />
          </div>
          {errors.email && <div style={signInFormStyles.error}>{errors.email}</div>}
        </div>

        {/* Password Field */}
        <div style={signInFormStyles.formGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={signInFormStyles.label}>Password</label>
            <button
              type="button"
              style={{ ...signInFormStyles.link, fontSize: typography.sizes.xs, background: 'none', border: 'none', padding: 0 }}
              onClick={() => console.log('Forgot password clicked')}
            >
              Forgot?
            </button>
          </div>
          <div style={signInFormStyles.inputWrapper}>
            <FiLock style={signInFormStyles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.gray200;
              }}
              style={signInFormStyles.input}
            />
            <button
              type="button"
              style={signInFormStyles.togglePasswordBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.password && <div style={signInFormStyles.error}>{errors.password}</div>}
        </div>

        {/* Submit Error */}
        {errors.submit && <div style={signInFormStyles.error}>{errors.submit}</div>}

        {/* Sign In Button */}
        <button
          type="submit"
          style={signInFormStyles.signInBtn}
          disabled={isLoading}
          onMouseOver={(e) => {
            e.target.style.opacity = '0.9';
          }}
          onMouseOut={(e) => {
            e.target.style.opacity = '1';
          }}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div style={signInFormStyles.divider}>
        <div style={signInFormStyles.dividerLine} />
        <span>or</span>
        <div style={signInFormStyles.dividerLine} />
      </div>

      {/* Google Sign In */}
      <button
        style={signInFormStyles.googleBtn}
        onClick={handleGoogleSignIn}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = colors.gray50;
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = colors.white;
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {/* Footer */}
      <div style={signInFormStyles.footer}>
        Don't have an account?
        <button
          type="button"
          style={{ ...signInFormStyles.link, background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer', marginLeft: '4px' }}
          onClick={() => navigate('/signup')}
        >
          Sign up
        </button>
      </div>
    </div>
  );
};

export default SignInForm;
