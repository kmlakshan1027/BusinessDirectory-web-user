// pages/Backend_Management.js
import React, { useState } from 'react';
import { colors } from '../../utils/colors';
import CategoryManagement from '../../components/Category_Management';
import LocationManagement from '../../components/Location_Management';
import ImageManagement from '../../components/Image_Management';

const Backend_Management = () => {
  // Category Management Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Location Management Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Image Management Modal State
  const [showImageModal, setShowImageModal] = useState(false);

  // Functions for Category modal management
  const openCategoryModal = () => {
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
  };

  // Functions for Location modal management
  const openLocationModal = () => {
    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    setShowLocationModal(false);
  };

  // Functions for Image modal management
  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .backend-management-main {
              padding: 1.5rem !important;
            }
            .management-cards-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
      
      <main className="backend-management-main" style={{
        flex: 1,
        padding: '3rem',
        backgroundColor: colors.lightGray,
        minHeight: '60vh',
        width: '100%'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Header Section */}
          <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <h1 style={{
              color: colors.darkNavy,
              marginBottom: '0.5rem',
              fontSize: '2.5rem',
              fontWeight: 'bold'
            }}>
              Backend Management
            </h1>
            <p style={{ 
              color: colors.mediumGray, 
              fontSize: '1.2rem',
              marginBottom: '1rem',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Manage system-wide settings including categories, location data, and media files for the business directory.
            </p>
          </div>

          {/* Management Cards Grid */}
          <div className="management-cards-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            
            {/* Category Management Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '2.5rem',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
              border: '2px solid #e8f4f8',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background Icon */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '8rem',
                opacity: '0.05',
                color: '#17a2b8'
              }}>
                🏷️
              </div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#17a2b8',
                  borderRadius: '50%',
                  marginBottom: '1.5rem',
                  fontSize: '2rem'
                }}>
                  🏷️
                </div>
                
                <h2 style={{
                  color: colors.darkNavy,
                  marginBottom: '1rem',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  Category Management
                </h2>
                
                <p style={{
                  color: colors.mediumGray,
                  marginBottom: '2rem',
                  lineHeight: '1.6',
                  fontSize: '1rem'
                }}>
                  Add, edit, or remove business categories. Manage the classification system used throughout the platform to organize businesses effectively.
                </p>
                
                <button
                  onClick={openCategoryModal}
                  style={{
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(23, 162, 184, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#138496';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(23, 162, 184, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#17a2b8';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(23, 162, 184, 0.3)';
                  }}
                >
                  🏷️ Manage Categories
                </button>
                
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: colors.mediumGray
                }}>
                  <strong>Features:</strong> Add new categories, edit existing ones, remove unused categories, organize business types
                </div>
              </div>
            </div>

            {/* Location Management Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '2.5rem',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
              border: '2px solid #e8f5e8',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background Icon */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '8rem',
                opacity: '0.05',
                color: '#28a745'
              }}>
                📌
              </div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#28a745',
                  borderRadius: '50%',
                  marginBottom: '1.5rem',
                  fontSize: '2rem'
                }}>
                  📌
                </div>
                
                <h2 style={{
                  color: colors.darkNavy,
                  marginBottom: '1rem',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  Location Management
                </h2>
                
                <p style={{
                  color: colors.mediumGray,
                  marginBottom: '2rem',
                  lineHeight: '1.6',
                  fontSize: '1rem'
                }}>
                  Manage districts, cities, and location data. Control the geographical organization system for business listings and location-based searches.
                </p>
                
                <button
                  onClick={openLocationModal}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#218838';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#28a745';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                  }}
                >
                  📌 Manage Locations
                </button>
                
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: colors.mediumGray
                }}>
                  <strong>Features:</strong> Add districts, manage cities, organize geographical data, location hierarchies
                </div>
              </div>
            </div>

            {/* Image Management Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '2.5rem',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
              border: '2px solid #f8e8ff',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background Icon */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '8rem',
                opacity: '0.05',
                color: '#6f42c1'
              }}>
                🖼️
              </div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#6f42c1',
                  borderRadius: '50%',
                  marginBottom: '1.5rem',
                  fontSize: '2rem'
                }}>
                  🖼️
                </div>
                
                <h2 style={{
                  color: colors.darkNavy,
                  marginBottom: '1rem',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  Image Management
                </h2>
                
                <p style={{
                  color: colors.mediumGray,
                  marginBottom: '2rem',
                  lineHeight: '1.6',
                  fontSize: '1rem'
                }}>
                  View and manage all images stored in Cloudinary. Delete unused images to optimize storage and maintain clean media organization.
                </p>
                
                <button
                  onClick={openImageModal}
                  style={{
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(111, 66, 193, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#5a35a0';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(111, 66, 193, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#6f42c1';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(111, 66, 193, 0.3)';
                  }}
                >
                  🖼️ Manage Images
                </button>
                
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: colors.mediumGray
                }}>
                  <strong>Features:</strong> View all stored images, delete unused files, optimize storage, bulk operations
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '15px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            border: '2px solid #fff3cd'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#ffc107',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                ℹ️
              </div>
              <h3 style={{
                color: colors.darkNavy,
                fontSize: '1.3rem',
                fontWeight: 'bold',
                margin: 0
              }}>
                Important Information
              </h3>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              <div>
                <h4 style={{ color: colors.darkNavy, marginBottom: '0.5rem' }}>
                  Category Management Tips:
                </h4>
                <ul style={{ color: colors.mediumGray, lineHeight: '1.6', paddingLeft: '1.2rem' }}>
                  <li>Categories help organize businesses for easier discovery</li>
                  <li>Remove unused categories to keep the system clean</li>
                  <li>Consider business types when creating new categories</li>
                  <li>Changes affect all business listings immediately</li>
                </ul>
              </div>
              
              <div>
                <h4 style={{ color: colors.darkNavy, marginBottom: '0.5rem' }}>
                  Location Management Tips:
                </h4>
                <ul style={{ color: colors.mediumGray, lineHeight: '1.6', paddingLeft: '1.2rem' }}>
                  <li>Maintain accurate geographical hierarchies</li>
                  <li>Ensure consistency in location naming</li>
                  <li>Consider adding new areas as the business grows</li>
                  <li>Location data affects search and filtering capabilities</li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: colors.darkNavy, marginBottom: '0.5rem' }}>
                  Image Management Tips:
                </h4>
                <ul style={{ color: colors.mediumGray, lineHeight: '1.6', paddingLeft: '1.2rem' }}>
                  <li>Regularly clean up unused images to save storage space</li>
                  <li>Use bulk operations for efficient management</li>
                  <li>Be careful when deleting - action cannot be undone</li>
                  <li>Monitor storage usage and optimize as needed</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Category Management Modal */}
        <CategoryManagement 
          isOpen={showCategoryModal} 
          onClose={closeCategoryModal} 
        />

        {/* Location Management Modal */}
        <LocationManagement 
          isOpen={showLocationModal} 
          onClose={closeLocationModal} 
        />

        {/* Image Management Modal */}
        <ImageManagement 
          isOpen={showImageModal} 
          onClose={closeImageModal} 
        />
      </main>
    </>
  );
};

export default Backend_Management;