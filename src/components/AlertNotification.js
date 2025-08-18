import React, { useState, useEffect } from 'react';

const AlertNotification = ({ 
  isVisible, 
  onClose, 
  type = 'success', 
  title, 
  message, 
  duration = 5000,
  showProgress = true,
  icon,
  position = 'top-center',
  autoClose = true
}) => {
  const [progress, setProgress] = useState(100);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible && duration > 0 && autoClose) {
      setProgress(100);
      setIsAnimating(true);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            setTimeout(() => {
              setIsAnimating(false);
              onClose();
            }, 300);
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    } else if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible, duration, onClose, autoClose]);

  const getAlertStyles = () => {
    const baseStyles = {
      success: {
        background: 'linear-gradient(135deg, #0F4C75 0%, #3282B8 50%, #BBE1FA 100%)',
        iconColor: '#BBE1FA',
        shadow: '0 20px 40px rgba(15, 76, 117, 0.4)',
        glowColor: 'rgba(50, 130, 184, 0.5)',
        borderColor: 'rgba(187, 225, 250, 0.3)'
      },
      error: {
        background: 'linear-gradient(135deg, #1B262C 0%, #0F4C75 50%, #3282B8 100%)',
        iconColor: '#BBE1FA',
        shadow: '0 20px 40px rgba(27, 38, 44, 0.4)',
        glowColor: 'rgba(15, 76, 117, 0.5)',
        borderColor: 'rgba(187, 225, 250, 0.2)'
      },
      warning: {
        background: 'linear-gradient(135deg, #3282B8 0%, #0F4C75 50%, #1B262C 100%)',
        iconColor: '#BBE1FA',
        shadow: '0 20px 40px rgba(50, 130, 184, 0.4)',
        glowColor: 'rgba(15, 76, 117, 0.5)',
        borderColor: 'rgba(187, 225, 250, 0.25)'
      },
      info: {
        background: 'linear-gradient(135deg, #BBE1FA 0%, #3282B8 50%, #0F4C75 100%)',
        iconColor: '#1B262C',
        shadow: '0 20px 40px rgba(187, 225, 250, 0.3)',
        glowColor: 'rgba(50, 130, 184, 0.4)',
        borderColor: 'rgba(15, 76, 117, 0.3)'
      }
    };
    return baseStyles[type] || baseStyles.success;
  };

  const getDefaultIcon = () => {
    const iconStyle = {
      width: "24px",
      height: "24px",
      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
    };

    const icons = {
      success: (
        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
        </svg>
      ),
      error: (
        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.36 14.3C15.65 14.59 15.65 15.07 15.36 15.36C15.21 15.51 15.02 15.58 14.83 15.58C14.64 15.58 14.45 15.51 14.3 15.36L12 13.06L9.7 15.36C9.55 15.51 9.36 15.58 9.17 15.58C8.98 15.58 8.79 15.51 8.64 15.36C8.35 15.07 8.35 14.59 8.64 14.3L10.94 12L8.64 9.7C8.35 9.41 8.35 8.93 8.64 8.64C8.93 8.35 9.41 8.35 9.7 8.64L12 10.94L14.3 8.64C14.59 8.35 15.07 8.35 15.36 8.64C15.65 8.93 15.65 9.41 15.36 9.7L13.06 12L15.36 14.3Z" fill="currentColor"/>
        </svg>
      ),
      warning: (
        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
        </svg>
      ),
      info: (
        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor"/>
        </svg>
      )
    };
    return icons[type] || icons.success;
  };

  const getPositionStyles = () => {
    const positions = {
      'top-center': {
        position: 'fixed',
        top: '2rem',
        left: '50%',
        transform: `translateX(-50%) ${isVisible && isAnimating ? 'translateY(0)' : 'translateY(-100px)'}`,
        zIndex: 9999
      },
      'top-right': {
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        transform: `${isVisible && isAnimating ? 'translateX(0)' : 'translateX(100px)'}`,
        zIndex: 9999
      },
      'top-left': {
        position: 'fixed',
        top: '2rem',
        left: '2rem',
        transform: `${isVisible && isAnimating ? 'translateX(0)' : 'translateX(-100px)'}`,
        zIndex: 9999
      },
      'bottom-center': {
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: `translateX(-50%) ${isVisible && isAnimating ? 'translateY(0)' : 'translateY(100px)'}`,
        zIndex: 9999
      },
      'bottom-right': {
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        transform: `${isVisible && isAnimating ? 'translateX(0)' : 'translateX(100px)'}`,
        zIndex: 9999
      },
      'bottom-left': {
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',
        transform: `${isVisible && isAnimating ? 'translateX(0)' : 'translateX(-100px)'}`,
        zIndex: 9999
      },
      'center': {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) ${isVisible && isAnimating ? 'scale(1)' : 'scale(0.8)'}`,
        zIndex: 9999
      }
    };
    return positions[position] || positions['top-center'];
  };

  if (!isVisible && !isAnimating) return null;

  const alertStyles = getAlertStyles();
  const textColor = type === 'info' ? '#1B262C' : '#BBE1FA';
  const titleColor = type === 'info' ? '#0F4C75' : '#ffffff';

  return (
    <>
      {/* Backdrop for center position */}
      {position === 'center' && isVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(27, 38, 44, 0.8)',
            backdropFilter: 'blur(12px)',
            zIndex: 9998,
            opacity: isAnimating ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          onClick={onClose}
        />
      )}

      {/* Alert Container */}
      <div
        style={{
          ...getPositionStyles(),
          opacity: isAnimating ? 1 : 0,
          transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          maxWidth: position === 'center' ? '90vw' : '420px',
          width: position === 'center' ? 'auto' : '100%'
        }}
      >
        {/* Main Alert Card */}
        <div
          style={{
            background: alertStyles.background,
            borderRadius: '16px',
            padding: '1.5rem 2rem',
            color: textColor,
            boxShadow: `${alertStyles.shadow}, 0 0 0 1px ${alertStyles.borderColor}`,
            border: `1px solid ${alertStyles.borderColor}`,
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: position === 'center' ? '320px' : 'auto'
          }}
        >
          {/* Animated Background Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle, ${alertStyles.glowColor} 0%, transparent 70%)`,
              opacity: 0.2,
              animation: 'pulse 3s infinite ease-in-out'
            }}
          />

          {/* Professional Grid Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `linear-gradient(${alertStyles.borderColor} 1px, transparent 1px), linear-gradient(90deg, ${alertStyles.borderColor} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              opacity: 0.1
            }}
          />

          {/* Content Container */}
          <div style={{ 
            position: 'relative', 
            zIndex: 2,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            {/* Icon Container */}
            <div style={{
              color: alertStyles.iconColor,
              flexShrink: 0,
              padding: '0.75rem',
              borderRadius: '12px',
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alertStyles.borderColor}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              {icon || getDefaultIcon()}
            </div>

            {/* Text Content */}
            <div style={{ 
              flex: 1,
              minWidth: 0
            }}>
              {title && (
                <h4 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: titleColor,
                  letterSpacing: '-0.025em',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}>
                  {title}
                </h4>
              )}
              <p style={{
                margin: 0,
                fontSize: '0.95rem',
                lineHeight: '1.5',
                color: textColor,
                opacity: 0.9
              }}>
                {message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
                border: `1px solid ${alertStyles.borderColor}`,
                borderRadius: '8px',
                color: alertStyles.iconColor,
                cursor: 'pointer',
                padding: '0.5rem',
                flexShrink: 0,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)';
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          {showProgress && duration > 0 && autoClose && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              width: '100%',
              borderRadius: '0 0 16px 16px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, ${alertStyles.iconColor} 0%, ${alertStyles.glowColor} 100%)`,
                width: `${progress}%`,
                transition: 'width 0.1s linear',
                boxShadow: `0 0 8px ${alertStyles.glowColor}`
              }} />
            </div>
          )}

          {/* Professional Accent Lines */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              background: `linear-gradient(180deg, ${alertStyles.iconColor} 0%, transparent 100%)`,
              borderRadius: '16px 0 0 16px'
            }}
          />
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.2; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.4; 
            transform: scale(1.02); 
          }
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
            opacity: 0.6; 
          }
          50% { 
            transform: translateY(-8px) rotate(180deg); 
            opacity: 1; 
          }
        }

        @media (max-width: 480px) {
          .alert-notification {
            margin: 1rem;
            max-width: calc(100vw - 2rem) !important;
          }
        }
      `}</style>
    </>
  );
};

export default AlertNotification;