import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiSettings } from 'react-icons/fi';

const Header = ({ user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const headerStyles = {
    header: {
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.gray200}`,
      boxShadow: colors.shadowMd,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: `${spacing.md} ${spacing['2xl']}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.lg,
    },
    brand: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      cursor: 'pointer',
      textDecoration: 'none',
      color: colors.primary,
      fontWeight: typography.weights.bold,
      fontSize: typography.sizes.lg,
    },
    logo: {
      height: '40px',
      width: 'auto',
      display: 'flex',
      alignItems: 'center',
    },
    brandText: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    nav: {
      display: 'flex',
      gap: spacing.xl,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navLink: {
      color: colors.gray700,
      fontWeight: typography.weights.medium,
      fontSize: typography.sizes.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      transition: transitions.fast,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block',
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      position: 'relative',
    },
    userMenuTrigger: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      background: 'none',
      border: `1px solid ${colors.gray200}`,
      color: colors.gray700,
      cursor: 'pointer',
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.lg,
      transition: transitions.fast,
      fontSize: typography.sizes.sm,
    },
    userAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: colors.primary,
      color: colors.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: typography.weights.bold,
      fontSize: typography.sizes.sm,
      flexShrink: 0,
    },
    userName: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.gray800,
      maxWidth: '140px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    dropdownIcon: {
      width: '16px',
      height: '16px',
      color: colors.gray500,
      transition: transitions.fast,
    },
    userDropdown: {
      position: 'absolute',
      top: `calc(100% + ${spacing.md})`,
      right: 0,
      backgroundColor: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: borderRadius.lg,
      boxShadow: colors.shadowLg,
      minWidth: '220px',
      zIndex: 200,
      overflow: 'hidden',
    },
    dropdownItem: {
      display: 'block',
      width: '100%',
      padding: `${spacing.sm} ${spacing.lg}`,
      textAlign: 'left',
      background: 'none',
      border: 'none',
      color: colors.gray700,
      cursor: 'pointer',
      fontSize: typography.sizes.sm,
      transition: transitions.fast,
    },
    logoutBtn: {
      color: colors.error,
      borderTop: `1px solid ${colors.gray200}`,
    },
  };

  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.container}>
        {/* Logo and Brand */}
        <a href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={headerStyles.brand}>
            <img
              src={require('../../assets/images/signify_logo.png')}
              alt="SigniStruct"
              style={headerStyles.logo}
            />
            <span style={headerStyles.brandText}>SigniStruct</span>
          </div>
        </a>

        {/* Navigation Menu */}
        <nav style={headerStyles.nav}>
          <a
            href="/dashboard"
            style={headerStyles.navLink}
            onMouseOver={(e) => {
              e.target.style.color = colors.primary;
              e.target.style.backgroundColor = colors.primaryVeryLight;
            }}
            onMouseOut={(e) => {
              e.target.style.color = colors.gray700;
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Dashboard
          </a>
          <a
            href="/forms"
            style={headerStyles.navLink}
            onMouseOver={(e) => {
              e.target.style.color = colors.primary;
              e.target.style.backgroundColor = colors.primaryVeryLight;
            }}
            onMouseOut={(e) => {
              e.target.style.color = colors.gray700;
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Forms
          </a>
          <a
            href="/documents"
            style={headerStyles.navLink}
            onMouseOver={(e) => {
              e.target.style.color = colors.primary;
              e.target.style.backgroundColor = colors.primaryVeryLight;
            }}
            onMouseOut={(e) => {
              e.target.style.color = colors.gray700;
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Documents
          </a>
          <a
            href="/certificates"
            style={headerStyles.navLink}
            onMouseOver={(e) => {
              e.target.style.color = colors.primary;
              e.target.style.backgroundColor = colors.primaryVeryLight;
            }}
            onMouseOut={(e) => {
              e.target.style.color = colors.gray700;
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Certificates
          </a>
        </nav>

        {/* User Menu */}
        <div style={headerStyles.userSection}>
          <button
            style={headerStyles.userMenuTrigger}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.backgroundColor = colors.primaryVeryLight;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = colors.gray200;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={headerStyles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={headerStyles.userName}>{user?.name || 'User'}</span>
            <svg
              style={{
                ...headerStyles.dropdownIcon,
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <div style={headerStyles.userDropdown}>
              <a
                href="/profile"
                style={headerStyles.dropdownItem}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = colors.gray50;
                  e.target.style.color = colors.primary;
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = colors.gray700;
                }}
              >
                👤 Profile Settings
              </a>
              <a
                href="/account"
                style={headerStyles.dropdownItem}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = colors.gray50;
                  e.target.style.color = colors.primary;
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = colors.gray700;
                }}
              >
                <FiSettings style={{ display: 'inline', marginRight: '6px' }} /> Account Settings
              </a>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout && onLogout();
                }}
                style={{
                  ...headerStyles.dropdownItem,
                  ...headerStyles.logoutBtn,
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
