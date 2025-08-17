// components/Header.js
import { Link } from 'react-router-dom';
import { colors } from '../utils/colors';

const Header = () => {
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
            <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
              <h1 
                className="header-title"
                style={{ 
                  margin: 0, 
                  fontSize: '1.8rem', // Slightly larger
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Business Directory Portal
              </h1>
            </Link>
          </div>
          
          <div className="header-buttons" style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <Link to="/">
              <button
                style={{
                  backgroundColor: colors.mediumBlue,
                  color: 'white',
                  border: 'none',
                  padding: '0.7rem 1.5rem', // Larger button
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = colors.lightBlue}
                onMouseOut={(e) => e.target.style.backgroundColor = colors.mediumBlue}
              >
                Home
              </button>
            </Link>

            <Link to="/admin">
              <button
                style={{
                  backgroundColor: colors.lightBlue,
                  color: 'white',
                  border: 'none',
                  padding: '0.7rem 1.5rem', // Larger button
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = colors.mediumBlue}
                onMouseOut={(e) => e.target.style.backgroundColor = colors.lightBlue}
              >
                Admin Panel
              </button>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;