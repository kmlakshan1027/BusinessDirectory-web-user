// components/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../utils/colors';
import { auth, db } from '../configs/FirebaseConfigs';
import { doc, getDoc } from 'firebase/firestore';

const Header = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'User', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser(userDoc.data());
          } else {
            console.log('No such user document!');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchUserData();
      } else {
        setUser(null);
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await auth.signOut();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <style>
        {`
          /* Mobile Hamburger Menu Styles */
          .hamburger-btn {
            display: none;
            flex-direction: column;
            gap: 5px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            z-index: 1001;
          }

          .hamburger-line {
            width: 28px;
            height: 3px;
            background-color: white;
            transition: all 0.3s ease;
            border-radius: 2px;
          }

          .hamburger-btn.active .hamburger-line:nth-child(1) {
            transform: rotate(45deg) translate(8px, 8px);
          }

          .hamburger-btn.active .hamburger-line:nth-child(2) {
            opacity: 0;
          }

          .hamburger-btn.active .hamburger-line:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
          }

          @media (max-width: 768px) {
            /* Show hamburger menu */
            .hamburger-btn {
              display: flex !important;
            }

            /* Header adjustments */
            .header-main {
              padding: 1rem 1.5rem !important;
            }

            .header-content {
              flex-direction: row !important;
              justify-content: space-between !important;
            }

            .header-title {
              font-size: 1.3rem !important;
            }

            /* Mobile menu */
            .header-nav {
              position: fixed !important;
              top: 0;
              right: -100%;
              width: 280px;
              height: 100vh;
              background-color: ${colors.darkNavy};
              box-shadow: -2px 0 10px rgba(0,0,0,0.3);
              transition: right 0.3s ease;
              z-index: 1000;
              overflow-y: auto;
              padding-top: 80px;
            }

            .header-nav.open {
              right: 0 !important;
            }

            .header-buttons {
              flex-direction: column !important;
              gap: 0 !important;
              width: 100%;
              align-items: stretch !important;
            }

            .user-info {
              flex-direction: column !important;
              padding: 1.5rem !important;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              gap: 1rem !important;
            }

            .user-avatar {
              width: 60px !important;
              height: 60px !important;
            }

            .user-name {
              text-align: center;
              font-size: 1.1rem !important;
            }

            .nav-link {
              display: block;
              padding: 1rem 1.5rem;
              color: white;
              text-decoration: none;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              transition: background 0.3s;
            }

            .nav-link:hover {
              background: rgba(255,255,255,0.1);
            }

            .logout-btn-mobile {
              margin: 1.5rem;
              width: calc(100% - 3rem) !important;
              padding: 12px !important;
              font-size: 1rem !important;
            }

            /* Overlay */
            .menu-overlay {
              display: none;
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0,0,0,0.5);
              z-index: 999;
            }

            .menu-overlay.active {
              display: block !important;
            }
          }

          @media (max-width: 480px) {
            .header-title {
              font-size: 1.1rem !important;
            }

            .header-nav {
              width: 250px;
            }
          }
        `}
      </style>
      
      {/* Overlay for mobile menu */}
      <div 
        className={`menu-overlay ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      <header className="header-main" style={{
        backgroundColor: colors.darkNavy,
        color: 'white',
        padding: '1.5rem 3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '100%',
        boxSizing: 'border-box',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="header-content" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          <div>
            <Link to="/home" style={{ textDecoration: 'none', color: 'white' }}>
              <h1 
                className="header-title"
                style={{ 
                  margin: 0, 
                  fontSize: '1.8rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ShopNex Directory 
              </h1>
            </Link>
          </div>

          {/* Hamburger Button */}
          <button 
            className={`hamburger-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          
          {/* Navigation Menu */}
          <nav className={`header-nav header-buttons ${menuOpen ? 'open' : ''}`} style={{
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center'
          }}>
            {user && (
              <>
                <div className="user-info" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem' 
                }}>
                  <img 
                    className="user-avatar"
                    src={user.profileImageURL} 
                    alt={user.fullName} 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      border: `2px solid ${colors.light}`
                    }} 
                  />
                  <span className="user-name" style={{ 
                    fontWeight: '600', 
                    fontSize: '1rem' 
                  }}>
                    {user.fullName}
                  </span>
                </div>

                {/* Desktop Navigation Links (hidden on mobile via CSS) */}
                <div style={{ display: 'none' }}>
                  <Link className="nav-link" to="/home">Home</Link>
                  <Link className="nav-link" to="/add-business">Add Business</Link>
                  <Link className="nav-link" to="/update-business">Update Business</Link>
                  <Link className="nav-link" to="/remove-business">Remove Business</Link>
                </div>

                {/* Mobile Navigation Links */}
                <div className="mobile-nav-links" style={{ display: 'none' }}>
                  <Link className="nav-link" to="/home">🏠 Home</Link>
                  <Link className="nav-link" to="/add-business">➕ Add Business</Link>
                  <Link className="nav-link" to="/update-business">✏️ Update Business</Link>
                  <Link className="nav-link" to="/remove-business">🗑️ Remove Business</Link>
                </div>

                <button 
                  className="logout-btn-mobile"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: `1px solid ${colors.light}`,
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = colors.secondary}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;