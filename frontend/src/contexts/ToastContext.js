import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../theme';

import { LuCircleCheck, LuCircleX, LuAlertTriangle, LuCircleHelp, LuX } from 'react-icons/lu';

const ToastContext = createContext(null);

let toastId = 0;

/**
 * Toast Provider - wrap your app with this to enable toasts everywhere
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const toast = React.useMemo(() => ({
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration || 6000),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  }), [addToast]);

  // Confirm dialog via promise
  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      const id = ++toastId;
      setToasts(prev => [...prev, { id, message, type: 'confirm', resolve }]);
    });
  }, []);

  const handleConfirmResponse = useCallback((id, result) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast?.resolve) toast.resolve(result);
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const iconMap = {
    success: <LuCircleCheck />,
    error: <LuCircleX />,
    warning: <LuAlertTriangle />,
    info: 'ℹ️',
    confirm: <LuCircleHelp />,
  };

  const bgMap = {
    success: '#059669',
    error: '#DC2626',
    warning: '#D97706',
    info: '#0EA5E9',
    confirm: '#1E3A5F',
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: spacing.lg,
        right: spacing.lg,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        maxWidth: '420px',
        width: '100%',
        pointerEvents: 'none',
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing.sm,
              padding: `${spacing.md} ${spacing.lg}`,
              borderRadius: borderRadius.lg,
              backgroundColor: bgMap[t.type] || bgMap.info,
              color: colors.white,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              fontSize: typography.sizes.sm,
              lineHeight: '1.5',
              animation: 'slideIn 0.3s ease-out',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>
              {iconMap[t.type]}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: typography.weights.medium }}>
                {t.message}
              </div>
              {t.type === 'confirm' && (
                <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
                  <button
                    onClick={() => handleConfirmResponse(t.id, true)}
                    style={{
                      padding: `${spacing.xs} ${spacing.md}`,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: borderRadius.md,
                      color: colors.white,
                      fontSize: typography.sizes.xs,
                      fontWeight: typography.weights.semibold,
                      cursor: 'pointer',
                      transition: transitions.fast,
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  >
                    Yes, proceed
                  </button>
                  <button
                    onClick={() => handleConfirmResponse(t.id, false)}
                    style={{
                      padding: `${spacing.xs} ${spacing.md}`,
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: borderRadius.md,
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: typography.sizes.xs,
                      fontWeight: typography.weights.medium,
                      cursor: 'pointer',
                      transition: transitions.fast,
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {t.type !== 'confirm' && (
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0',
                  lineHeight: '1',
                  flexShrink: 0,
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,1)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              ><LuX /></button>
            )}
          </div>
        ))}
      </div>

      {/* Keyframe animation (injected once) */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 * @returns {{ toast: { success, error, warning, info }, confirm: (msg) => Promise<boolean> }}
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
