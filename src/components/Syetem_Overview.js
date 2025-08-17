import React from 'react';

const Syetem_Overview = ({ stats, themeColors }) => {
  return (
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
  );
};

export default Syetem_Overview;