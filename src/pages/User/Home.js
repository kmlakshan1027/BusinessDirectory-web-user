// pages/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ActionButton from '../../components/ActionButton';
import { colors } from '../../utils/colors';

const Home = () => {
  const navigate = useNavigate();

  // Your provided color palette
  const themeColors = {
    primary: '#1B262C',    // Dark navy
    secondary: '#0F4C75',  // Deep blue
    tertiary: '#3282B8',   // Medium blue
    light: '#BBE1FA'       // Light blue
  };

  const handleAddBusiness = () => {
    navigate('/add-business');
  };

  const handleUpdateBusiness = () => {
    navigate('/update-business');
  };

  const handleRemoveBusiness = () => {
    navigate('/remove-business');
  };

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
          
          .home-main {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-height: 100vh;
            width: 100vw;
            background-color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            position: relative;
            overflow-x: hidden;
            overflow-y: auto;
          }
          
          .main-container {
            padding: 4rem;
            width: 100%;
            max-width: 1400px;
            position: relative;
            z-index: 1;
            text-align: center;
          }
          
          .title-gradient {
            background: linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .buttons-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 3rem;
            margin: 4rem 0;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .feature-card {
            background: linear-gradient(145deg, #ffffff 0%, rgba(187, 225, 250, 0.1) 100%);
            border: 2px solid rgba(187, 225, 250, 0.3);
            border-radius: 24px;
            padding: 3rem 2rem;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            cursor: pointer;
            height: 320px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          
          .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(187, 225, 250, 0.4), transparent);
            transition: left 0.6s;
          }
          
          .feature-card:hover::before {
            left: 100%;
          }
          
          .feature-card:hover {
            transform: translateY(-12px) scale(1.03);
            box-shadow: 0 25px 50px rgba(27, 38, 44, 0.3);
          }
          
          .feature-card.add-business:hover {
            border-color: ${themeColors.tertiary};
            box-shadow: 0 25px 50px rgba(50, 130, 184, 0.3);
          }
          
          .feature-card.update-business:hover {
            border-color: ${themeColors.secondary};
            box-shadow: 0 25px 50px rgba(15, 76, 117, 0.3);
          }
          
          .feature-card.remove-business:hover {
            border-color: ${themeColors.primary};
            box-shadow: 0 25px 50px rgba(27, 38, 44, 0.3);
          }
          
          .icon-wrapper {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            position: relative;
            overflow: hidden;
          }
          
          .icon-svg {
            width: 32px;
            height: 32px;
            stroke: white;
            stroke-width: 2;
            fill: none;
            z-index: 2;
            position: relative;
          }
          
          .add-business .icon-wrapper {
            background: linear-gradient(135deg, ${themeColors.tertiary} 0%, ${themeColors.secondary} 100%);
            box-shadow: 0 12px 40px rgba(50, 130, 184, 0.4);
          }
          
          .update-business .icon-wrapper {
            background: linear-gradient(135deg, ${themeColors.secondary} 0%, ${themeColors.primary} 100%);
            box-shadow: 0 12px 40px rgba(15, 76, 117, 0.4);
          }
          
          .remove-business .icon-wrapper {
            background: linear-gradient(135deg, ${themeColors.primary} 0%, #0d1e24 100%);
            box-shadow: 0 12px 40px rgba(27, 38, 44, 0.4);
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            margin-top: 4rem;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .stat-item {
            text-align: center;
            padding: 2rem 1.5rem;
            background: rgba(187, 225, 250, 0.1);
            border-radius: 20px;
            border: 1px solid rgba(187, 225, 250, 0.3);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }
          
          .stat-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 15px 35px rgba(27, 38, 44, 0.1);
            background: rgba(187, 225, 250, 0.2);
          }
          
          .info-banner {
            margin-top: 4rem;
            padding: 3rem;
            background: linear-gradient(135deg, rgba(187, 225, 250, 0.15) 0%, rgba(50, 130, 184, 0.1) 100%);
            border-radius: 24px;
            border: 2px solid rgba(187, 225, 250, 0.3);
            position: relative;
            overflow: hidden;
          }
          
          @media (max-width: 1200px) {
            .main-container {
              padding: 3rem 2rem;
            }
            .buttons-grid {
              gap: 2rem;
            }
            .feature-card {
              height: 300px;
              padding: 2.5rem 1.5rem;
            }
          }
          
          @media (max-width: 968px) {
            .buttons-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (max-width: 768px) {
            .home-main {
              padding: 1rem;
            }
            .main-container {
              padding: 2rem 1.5rem;
              border-radius: 24px;
            }
            .home-title {
              font-size: 2.5rem !important;
            }
            .home-subtitle {
              font-size: 1.1rem !important;
            }
            .buttons-grid {
              grid-template-columns: 1fr !important;
              gap: 2rem !important;
              margin: 3rem 0;
            }
            .feature-card {
              height: 280px;
              padding: 2rem 1.5rem;
            }
            .stats-grid {
              grid-template-columns: 1fr !important;
              gap: 1.5rem;
            }
            .icon-wrapper {
              width: 70px;
              height: 70px;
            }
            .icon-svg {
              width: 28px;
              height: 28px;
            }
          }
          
          @media (max-width: 480px) {
            .home-title {
              font-size: 2rem !important;
            }
            .main-container {
              padding: 1.5rem 1rem !important;
            }
            .feature-card {
              height: 260px;
              padding: 1.5rem 1rem;
            }
            .info-banner {
              padding: 2rem 1.5rem;
            }
          }
        `}
      </style>
      
      <main className="home-main">
        <div className="main-container">
          {/* Hero Section */}
          <div style={{ marginBottom: '3rem' }}>
            <h1 className="home-title title-gradient" style={{
              fontSize: '3.5rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              letterSpacing: '-0.025em',
              lineHeight: '1.1'
            }}>
              ShopNex Directory User Portal
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
                Modern Business Management
              </span>
            </div>
            
            <p className="home-subtitle" style={{
              color: themeColors.primary,
              fontSize: '1.3rem',
              lineHeight: '1.7',
              maxWidth: '700px',
              margin: '0 auto',
              fontWeight: '400',
              opacity: 0.8
            }}>
              Streamline your business operations with our comprehensive management platform. 
              Add, update, and manage your business listings with cutting-edge tools.
            </p>
          </div>

          {/* Action Buttons Grid */}
          <div className="buttons-grid">
            <div className="feature-card add-business" onClick={handleAddBusiness}>
              <div className="icon-wrapper">
                <svg className="icon-svg" viewBox="0 0 24 24">
                  <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{
                color: themeColors.primary,
                fontSize: '1.4rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                Add New Business
              </h3>
              <p style={{
                color: themeColors.primary,
                fontSize: '1rem',
                lineHeight: '1.6',
                margin: 0,
                opacity: 0.7
              }}>
                Register your business and join our growing directory with comprehensive listing features
              </p>
            </div>

            <div className="feature-card update-business" onClick={handleUpdateBusiness}>
              <div className="icon-wrapper">
                <svg className="icon-svg" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{
                color: themeColors.primary,
                fontSize: '1.4rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                Update Business
              </h3>
              <p style={{
                color: themeColors.primary,
                fontSize: '1rem',
                lineHeight: '1.6',
                margin: 0,
                opacity: 0.7
              }}>
                Modify your existing business information, details, and keep your listing current
              </p>
            </div>

            <div className="feature-card remove-business" onClick={handleRemoveBusiness}>
              <div className="icon-wrapper">
                <svg className="icon-svg" viewBox="0 0 24 24">
                  <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round"/>
                  <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{
                color: themeColors.primary,
                fontSize: '1.4rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                Remove Business
              </h3>
              <p style={{
                color: themeColors.primary,
                fontSize: '1rem',
                lineHeight: '1.6',
                margin: 0,
                opacity: 0.7
              }}>
                Request secure removal of your business listing from our directory platform
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-grid">
            <div className="stat-item">
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: themeColors.primary,
                marginBottom: '0.5rem'
              }}>
                500+
              </div>
              <div style={{
                fontSize: '1rem',
                color: themeColors.primary,
                fontWeight: '500',
                opacity: 0.7
              }}>
                Active Businesses
              </div>
            </div>
            
            <div className="stat-item">
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: themeColors.primary,
                marginBottom: '0.5rem'
              }}>
                24/7
              </div>
              <div style={{
                fontSize: '1rem',
                color: themeColors.primary,
                fontWeight: '500',
                opacity: 0.7
              }}>
                Support Available
              </div>
            </div>
            
            <div className="stat-item">
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: themeColors.primary,
                marginBottom: '0.5rem'
              }}>
                99%
              </div>
              <div style={{
                fontSize: '1rem',
                color: themeColors.primary,
                fontWeight: '500',
                opacity: 0.7
              }}>
                Uptime Guarantee
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="info-banner">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${themeColors.tertiary} 0%, ${themeColors.secondary} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                  <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{
                color: themeColors.primary,
                fontSize: '1.3rem',
                fontWeight: '600',
                margin: 0
              }}>
                Getting Started Guide
              </h3>
            </div>
            <p style={{
              color: themeColors.primary,
              fontSize: '1.1rem',
              margin: 0,
              lineHeight: '1.7',
              textAlign: 'center',
              opacity: 0.8
            }}>
              For business updates and removals, you'll need your Business ID.
              Newly registered businesses will receive their unique ID immediately upon completing the registration process.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;