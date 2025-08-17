// components/Footer.js
import React from 'react';
import { colors } from '../utils/colors';

const Footer = () => {
  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .footer-text {
              font-size: 0.9rem !important;
            }
          }
        `}
      </style>
      
      <footer style={{
        backgroundColor: colors.darkNavy,
        color: 'white',
        textAlign: 'center',
        padding: '2rem 3rem', // Increased padding
        marginTop: 'auto',
        width: '100%', // Full width
        boxSizing: 'border-box'
      }}>
        <p className="footer-text" style={{ 
          margin: 0,
          fontSize: '1rem' // Slightly larger text
        }}>
          © 2025 Business Directory Portal. All rights reserved.
        </p>
      </footer>
    </>
  );
};

export default Footer;