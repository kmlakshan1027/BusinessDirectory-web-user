// components/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { colors } from '../utils/colors';
import { auth, db } from '../configs/FirebaseConfigs';
import { doc, getDoc } from 'firebase/firestore';

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .header-content {
              flex-direction: column !important;
              gap: 1rem;
              text-align: center;
            }
            .header-title {
              font-size: 1.2rem !important;
            }
            .header-buttons {
              flex-direction: column !important;
              gap: 0.5rem !important;
            }
          }
        `}
      </style>
      
      <header style={{
        backgroundColor: colors.darkNavy,
        color: 'white',
        padding: '1.5rem 3rem', // Increased padding for better spacing
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '100%', // Full width
        boxSizing: 'border-box'
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
                  fontSize: '1.8rem', // Slightly larger
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ShopNex Directory 
              </h1>
            </Link>
          </div>
          
          <div className="header-buttons" style={{
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center'
          }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img 
                  src={user.profileImageURL} 
                  alt={user.fullName} 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    border: `2px solid ${colors.light}`
                  }} 
                />
                <span style={{ fontWeight: '600', fontSize: '1rem' }}>{user.fullName}</span>
                <button 
                  onClick={async () => {
                    await auth.signOut();
                    navigate('/');
                  }}
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
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;