import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiEyeOff, FiEye } from 'react-icons/fi';

const SignUpForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const signUpFormStyles = {
    container: {
      width: '100%',
      maxWidth: '500px',
      margin: '0 auto',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: spacing.md,
      marginBottom: spacing['2xl'],
    },
    formGroup: {
      marginBottom: spacing['2xl'],
    },
    fullWidth: {
      gridColumn: '1 / -1',
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
    inputSmall: {
      padding: `${spacing.sm} ${spacing.md} ${spacing.sm} calc(${spacing.md} * 2.5 + 1.2rem)`,
    },
    error: {
      fontSize: typography.sizes.xs,
      color: '#ef4444',
      marginTop: spacing.xs,
    },
    passwordHint: {
      fontSize: typography.sizes.xs,
      color: colors.gray500,
      marginTop: spacing.xs,
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
    },
    hintItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
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
    signUpBtn: {
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
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      fontSize: typography.sizes.sm,
      color: colors.gray600,
      marginBottom: spacing['2xl'],
    },
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-+()\]]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // API call will be implemented in Phase 1
      // const response = await authService.signUp(formData);
      // Handle successful signup
      console.log('Sign up attempted with:', formData);
    } catch (error) {
      setErrors({ submit: 'Failed to create account. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // Google OAuth will be implemented in Phase 1
    console.log('Google sign-up initiated');
  };

  return (
    <div style={signUpFormStyles.container}>
      <form onSubmit={handleSignUp}>
        {/* First Name & Last Name */}
        <div style={signUpFormStyles.formGrid}>
          <div>
            <label style={signUpFormStyles.label}>First Name</label>
            <div style={signUpFormStyles.inputWrapper}>
              <FiUser style={signUpFormStyles.inputIcon} />
              <input
                type="text"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.gray200;
                }}
                style={{ ...signUpFormStyles.input, ...signUpFormStyles.inputSmall }}
              />
            </div>
            {errors.firstName && <div style={signUpFormStyles.error}>{errors.firstName}</div>}
          </div>
          <div>
            <label style={signUpFormStyles.label}>Last Name</label>
            <div style={signUpFormStyles.inputWrapper}>
              <FiUser style={signUpFormStyles.inputIcon} />
              <input
                type="text"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.gray200;
                }}
                style={{ ...signUpFormStyles.input, ...signUpFormStyles.inputSmall }}
              />
            </div>
            {errors.lastName && <div style={signUpFormStyles.error}>{errors.lastName}</div>}
          </div>
        </div>

        {/* Email */}
        <div style={{ ...signUpFormStyles.formGroup, ...signUpFormStyles.fullWidth }}>
          <label style={signUpFormStyles.label}>Email Address</label>
          <div style={signUpFormStyles.inputWrapper}>
            <FiMail style={signUpFormStyles.inputIcon} />
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.gray200;
              }}
              style={signUpFormStyles.input}
            />
          </div>
          {errors.email && <div style={signUpFormStyles.error}>{errors.email}</div>}
        </div>

        {/* Phone */}
        <div style={{ ...signUpFormStyles.formGroup, ...signUpFormStyles.fullWidth }}>
          <label style={signUpFormStyles.label}>Phone Number</label>
          <div style={signUpFormStyles.inputWrapper}>
            <FiPhone style={signUpFormStyles.inputIcon} />
            <input
              type="tel"
              name="phone"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.gray200;
              }}
              style={signUpFormStyles.input}
            />
          </div>
          {errors.phone && <div style={signUpFormStyles.error}>{errors.phone}</div>}
        </div>

        {/* Address */}
        <div style={{ ...signUpFormStyles.formGroup, ...signUpFormStyles.fullWidth }}>
          <label style={signUpFormStyles.label}>Address</label>
          <div style={signUpFormStyles.inputWrapper}>
            <FiMapPin style={signUpFormStyles.inputIcon} />
            <input
              type="text"
              name="address"
              placeholder="123 Main St, City, State"
              value={formData.address}
              onChange={handleChange}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.gray200;
              }}
              style={signUpFormStyles.input}
            />
          </div>
          {errors.address && <div style={signUpFormStyles.error}>{errors.address}</div>}
        </div>

        {/* Password */}
        <div style={{ ...signUpFormStyles.formGroup, ...signUpFormStyles.fullWidth }}>
          <label style={signUpFormStyles.label}>Password</label>
          <div style={signUpFormStyles.inputWrapper}>
            <FiLock style={signUpFormStyles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.gray200;
              }}
              style={signUpFormStyles.input}
            />
            <button
              type="button"
              style={signUpFormStyles.togglePasswordBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.password && <div style={signUpFormStyles.error}>{errors.password}</div>}
          {!errors.password && (
            <div style={signUpFormStyles.passwordHint}>
              <span>Password must contain: 8+ chars, uppercase, number</span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div style={{ ...signUpFormStyles.formGroup, ...signUpFormStyles.fullWidth }}>
          <label style={signUpFormStyles.label}>Confirm Password</label>
          <div style={signUpFormStyles.inputWrapper}>
            <FiLock style={signUpFormStyles.inputIcon} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="••••••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.gray200;
              }}
              style={signUpFormStyles.input}
            />
            <button
              type="button"
              style={signUpFormStyles.togglePasswordBtn}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.confirmPassword && <div style={signUpFormStyles.error}>{errors.confirmPassword}</div>}
        </div>

        {/* Terms & Conditions */}
        <div style={signUpFormStyles.checkbox}>
          <input type="checkbox" id="terms" required />
          <label htmlFor="terms" style={{ margin: 0, cursor: 'pointer' }}>
            I agree to the <button
              type="button"
              style={{ ...signUpFormStyles.link, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              Terms of Service
            </button> and <button
              type="button"
              style={{ ...signUpFormStyles.link, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              Privacy Policy
            </button>
          </label>
        </div>

        {/* Submit Error */}
        {errors.submit && <div style={signUpFormStyles.error}>{errors.submit}</div>}

        {/* Sign Up Button */}
        <button
          type="submit"
          style={signUpFormStyles.signUpBtn}
          disabled={isLoading}
          onMouseOver={(e) => {
            e.target.style.opacity = '0.9';
          }}
          onMouseOut={(e) => {
            e.target.style.opacity = '1';
          }}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Divider */}
      <div style={signUpFormStyles.divider}>
        <div style={signUpFormStyles.dividerLine} />
        <span>or</span>
        <div style={signUpFormStyles.dividerLine} />
      </div>

      {/* Google Sign Up */}
      <button
        style={signUpFormStyles.googleBtn}
        onClick={handleGoogleSignUp}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = colors.gray50;
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = colors.white;
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7v10M7 12h10" />
        </svg>
        Sign up with Google
      </button>

      {/* Footer */}
      <div style={signUpFormStyles.footer}>
        Already have an account?
        <button
          type="button"
          style={{ ...signUpFormStyles.link, background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer', marginLeft: '4px' }}
          onClick={() => navigate('/signin')}
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default SignUpForm;
