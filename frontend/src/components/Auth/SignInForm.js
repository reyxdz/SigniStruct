import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiMail, FiLock, FiEyeOff, FiEye } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';

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
      gap: spacing.sm,
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
    
    try {
      // API call will be implemented in Phase 1
      // const response = await authService.signIn(email, password);
      // Handle successful login
      console.log('Sign in attempted with:', { email, password });
    } catch (error) {
      setErrors({ submit: 'Failed to sign in. Please check your credentials.' });
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
        <FaGoogle size={18} />
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
