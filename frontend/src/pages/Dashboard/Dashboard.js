import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiFileText, FiFile, FiBarChart2, FiUpload, FiEdit3, FiPlus, FiClock, FiCheckCircle, FiAlertCircle, FiArrowRight, FiSend, FiPenTool } from 'react-icons/fi';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [formsData] = useState({
    published: 5,
    draft: 2,
    totalResponses: 24,
  });

  const [documentsData] = useState({
    published: 8,
    assignedToSign: 3,
    draft: 1,
  });

  const [signatureData, setSignatureData] = useState({
    hasDefaultSignature: false,
    totalSignatures: 0,
  });

  const [loadingSignature, setLoadingSignature] = useState(true);

  // Fetch signature status on component mount
  useEffect(() => {
    const fetchSignatureStatus = async () => {
      try {
        const response = await api.get('/signatures/user');

        if (response.data.success) {
          const signatures = response.data.signatures;
          const hasDefault = signatures.some(sig => sig.is_default);
          setSignatureData({
            hasDefaultSignature: hasDefault,
            totalSignatures: signatures.length,
          });
        }
      } catch (error) {
        console.error('Failed to fetch signature status:', error);
        setSignatureData({
          hasDefaultSignature: false,
          totalSignatures: 0,
        });
      } finally {
        setLoadingSignature(false);
      }
    };

    fetchSignatureStatus();
  }, []);

  const [recentActivity] = useState([
    {
      id: 1,
      type: 'form',
      title: 'Customer Feedback Form',
      action: 'created',
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      type: 'document',
      title: 'Employment Contract',
      action: 'signed',
      timestamp: '4 hours ago',
    },
    {
      id: 3,
      type: 'form',
      title: 'Event Registration',
      action: 'received 5 responses',
      timestamp: '1 day ago',
    },
    {
      id: 4,
      type: 'document',
      title: 'NDA Agreement',
      action: 'pending signature',
      timestamp: '2 days ago',
    },
  ]);

  // === Style definitions ===

  const s = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      paddingBottom: spacing['3xl'],
    },

    // ----------- Hero Section -----------
    hero: {
      background: colors.gradientHero,
      padding: `${spacing['3xl']} ${spacing['2xl']} ${spacing['2xl']}`,
      position: 'relative',
      overflow: 'hidden',
    },
    heroInner: {
      maxWidth: '1360px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing['2xl'],
    },
    heroContent: {
      flex: 1,
    },
    heroGreeting: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#fff',
      marginBottom: spacing.xs,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    heroSubtitle: {
      fontSize: typography.sizes.base,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: spacing.lg,
      fontWeight: 400,
      maxWidth: '480px',
      lineHeight: 1.6,
    },
    heroActions: {
      display: 'flex',
      gap: spacing.md,
      flexWrap: 'wrap',
    },
    heroBlob: {
      position: 'absolute',
      right: '-40px',
      top: '-40px',
      width: '320px',
      height: '320px',
      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
      borderRadius: '50%',
      pointerEvents: 'none',
    },
    heroBlob2: {
      position: 'absolute',
      left: '20%',
      bottom: '-60px',
      width: '200px',
      height: '200px',
      background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
      borderRadius: '50%',
      pointerEvents: 'none',
    },
    heroDecoRight: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
      alignItems: 'flex-end',
    },
    heroStat: {
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(12px)',
      borderRadius: borderRadius.lg,
      padding: `${spacing.md} ${spacing.lg}`,
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      border: '1px solid rgba(255,255,255,0.15)',
      minWidth: '200px',
    },
    heroStatIcon: {
      width: '42px',
      height: '42px',
      borderRadius: borderRadius.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.2rem',
    },
    heroStatValue: {
      fontSize: typography.sizes['2xl'],
      fontWeight: 700,
      color: '#fff',
      lineHeight: 1,
    },
    heroStatLabel: {
      fontSize: typography.sizes.xs,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: 500,
      marginTop: '2px',
    },

    // ----------- Buttons -----------
    btnPrimary: {
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: typography.sizes.sm,
      fontWeight: 600,
      border: 'none',
      borderRadius: borderRadius.full,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: '#fff',
      color: colors.primary,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    btnSecondary: {
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: typography.sizes.sm,
      fontWeight: 600,
      border: '1px solid rgba(255,255,255,0.35)',
      borderRadius: borderRadius.full,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(8px)',
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    },

    // ----------- Main Content -----------
    main: {
      maxWidth: '1360px',
      margin: '0 auto',
      padding: `0 ${spacing['2xl']}`,
      marginTop: `-${spacing.lg}`,
      position: 'relative',
      zIndex: 3,
    },

    // ----------- Section Header -----------
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
      marginTop: spacing['2xl'],
    },
    sectionBadge: {
      width: '36px',
      height: '36px',
      borderRadius: borderRadius.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1rem',
      flexShrink: 0,
    },
    sectionTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: 700,
      color: colors.gray900,
      letterSpacing: '-0.01em',
    },
    sectionCount: {
      fontSize: typography.sizes.xs,
      fontWeight: 600,
      color: colors.gray500,
      backgroundColor: colors.gray100,
      padding: '2px 10px',
      borderRadius: borderRadius.full,
      marginLeft: 'auto',
    },

    // ----------- Stat Cards Grid -----------
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: spacing.lg,
    },

    // ----------- Stat Card -----------
    statCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowGlass,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
      borderLeft: '4px solid transparent',
    },
    statCardOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      opacity: 0.5,
      transform: 'translate(30%, -30%)',
      pointerEvents: 'none',
    },
    statCardTop: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    statIconBadge: {
      width: '44px',
      height: '44px',
      borderRadius: borderRadius.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem',
      flexShrink: 0,
    },
    statValue: {
      fontSize: '2.25rem',
      fontWeight: 800,
      lineHeight: 1,
      letterSpacing: '-0.03em',
      marginBottom: '4px',
    },
    statLabel: {
      fontSize: typography.sizes.sm,
      color: colors.gray500,
      fontWeight: 500,
      marginBottom: spacing.md,
    },
    statFooter: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTop: `1px solid ${colors.gray100}`,
      paddingTop: spacing.sm,
    },
    statViewLink: {
      fontSize: typography.sizes.xs,
      color: colors.primary,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      backgroundColor: 'transparent',
      border: 'none',
      padding: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    },
    statHint: {
      fontSize: typography.sizes.xs,
      color: colors.gray400,
      fontWeight: 400,
    },

    // ----------- Activity Section -----------
    activityCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowGlass,
    },
    activityHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    activityHeaderTitle: {
      fontSize: typography.sizes.base,
      fontWeight: 700,
      color: colors.gray900,
    },
    activityTimeline: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      position: 'relative',
    },
    activityRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: `${spacing.md} ${spacing.sm}`,
      borderRadius: borderRadius.base,
      transition: 'background-color 0.15s ease',
      cursor: 'default',
      position: 'relative',
    },
    timelineDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      flexShrink: 0,
      marginTop: '6px',
      border: '2px solid',
    },
    timelineLine: {
      position: 'absolute',
      left: `calc(${spacing.sm} + 4px)`,
      top: '28px',
      bottom: '-4px',
      width: '2px',
      backgroundColor: colors.gray100,
    },
    activityBody: {
      flex: 1,
      minWidth: 0,
    },
    activityTitle: {
      fontSize: typography.sizes.sm,
      fontWeight: 600,
      color: colors.gray800,
      marginBottom: '2px',
    },
    activityAction: {
      fontSize: typography.sizes.xs,
      color: colors.gray500,
      fontWeight: 400,
    },
    activityTime: {
      fontSize: typography.sizes.xs,
      color: colors.gray400,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      marginTop: '2px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    activityTypeTag: {
      fontSize: '0.65rem',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: borderRadius.full,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },

    // ----------- Signature Status Card -----------
    sigStatusCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowGlass,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: spacing.lg,
      cursor: 'pointer',
    },
    sigStatusBadge: {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      flexShrink: 0,
    },
    sigStatusContent: {
      flex: 1,
    },
    sigStatusTitle: {
      fontSize: typography.sizes.sm,
      fontWeight: 700,
      color: colors.gray900,
      marginBottom: '2px',
    },
    sigStatusDesc: {
      fontSize: typography.sizes.xs,
      color: colors.gray500,
      marginBottom: spacing.sm,
    },
    sigStatusAction: {
      fontSize: typography.sizes.xs,
      fontWeight: 600,
      color: colors.primary,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      padding: 0,
    },
  };

  // --- Helper: Stat Card ---
  const StatCard = ({ value, label, hint, linkText, onClick, accentColor, accentBg, gradientBg, icon, animIndex }) => (
    <div
      className={`dash-animate dash-animate-${animIndex}`}
      style={{
        ...s.statCard,
        borderLeftColor: accentColor,
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = colors.shadowGlassHover;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = colors.shadowGlass;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Decorative blob */}
      <div style={{ ...s.statCardOverlay, background: gradientBg }} />

      <div style={s.statCardTop}>
        <div>
          <div style={{ ...s.statValue, color: accentColor }}>{value}</div>
          <div style={s.statLabel}>{label}</div>
        </div>
        <div style={{ ...s.statIconBadge, backgroundColor: accentBg, color: accentColor }}>
          {icon}
        </div>
      </div>

      <div style={s.statFooter}>
        <button
          style={s.statViewLink}
          onClick={onClick || ((e) => e.preventDefault())}
        >
          {linkText} <FiArrowRight size={12} />
        </button>
        <span style={s.statHint}>{hint}</span>
      </div>
    </div>
  );

  // --- Helper: Section Header ---
  const SectionHeader = ({ icon, title, badgeBg, badgeColor, count, animIndex }) => (
    <div className={`dash-animate dash-animate-${animIndex}`} style={s.sectionHeader}>
      <div style={{ ...s.sectionBadge, backgroundColor: badgeBg, color: badgeColor }}>
        {icon}
      </div>
      <span style={s.sectionTitle}>{title}</span>
      {count !== undefined && <span style={s.sectionCount}>{count} total</span>}
    </div>
  );

  return (
    <div style={s.page}>

      {/* ========== Hero Section ========== */}
      <div style={s.hero}>
        {/* Decorative blobs */}
        <div style={s.heroBlob} />
        <div style={s.heroBlob2} />

        <div style={s.heroInner}>
          <div style={s.heroContent} className="dash-animate dash-animate-1">
            <h1 style={s.heroGreeting}>Welcome back, John Doe!</h1>
            <p style={s.heroSubtitle}>
              Manage your forms, documents, and digital signatures — all in one secure workspace.
            </p>
            <div style={s.heroActions}>
              <button
                style={s.btnPrimary}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                <FiPlus size={16} /> Create Form
              </button>
              <button
                style={s.btnSecondary}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FiUpload size={15} /> Upload Document
              </button>
              <button
                style={s.btnSecondary}
                onClick={() => navigate('/create-signature')}
                title="Create or manage your digital signatures"
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FiPenTool size={15} /> {signatureData.hasDefaultSignature ? 'Manage Signatures' : 'Create Signature'}
              </button>
            </div>
          </div>

          {/* Hero quick-glance stats */}
          <div style={s.heroDecoRight} className="dash-animate dash-animate-2">
            <div style={s.heroStat}>
              <div style={{ ...s.heroStatIcon, backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                <FiFileText />
              </div>
              <div>
                <div style={s.heroStatValue}>{formsData.published + formsData.draft}</div>
                <div style={s.heroStatLabel}>Total Forms</div>
              </div>
            </div>
            <div style={s.heroStat}>
              <div style={{ ...s.heroStatIcon, backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                <FiFile />
              </div>
              <div>
                <div style={s.heroStatValue}>{documentsData.published + documentsData.assignedToSign + documentsData.draft}</div>
                <div style={s.heroStatLabel}>Total Documents</div>
              </div>
            </div>
            <div style={s.heroStat}>
              <div style={{ ...s.heroStatIcon, backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                <FiSend />
              </div>
              <div>
                <div style={s.heroStatValue}>{formsData.totalResponses}</div>
                <div style={s.heroStatLabel}>Responses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== Main Content ========== */}
      <div style={s.main}>

        {/* ---------- Forms Statistics ---------- */}
        <SectionHeader
          icon={<FiFileText size={18} />}
          title="Forms"
          badgeBg={colors.formAccentLight}
          badgeColor={colors.formAccent}
          count={formsData.published + formsData.draft}
          animIndex={3}
        />
        <div style={s.cardsGrid}>
          <StatCard
            value={formsData.published}
            label="Published Forms"
            hint="Active & collecting"
            linkText="View all"
            accentColor={colors.formAccent}
            accentBg={colors.formAccentLight}
            gradientBg={colors.gradientCardForm}
            icon={<FiCheckCircle />}
            animIndex={4}
          />
          <StatCard
            value={formsData.draft}
            label="Draft Forms"
            hint="Still in progress"
            linkText="View all"
            accentColor="#F59E0B"
            accentBg="rgba(245, 158, 11, 0.1)"
            gradientBg="linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(253,186,116,0.04) 100%)"
            icon={<FiEdit3 />}
            animIndex={5}
          />
          <StatCard
            value={formsData.totalResponses}
            label="Total Responses"
            hint="From all forms"
            linkText="View responses"
            accentColor="#8B5CF6"
            accentBg="rgba(139, 92, 246, 0.1)"
            gradientBg="linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(167,139,250,0.04) 100%)"
            icon={<FiBarChart2 />}
            animIndex={6}
          />
        </div>

        {/* ---------- Documents Statistics ---------- */}
        <SectionHeader
          icon={<FiFile size={18} />}
          title="Documents"
          badgeBg={colors.docAccentLight}
          badgeColor={colors.docAccent}
          count={documentsData.published + documentsData.assignedToSign + documentsData.draft}
          animIndex={7}
        />
        <div style={s.cardsGrid}>
          <StatCard
            value={documentsData.published}
            label="Published"
            hint="Ready for signing"
            linkText="View all"
            accentColor={colors.docAccent}
            accentBg={colors.docAccentLight}
            gradientBg={colors.gradientCardDoc}
            icon={<FiCheckCircle />}
            animIndex={8}
          />
          <StatCard
            value={documentsData.assignedToSign}
            label="Assigned to Sign"
            hint="Needs your signature"
            linkText="Sign now"
            accentColor="#E11D48"
            accentBg="rgba(225, 29, 72, 0.1)"
            gradientBg="linear-gradient(135deg, rgba(225,29,72,0.08) 0%, rgba(251,113,133,0.04) 100%)"
            icon={<FiAlertCircle />}
            animIndex={9}
          />
          <StatCard
            value={documentsData.draft}
            label="Draft Documents"
            hint="Not yet published"
            linkText="View all"
            accentColor="#F59E0B"
            accentBg="rgba(245, 158, 11, 0.1)"
            gradientBg="linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(253,186,116,0.04) 100%)"
            icon={<FiEdit3 />}
            animIndex={10}
          />
        </div>

        {/* ---------- Signature Management ---------- */}
        <SectionHeader
          icon={<FiPenTool size={18} />}
          title="Signatures"
          badgeBg={colors.sigAccentLight}
          badgeColor={colors.sigAccent}
          animIndex={3}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing.lg }}>
          <StatCard
            value={loadingSignature ? '…' : signatureData.totalSignatures}
            label="Total Signatures"
            hint="Your saved signatures"
            linkText="View all"
            onClick={() => navigate('/create-signature')}
            accentColor={colors.sigAccent}
            accentBg={colors.sigAccentLight}
            gradientBg={colors.gradientCardSig}
            icon={<FiPenTool />}
            animIndex={4}
          />

          {/* Signature status card (special) */}
          <div
            className="dash-animate dash-animate-5"
            style={{
              ...s.sigStatusCard,
              borderLeft: `4px solid ${signatureData.hasDefaultSignature ? colors.success : '#F59E0B'}`,
            }}
            onClick={() => navigate('/create-signature')}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowGlassHover;
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowGlass;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              ...s.sigStatusBadge,
              backgroundColor: signatureData.hasDefaultSignature ? colors.successLight : colors.warningLight,
              color: signatureData.hasDefaultSignature ? colors.success : '#F59E0B',
            }}>
              {loadingSignature ? (
                <FiClock />
              ) : signatureData.hasDefaultSignature ? (
                <FiCheckCircle size={28} />
              ) : (
                <FiAlertCircle size={28} />
              )}
            </div>
            <div style={s.sigStatusContent}>
              <div style={s.sigStatusTitle}>Signature Status</div>
              <div style={s.sigStatusDesc}>
                {loadingSignature
                  ? 'Checking...'
                  : signatureData.hasDefaultSignature
                    ? 'Default signature is ready'
                    : 'No default signature set'}
              </div>
              <button style={s.sigStatusAction}>
                {signatureData.hasDefaultSignature ? 'Update signature' : 'Create signature'} <FiArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* ---------- Recent Activity ---------- */}
        <SectionHeader
          icon={<FiBarChart2 size={18} />}
          title="Recent Activity"
          badgeBg={colors.gray100}
          badgeColor={colors.gray600}
          animIndex={6}
        />
        <div className="dash-animate dash-animate-7" style={s.activityCard}>
          <div style={s.activityHeader}>
            <span style={s.activityHeaderTitle}>Latest Updates</span>
            <button style={{ ...s.statViewLink, fontSize: typography.sizes.xs }}>
              View all <FiArrowRight size={12} />
            </button>
          </div>
          <div style={s.activityTimeline}>
            {recentActivity.map((activity, idx) => {
              const isForm = activity.type === 'form';
              const dotColor = isForm ? colors.formAccent : colors.docAccent;
              const tagBg = isForm ? colors.formAccentLight : colors.docAccentLight;
              const tagColor = isForm ? colors.formAccent : colors.docAccent;
              const isLast = idx === recentActivity.length - 1;

              return (
                <div
                  key={activity.id}
                  style={s.activityRow}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = colors.gray50;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Timeline dot + line */}
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ ...s.timelineDot, borderColor: dotColor, backgroundColor: dotColor }} />
                    {!isLast && <div style={{ ...s.timelineLine, position: 'absolute', left: '3px', top: '16px', bottom: '-12px' }} />}
                  </div>

                  {/* Content */}
                  <div style={s.activityBody}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: '2px' }}>
                      <span style={s.activityTitle}>{activity.title}</span>
                      <span style={{ ...s.activityTypeTag, backgroundColor: tagBg, color: tagColor }}>
                        {activity.type}
                      </span>
                    </div>
                    <div style={s.activityAction}>{activity.action}</div>
                  </div>

                  {/* Timestamp */}
                  <div style={s.activityTime}>
                    <FiClock size={11} />
                    {activity.timestamp}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
