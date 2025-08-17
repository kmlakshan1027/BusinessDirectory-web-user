// pages/Admin.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs';
import { colors } from '../../utils/colors';
import { useNavigate, useLocation } from 'react-router-dom';

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Your provided color palette
  const themeColors = {
    primary: '#1B262C',    // Dark navy
    secondary: '#0F4C75',  // Deep blue
    tertiary: '#3282B8',   // Medium blue
    light: '#BBE1FA'       // Light blue
  };

  const [stats, setStats] = useState({
    pendingRequests: 0,
    updateRequests: 0,
    approvedBusinesses: 0,
    removalRequests: 0,
    totalBusinesses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-refresh when navigating back from other admin pages
  useEffect(() => {
    if (location.state?.refresh) {
      console.log('Refreshing admin dashboard due to navigation state');
      fetchStats();
      // Clear the state to prevent unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-refresh every 30 seconds to keep data current
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing admin statistics...');
      fetchStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting to fetch admin statistics...');
      
      // Fetch temporary business requests (new submissions)
      const tempCollection = collection(db, 'TemporaryBusinessDetails');
      const tempSnapshot = await getDocs(tempCollection);
      const pendingRequests = tempSnapshot.docs.length;
      console.log('Pending requests:', pendingRequests);

      // Fetch business update requests from Temporary_Update_Business collection
      const updateCollection = collection(db, 'Temporary_Update_Business');
      const updateQuery = query(updateCollection, orderBy('requestedAt', 'desc'));
      const updateSnapshot = await getDocs(updateQuery);
      const updateRequests = updateSnapshot.docs.length;
      console.log('Update requests:', updateRequests);

      // Fetch removal requests from RemovalBusinessRequest collection
      const removalCollection = collection(db, 'RemovalBusinessRequest');
      const removalQuery = query(removalCollection, where('status', '==', 'pending_review'));
      const removalSnapshot = await getDocs(removalQuery);
      const removalRequests = removalSnapshot.docs.length;
      console.log('Removal requests:', removalRequests);

      // Fetch business list
      const businessCollection = collection(db, 'BusinessList');
      const businessSnapshot = await getDocs(businessCollection);
      const allBusinesses = businessSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate different status counts
      const approvedBusinesses = allBusinesses.filter(b => 
        b.status === 'approved' || !b.status // Consider businesses without status as approved
      ).length;
      const totalBusinesses = allBusinesses.length;

      const newStats = {
        pendingRequests,
        updateRequests,
        approvedBusinesses,
        removalRequests,
        totalBusinesses
      };

      console.log('Updated statistics:', newStats);
      setStats(newStats);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching stats:', error);
      setError({
        message: error.message,
        code: error.code
      });
    } finally {
      setLoading(false);
    }
  };

  const AdminCard = ({ title, count, description, colorType, onClick, disabled = false, badge = null, icon }) => {
    const getColorConfig = () => {
      switch (colorType) {
        case 'primary':
          return {
            main: themeColors.primary,
            hover: '#0d1e24',
            shadow: 'rgba(27, 38, 44, 0.3)'
          };
        case 'secondary':
          return {
            main: themeColors.secondary,
            hover: '#0a3a5c',
            shadow: 'rgba(15, 76, 117, 0.3)'
          };
        case 'tertiary':
          return {
            main: themeColors.tertiary,
            hover: '#2868a0',
            shadow: 'rgba(50, 130, 184, 0.3)'
          };
        case 'success':
          return {
            main: '#28a745',
            hover: '#1e7e34',
            shadow: 'rgba(40, 167, 69, 0.3)'
          };
        case 'warning':
          return {
            main: '#ffc107',
            hover: '#e0a800',
            shadow: 'rgba(255, 193, 7, 0.3)'
          };
        case 'danger':
          return {
            main: '#dc3545',
            hover: '#c82333',
            shadow: 'rgba(220, 53, 69, 0.3)'
          };
        default:
          return {
            main: themeColors.tertiary,
            hover: '#2868a0',
            shadow: 'rgba(50, 130, 184, 0.3)'
          };
      }
    };

    const colorConfig = getColorConfig();

    return (
      <div 
        onClick={disabled ? undefined : onClick}
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, rgba(187, 225, 250, 0.05) 100%)',
          border: `2px solid rgba(187, 225, 250, 0.3)`,
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: disabled ? 0.6 : 1,
          height: '280px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = `0 20px 40px ${colorConfig.shadow}`;
            e.currentTarget.style.borderColor = colorConfig.main;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = 'rgba(187, 225, 250, 0.3)';
          }
        }}
      >
        {/* Hover Effect Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(187, 225, 250, 0.2), transparent)',
          transition: 'left 0.6s',
          pointerEvents: 'none'
        }} />

        {badge && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: badge.color,
            color: 'white',
            padding: '0.4rem 1rem',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {badge.text}
          </div>
        )}
        
        <div style={{
          background: `linear-gradient(135deg, ${colorConfig.main} 0%, ${colorConfig.hover} 100%)`,
          color: 'white',
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: count === 'N/A' ? '1.2rem' : '1.8rem',
          fontWeight: '700',
          marginBottom: '1.5rem',
          boxShadow: `0 12px 30px ${colorConfig.shadow}`,
          position: 'relative',
          zIndex: 2
        }}>
          {icon || count}
        </div>
        
        <h3 style={{
          color: themeColors.primary,
          margin: '0 0 1rem 0',
          fontSize: '1.3rem',
          fontWeight: '600',
          position: 'relative',
          zIndex: 2
        }}>
          {title}
        </h3>
        
        <p style={{
          color: themeColors.primary,
          margin: 0,
          fontSize: '1rem',
          lineHeight: '1.5',
          opacity: 0.7,
          position: 'relative',
          zIndex: 2
        }}>
          {description}
        </p>
        
        {disabled && (
          <div style={{
            marginTop: '1rem',
            backgroundColor: '#ffc107',
            color: '#856404',
            padding: '0.5rem 1.2rem',
            borderRadius: '25px',
            fontSize: '0.8rem',
            fontWeight: '600',
            position: 'relative',
            zIndex: 2
          }}>
            Coming Soon
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
          `}
        </style>
        <main style={{
          minHeight: '100vh',
          width: '100vw',
          background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 50%, ${themeColors.tertiary} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '32px',
            padding: '4rem',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
            border: `1px solid rgba(187, 225, 250, 0.3)`
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: `4px solid ${themeColors.light}`,
              borderTop: `4px solid ${themeColors.tertiary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 2rem auto'
            }}></div>
            <h2 style={{ 
              color: themeColors.primary,
              marginBottom: '1rem',
              fontSize: '1.8rem',
              fontWeight: '600'
            }}>
              Loading Admin Dashboard
            </h2>
            <p style={{ 
              color: themeColors.primary,
              opacity: 0.7,
              fontSize: '1.1rem',
              animation: 'pulse 2s infinite'
            }}>
              Fetching latest statistics...
            </p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <main style={{
        minHeight: '100vh',
        width: '100vw',
        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 50%, ${themeColors.tertiary} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '32px',
          padding: '4rem',
          textAlign: 'center',
          maxWidth: '600px',
          width: '100%',
          border: '2px solid #dc3545'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem auto',
            boxShadow: '0 12px 30px rgba(220, 53, 69, 0.3)'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="white" strokeWidth="2"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <h1 style={{ 
            color: '#dc3545', 
            marginBottom: '1rem',
            fontSize: '2rem',
            fontWeight: '600'
          }}>
            Error Loading Dashboard
          </h1>
          <p style={{ 
            color: themeColors.primary, 
            marginBottom: '1.5rem', 
            fontSize: '1.1rem',
            opacity: 0.8
          }}>
            Unable to load the admin dashboard statistics.
          </p>
          <p style={{ 
            color: themeColors.primary, 
            marginBottom: '2rem',
            padding: '1rem',
            background: 'rgba(220, 53, 69, 0.1)',
            borderRadius: '12px',
            fontSize: '0.95rem'
          }}>
            <strong>Error:</strong> {error.message}
          </p>
          <button
            onClick={fetchStats}
            style={{
              background: `linear-gradient(135deg, ${themeColors.tertiary} 0%, ${themeColors.secondary} 100%)`,
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600',
              boxShadow: '0 8px 25px rgba(50, 130, 184, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 35px rgba(50, 130, 184, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(50, 130, 184, 0.3)';
            }}
          >
            🔄 Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          .admin-main {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-height: 100vh;
            width: 100vw;
            background: linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 50%, ${themeColors.tertiary} 100%);
            padding: 2rem;
            position: relative;
            overflow-x: hidden;
            overflow-y: auto;
          }
          
          .admin-main::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 80%, rgba(187, 225, 250, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(50, 130, 184, 0.1) 0%, transparent 50%);
            pointer-events: none;
          }
          
          .main-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(187, 225, 250, 0.3);
            box-shadow: 0 25px 50px rgba(27, 38, 44, 0.2);
            border-radius: 32px;
            padding: 3rem;
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
          }
          
          .floating-animation {
            animation: float 6s ease-in-out infinite;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          
          .admin-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2.5rem;
            margin: 3rem 0;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 2rem;
            margin-bottom: 3rem;
          }
          
          .stat-card {
            background: rgba(187, 225, 250, 0.1);
            border: 1px solid rgba(187, 225, 250, 0.3);
            border-radius: 20px;
            padding: 2rem 1.5rem;
            text-align: center;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          }
          
          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 15px 35px rgba(27, 38, 44, 0.1);
            background: rgba(187, 225, 250, 0.2);
          }
          
          .system-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }
          
          .system-card {
            padding: 1.5rem;
            background: rgba(187, 225, 250, 0.1);
            border-radius: 16px;
            text-align: center;
            border: 1px solid rgba(187, 225, 250, 0.2);
            transition: all 0.3s ease;
          }
          
          .system-card:hover {
            transform: translateY(-2px);
            background: rgba(187, 225, 250, 0.2);
          }
          
          @media (max-width: 1200px) {
            .main-container {
              padding: 2rem;
            }
            .admin-grid {
              gap: 2rem;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (max-width: 968px) {
            .admin-grid {
              grid-template-columns: 1fr;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .system-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (max-width: 768px) {
            .admin-main {
              padding: 1rem;
            }
            .main-container {
              padding: 1.5rem;
              border-radius: 24px;
            }
            .stats-grid {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }
            .system-grid {
              grid-template-columns: 1fr;
            }
            .admin-grid {
              gap: 2rem;
            }
          }
          
          @media (max-width: 480px) {
            .main-container {
              padding: 1rem;
            }
          }
        `}
      </style>
      
      <main className="admin-main">
        <div className="main-container floating-animation">
          {/* Header Section */}
          <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <h1 style={{
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '3rem',
              fontWeight: '700',
              marginBottom: '1rem',
              letterSpacing: '-0.025em',
              lineHeight: '1.1'
            }}>
              Admin Dashboard
            </h1>
            
            <div style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: `linear-gradient(135deg, ${themeColors.tertiary} 0%, ${themeColors.secondary} 100%)`,
              borderRadius: '50px',
              marginBottom: '2rem'
            }}>
              <span style={{
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                System Management Portal
              </span>
            </div>
            
            <p style={{ 
              color: themeColors.primary,
              fontSize: '1.2rem',
              lineHeight: '1.7',
              maxWidth: '600px',
              margin: '0 auto 1.5rem auto',
              opacity: 0.8
            }}>
              Manage business requests, approvals, and view system statistics
            </p>
            
            {lastUpdated && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '1rem', 
                flexWrap: 'wrap',
                marginTop: '1rem'
              }}>
                <p style={{ 
                  color: themeColors.tertiary, 
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  margin: 0
                }}>
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
                <button
                  onClick={fetchStats}
                  style={{
                    backgroundColor: 'transparent',
                    border: `2px solid ${themeColors.tertiary}`,
                    color: themeColors.tertiary,
                    padding: '0.4rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = themeColors.tertiary;
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = themeColors.tertiary;
                  }}
                >
                  🔄 Refresh Now
                </button>
              </div>
            )}
          </div>

          {/* System Overview Stats */}
          <div style={{
            background: 'linear-gradient(145deg, #ffffff 0%, rgba(187, 225, 250, 0.05) 100%)',
            border: `2px solid rgba(187, 225, 250, 0.3)`,
            borderRadius: '24px',
            padding: '2.5rem',
            marginBottom: '3rem'
          }}>
            <h2 style={{ 
              color: themeColors.primary, 
              marginBottom: '2rem',
              fontSize: '1.8rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              System Overview
            </h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '700', 
                  color: themeColors.tertiary,
                  marginBottom: '0.5rem' 
                }}>
                  {stats.pendingRequests}
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  opacity: 0.8
                }}>
                  New Submissions
                </div>
              </div>
              <div className="stat-card">
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '700', 
                  color: '#ffc107',
                  marginBottom: '0.5rem' 
                }}>
                  {stats.updateRequests}
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  opacity: 0.8
                }}>
                  Update Requests
                </div>
              </div>
              <div className="stat-card">
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '700', 
                  color: '#dc3545',
                  marginBottom: '0.5rem' 
                }}>
                  {stats.removalRequests}
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  opacity: 0.8
                }}>
                  Removal Requests
                </div>
              </div>
              <div className="stat-card">
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '700', 
                  color: '#28a745',
                  marginBottom: '0.5rem' 
                }}>
                  {stats.totalBusinesses}
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  opacity: 0.8
                }}>
                  Total Businesses
                </div>
              </div>
            </div>
          </div>

          {/* Main Admin Actions */}
          <div className="admin-grid">
            <AdminCard
              title="New Business Requests"
              count={stats.pendingRequests}
              description="Review and approve new business submissions from users"
              colorType="tertiary"
              onClick={() => navigate('/admin/add-business-requests')}
              badge={stats.pendingRequests > 0 ? { text: 'Action Required', color: '#dc3545' } : null}
            />
            
            <AdminCard
              title="Update Requests"
              count={stats.updateRequests}
              description="Handle business information update requests"
              colorType="warning"
              onClick={() => navigate('/admin/update-business-requests')}
              badge={stats.updateRequests > 0 ? { text: 'Action Required', color: '#dc3545' } : null}
            />
            
            <AdminCard
              title="Removal Requests"
              count={stats.removalRequests}
              description="Review and process business removal requests"
              colorType="danger"
              onClick={() => navigate('/admin/remove-business-requests')}
              badge={stats.removalRequests > 0 ? { text: 'Action Required', color: '#dc3545' } : null}
            />
            
            <AdminCard
              title="All Businesses"
              count={stats.totalBusinesses}
              description="View and manage all businesses in the system"
              colorType="success"
              onClick={() => navigate('/admin/all-businesses')}
            />
          </div>

          {/* System Configuration */}
          <div style={{
            background: 'linear-gradient(145deg, #ffffff 0%, rgba(187, 225, 250, 0.05) 100%)',
            border: `2px solid rgba(187, 225, 250, 0.3)`,
            borderRadius: '24px',
            padding: '2.5rem',
            marginBottom: '3rem'
          }}>
            <h2 style={{ 
              color: themeColors.primary, 
              marginBottom: '2rem',
              fontSize: '1.8rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              System Configuration
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: '400px', width: '100%' }}>
                <AdminCard
                  title="Backend Management"
                  icon={
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
                      <path d="m19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="white" strokeWidth="2"/>
                    </svg>
                  }
                  description="Manage categories, locations, and system-wide settings"
                  colorType="primary"
                  onClick={() => navigate('/admin/backend-management')}
                  badge={{ text: 'Settings', color: themeColors.primary }}
                />
              </div>
            </div>
          </div>

          {/* System Status */}
          <div style={{
            background: 'linear-gradient(145deg, #ffffff 0%, rgba(187, 225, 250, 0.05) 100%)',
            border: `2px solid rgba(187, 225, 250, 0.3)`,
            borderRadius: '24px',
            padding: '2.5rem'
          }}>
            <h2 style={{ 
              color: themeColors.primary, 
              marginBottom: '2rem',
              fontSize: '1.8rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              System Status
            </h2>
            <div className="system-grid">
              <div className="system-card">
                <div style={{ 
                  color: '#28a745', 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  marginBottom: '0.8rem'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.3rem'
                }}>
                  Database
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '0.85rem',
                  opacity: 0.7
                }}>
                  Connected & Operational
                </div>
              </div>
              
              <div className="system-card">
                <div style={{ 
                  color: (stats.pendingRequests + stats.updateRequests + stats.removalRequests) > 15 ? '#ffc107' : '#28a745', 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  marginBottom: '0.8rem'
                }}>
                  {(stats.pendingRequests + stats.updateRequests + stats.removalRequests) > 15 ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="17" r="1" fill="currentColor"/>
                    </svg>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.3rem'
                }}>
                  Workload
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '0.85rem',
                  opacity: 0.7
                }}>
                  {(stats.pendingRequests + stats.updateRequests + stats.removalRequests) > 15 ? 'High Volume' : 'Normal Load'}
                </div>
              </div>
              
              <div className="system-card">
                <div style={{ 
                  color: themeColors.tertiary, 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  marginBottom: '0.8rem'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="m19 9-5 5-4-4-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.3rem'
                }}>
                  Analytics
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '0.85rem',
                  opacity: 0.7
                }}>
                  Real-time Tracking
                </div>
              </div>
              
              <div className="system-card">
                <div style={{ 
                  color: themeColors.secondary, 
                  fontSize: '2rem', 
                  fontWeight: '700',
                  marginBottom: '0.8rem'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="m19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.3rem'
                }}>
                  Configuration
                </div>
                <div style={{ 
                  color: themeColors.primary, 
                  fontSize: '0.85rem',
                  opacity: 0.7
                }}>
                  System Settings Active
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div style={{
            marginTop: '3rem',
            padding: '2rem',
            background: `linear-gradient(135deg, rgba(187, 225, 250, 0.1) 0%, rgba(50, 130, 184, 0.05) 100%)`,
            borderRadius: '20px',
            border: `1px solid rgba(187, 225, 250, 0.3)`,
            textAlign: 'center'
          }}>
            <h3 style={{
              color: themeColors.primary,
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Quick Actions
            </h3>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: `linear-gradient(135deg, ${themeColors.tertiary} 0%, ${themeColors.secondary} 100%)`,
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(50, 130, 184, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(50, 130, 184, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(50, 130, 184, 0.3)';
                }}
              >
                🔄 Refresh Dashboard
              </button>
              
              <button
                onClick={() => navigate('/admin/backend-management')}
                style={{
                  background: 'transparent',
                  color: themeColors.primary,
                  border: `2px solid ${themeColors.primary}`,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = themeColors.primary;
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = themeColors.primary;
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ⚙️ System Settings
              </button>
            </div>
            
            <p style={{
              color: themeColors.primary,
              fontSize: '0.9rem',
              margin: '1.5rem 0 0 0',
              opacity: 0.7,
              fontStyle: 'italic'
            }}>
              Dashboard automatically refreshes every 30 seconds to keep data current
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default Admin;