// components/ActionButton.js
import React from 'react';
import { colors } from '../utils/colors';

const ActionButton = ({ title, onClick, icon }) => {
  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .action-button {
              min-width: 200px !important;
              width: 100% !important;
              max-width: 300px !important;
            }
          }
        `}
      </style>
      
      <button
        className="action-button"
        onClick={onClick}
        style={{
          backgroundColor: colors.mediumBlue,
          color: 'white',
          border: 'none',
          padding: '2rem 2.5rem', // Larger padding
          borderRadius: '12px', // Slightly more rounded
          cursor: 'pointer',
          fontSize: '1.2rem', // Larger font
          minWidth: '180px', // Slightly larger minimum width
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.7rem',
          transition: 'all 0.3s ease',
          boxShadow: '0 6px 12px rgba(0,0,0,0.15)', // Enhanced shadow
          fontWeight: '500'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = colors.lightBlue;
          e.target.style.transform = 'translateY(-3px)';
          e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = colors.mediumBlue;
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
        }}
      >
        <span style={{ fontSize: '1.8rem' }}>{icon}</span>
        <span>{title}</span>
      </button>
    </>
  );
};

export default ActionButton;