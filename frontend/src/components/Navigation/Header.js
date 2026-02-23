import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';

const Header = ({ user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const headerStyles = {
    header: {
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.gray200}`,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    container: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: `${spacing.md} ${spacing.lg}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.lg,
    },
    brand: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      cursor: 'pointer',
    },
    logo: {
      height: '40px',
      width: 'auto',
    },
    brandName: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.primary,
      display: 'none',
    },
    brandNameMobile: {
      display: 'inline',
    },
    nav: {
      display: 'flex',
      gap: spacing.lg,
      flex: 1,
      justifyContent: 'center',
    },
    navLink: {
      color: colors.gray700,
      fontWeight: typography.weights.medium,
      fontSize: typography.sizes.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      transition: transitions.base,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'block',
    },
    navLinkHover: {
      backgroundColor: colors.primaryVeryLight,
      color: colors.primary,
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    },
    userMenuTrigger: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      background: 'none',
      border: 'none',
      color: colors.gray700,
      cursor: 'pointer',
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      transition: transitions.base,
      fontSize: typography.sizes.sm,
    },
    userAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: colors.primary,
      color: colors.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: typography.weights.bold,
      fontSize: typography.sizes.sm,
    },
    userName: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.gray800,
      maxWidth: '120px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    dropdownIcon: {
      width: '16px',
      height: '16px',
      color: colors.gray500,
    },
    userDropdown: {
      position: 'absolute',
      top: `calc(100% + ${spacing.sm})`,
      right: 0,
      backgroundColor: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: borderRadius.lg,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      minWidth: '200px',
      zIndex: 200,
      overflow: 'hidden',
    },
    dropdownItem: {
      display: 'block',
      width: '100%',
      padding: spacing.md,
      textAlign: 'left',
      background: 'none',
      border: 'none',
      color: colors.gray700,
      cursor: 'pointer',
      fontSize: typography.sizes.sm,
      transition: transitions.base,
    },
    dropdownItemHover: {
      backgroundColor: colors.gray100,
      color: colors.primary,
    },
    logoutBtn: {
      color: colors.error,
    },
    logoutBtnHover: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
  };

  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.container}>
        {/* Logo and Brand */}
        <div style={headerStyles.brand}>
          <img src="../../../assets/images/signify_logo.png" alt="SigniStruct" style={headerStyles.logo} />
          <span style={headerStyles.brandName}>SigniStruct</span>
        </div>

        {/* Navigation Menu */}
        <nav style={headerStyles.nav}>
          <a href="/dashboard" style={headerStyles.navLink}>Dashboard</a>
          <a href="/forms" style={headerStyles.navLink}>Forms</a>
          <a href="/documents" style={headerStyles.navLink}>Documents</a>
        </nav>

        {/* User Menu */}
        <div style={headerStyles.userSection}>
          <button style={headerStyles.userMenuTrigger} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div style={headerStyles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={headerStyles.userName}>{user?.name || 'User'}</span>
            <svg style={headerStyles.dropdownIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <div style={headerStyles.userDropdown}>
              <a href="/profile" style={headerStyles.dropdownItem}>Profile Settings</a>
              <a href="/account" style={headerStyles.dropdownItem}>Account</a>
              <button onClick={onLogout} style={{...headerStyles.dropdownItem, ...headerStyles.logoutBtn}}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
