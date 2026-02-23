import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiFileText, FiEdit, FiCheckCircle, FiShield, FiZap, FiArrowRight } from 'react-icons/fi';
import logoImg from '../../assets/images/signify_logo.png';

const LandingPage = () => {
  const navigate = useNavigate();

  const landingStyles = {
    container: {
      width: '100%',
      backgroundColor: colors.white,
    },
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${spacing.md} ${spacing['3xl']}`,
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.gray100}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      cursor: 'pointer',
      textDecoration: 'none',
    },
    logoImg: {
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
    navButtons: {
      display: 'flex',
      gap: spacing.md,
      alignItems: 'center',
    },
    navButton: {
      padding: `${spacing.sm} ${spacing.lg}`,
      border: 'none',
      borderRadius: borderRadius.md,
      cursor: 'pointer',
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      transition: transitions.fast,
    },
    signInBtn: {
      backgroundColor: colors.white,
      color: colors.primary,
      border: `2px solid ${colors.primary}`,
    },
    signUpBtn: {
      backgroundColor: colors.primary,
      color: colors.white,
    },
    hero: {
      padding: `${spacing['3xl']} ${spacing['2xl']}`,
      textAlign: 'center',
      backgroundColor: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(8, 145, 178, 0.05) 100%)',
      backgroundImage: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(8, 145, 178, 0.05) 100%)',
    },
    heroContent: {
      maxWidth: '900px',
      margin: '0 auto',
    },
    heroTitle: {
      fontSize: typography.sizes['4xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      marginBottom: spacing.lg,
      lineHeight: '1.2',
    },
    heroSubtitle: {
      fontSize: typography.sizes.base,
      color: colors.gray600,
      marginBottom: spacing['2xl'],
      lineHeight: '1.6',
    },
    heroCTA: {
      display: 'flex',
      gap: spacing.md,
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginBottom: spacing['2xl'],
    },
    primaryCtaBtn: {
      padding: `${spacing.md} ${spacing['2xl']}`,
      backgroundColor: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: borderRadius.lg,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      transition: transitions.fast,
    },
    secondaryCtaBtn: {
      padding: `${spacing.md} ${spacing['2xl']}`,
      backgroundColor: colors.white,
      color: colors.primary,
      border: `2px solid ${colors.primary}`,
      borderRadius: borderRadius.lg,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      transition: transitions.fast,
    },
    features: {
      padding: `${spacing['3xl']} ${spacing['2xl']}`,
      backgroundColor: colors.lightGray,
    },
    featuresContent: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    sectionTitle: {
      fontSize: typography.sizes['3xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      textAlign: 'center',
      marginBottom: spacing['3xl'],
    },
    featureGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: spacing['2xl'],
    },
    featureCard: {
      backgroundColor: colors.white,
      padding: spacing['2xl'],
      borderRadius: borderRadius.lg,
      boxShadow: 'rgba(0, 0, 0, 0.08) 0px 2px 8px',
      transition: transitions.fast,
    },
    featureIcon: {
      fontSize: '2.5rem',
      color: colors.primary,
      marginBottom: spacing.md,
    },
    featureTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      marginBottom: spacing.sm,
    },
    featureDescription: {
      fontSize: typography.sizes.sm,
      color: colors.gray600,
      lineHeight: '1.6',
    },
    cta: {
      padding: `${spacing['3xl']} ${spacing['2xl']}`,
      backgroundColor: colors.primary,
      color: colors.white,
      textAlign: 'center',
    },
    ctaTitle: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      marginBottom: spacing.lg,
    },
    ctaDescription: {
      fontSize: typography.sizes.base,
      marginBottom: spacing['2xl'],
      opacity: 0.95,
    },
    ctaButton: {
      padding: `${spacing.md} ${spacing['2xl']}`,
      backgroundColor: colors.white,
      color: colors.primary,
      border: 'none',
      borderRadius: borderRadius.lg,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    footer: {
      padding: `${spacing['2xl']}`,
      backgroundColor: colors.gray900,
      color: colors.white,
      textAlign: 'center',
      fontSize: typography.sizes.sm,
    },
  };

  const features = [
    {
      icon: <FiEdit />,
      title: 'Easy Form Building',
      description: 'Create beautiful, functional forms without coding. Drag-and-drop interface makes it simple.',
    },
    {
      icon: <FiFileText />,
      title: 'Document Management',
      description: 'Organize and manage all your documents in one place with powerful search and filtering.',
    },
    {
      icon: <FiCheckCircle />,
      title: 'Digital Signatures',
      description: 'Collect legally binding signatures with our secure signature collection system.',
    },
    {
      icon: <FiShield />,
      title: 'Bank-Level Security',
      description: 'Your data is encrypted and protected with industry-leading security standards.',
    },
    {
      icon: <FiZap />,
      title: 'Lightning Fast',
      description: 'Optimized for speed. Load times measured in milliseconds, not seconds.',
    },
  ];

  return (
    <div style={landingStyles.container}>
      {/* Navbar */}
      <nav style={landingStyles.navbar}>
        <div style={landingStyles.logoContainer} onClick={() => navigate('/')}>
          <img src={logoImg} alt="SigniStruct" style={landingStyles.logoImg} />
          <span style={landingStyles.brandText}>SigniStruct</span>
        </div>
        <div style={landingStyles.navButtons}>
          <button
            style={{ ...landingStyles.navButton, ...landingStyles.signInBtn }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = colors.gray50;
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = colors.white;
            }}
            onClick={() => navigate('/signin')}
          >
            Sign In
          </button>
          <button
            style={{ ...landingStyles.navButton, ...landingStyles.signUpBtn }}
            onMouseOver={(e) => {
              e.target.style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '1';
            }}
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={landingStyles.hero}>
        <div style={landingStyles.heroContent}>
          <h1 style={landingStyles.heroTitle}>
            The All-in-One Form & Document Platform
          </h1>
          <p style={landingStyles.heroSubtitle}>
            Create powerful forms, manage documents, and collect signatures all in one place. 
            No coding required. Start for free today.
          </p>
          <div style={landingStyles.heroCTA}>
            <button
              style={landingStyles.primaryCtaBtn}
              onMouseOver={(e) => {
                e.target.style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                e.target.style.opacity = '1';
              }}
              onClick={() => navigate('/signup')}
            >
              Get Started Free <FiArrowRight />
            </button>
            <button
              style={landingStyles.secondaryCtaBtn}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = colors.gray50;
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = colors.white;
              }}
            >
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={landingStyles.features} id="features">
        <div style={landingStyles.featuresContent}>
          <h2 style={landingStyles.sectionTitle}>Powerful Features for Your Workflow</h2>
          <div style={landingStyles.featureGrid}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={landingStyles.featureCard}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = 'rgba(0, 0, 0, 0.12) 0px 8px 16px';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'rgba(0, 0, 0, 0.08) 0px 2px 8px';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={landingStyles.featureIcon}>{feature.icon}</div>
                <h3 style={landingStyles.featureTitle}>{feature.title}</h3>
                <p style={landingStyles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={landingStyles.cta}>
        <h2 style={landingStyles.ctaTitle}>Ready to Transform Your Workflows?</h2>
        <p style={landingStyles.ctaDescription}>
          Join thousands of users who trust SigniStruct for their form and document management needs.
        </p>
        <button
          style={landingStyles.ctaButton}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = colors.gray100;
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = colors.white;
          }}
          onClick={() => navigate('/signup')}
        >
          Start Your Free Trial
        </button>
      </section>

      {/* Footer */}
      <footer style={landingStyles.footer}>
        <p>&copy; 2026 SigniStruct. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
