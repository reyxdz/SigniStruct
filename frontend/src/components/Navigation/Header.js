import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import './Header.css';

const Header = ({ user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo and Brand */}
        <div className="header-brand">
          <img src="../../../assets/images/signify_logo.png" alt="SigniStruct" className="logo" />
          <span className="brand-name">SigniStruct</span>
        </div>

        {/* Navigation Menu */}
        <nav className="header-nav">
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/forms" className="nav-link">Forms</a>
          <a href="/documents" className="nav-link">Documents</a>
        </nav>

        {/* User Menu */}
        <div className="header-user">
          <button className="user-menu-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="user-name">{user?.name || 'User'}</span>
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="user-dropdown">
              <a href="/profile" className="dropdown-item">Profile Settings</a>
              <a href="/account" className="dropdown-item">Account</a>
              <button onClick={onLogout} className="dropdown-item logout">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
