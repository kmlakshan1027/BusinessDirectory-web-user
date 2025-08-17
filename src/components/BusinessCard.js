//components/BusinessCard.js
import React, { useState } from 'react';
import { colors } from '../utils/colors';

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (err) {
      console.warn('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'rejected':
        return '#dc3545';
      default:
        return colors.mediumGray;
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };



  // Helper function to render star ratings
  const renderStars = (rating, size = '16px') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} style={{ color: '#FFD700', fontSize: size }}>★</span>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <span key="half" style={{ color: '#FFD700', fontSize: size }}>⯨</span>
      );
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <span key={`empty-${i}`} style={{ color: '#ddd', fontSize: size }}>★</span>
      );
    }
    
    return stars;
  };

  // Calculate average rating
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  };

const BusinessCard = ({ business, viewMode, deletingBusinessId, handleDeleteBusiness }) => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  // Process reviews data
  const reviews = business.reviews || [];
  const averageRating = calculateAverageRating(reviews);
  const reviewsToShow = showAllReviews ? reviews : reviews.slice(0, 3);
  const finalScore = business.finalScore || business.final_score || 0; // Handle different field naming

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: '1rem',
      border: `2px solid ${getStatusColor(business.status)}`,
      position: 'relative'
    }}>
      {/* Status Badge */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        backgroundColor: getStatusColor(business.status),
        color: 'white',
        padding: '0.3rem 0.8rem',
        borderRadius: '15px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        zIndex: 1
      }}>
        {getStatusText(business.status)}
      </div>

      {/* Final Score Badge */}
      {finalScore > 0 && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: business.status ? '8rem' : '1rem',
          backgroundColor: colors.mediumBlue,
          color: 'white',
          padding: '0.3rem 0.8rem',
          borderRadius: '15px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          <span>⭐</span>
          Final Score: {finalScore}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: business.imageUrl ? 'auto 1fr' : '1fr',
        gap: '1.5rem',
        marginBottom: '1rem'
      }}>
        {/* Business Image Section */}
        {business.imageUrl && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start'
          }}>
            <img
              src={business.imageUrl}
              alt={business.name || 'Business Image'}
              style={{
                width: '150px',
                height: '110px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{
              display: 'none',
              backgroundColor: '#f8f9fa',
              border: '2px dashed #dee2e6',
              borderRadius: '8px',
              padding: '1rem',
              color: colors.mediumGray,
              fontSize: '0.8rem',
              width: '120px',
              height: '90px',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📷</div>
              <div>No Image</div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginTop: finalScore > 0 ? '3rem' : '2rem' // Add more top margin if final score is shown
        }}>
          <div>
            <h3 style={{ color: colors.darkNavy, margin: '0 0 0.5rem 0' }}>
              {business.name || 'N/A'}
            </h3>
            
            {/* Rating Summary */}
            {reviews.length > 0 && (
              <div style={{ 
                margin: '0.5rem 0', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {renderStars(parseFloat(averageRating), '18px')}
                </div>
                <span style={{ 
                  color: colors.mediumBlue, 
                  fontWeight: 'bold', 
                  fontSize: '1.1rem' 
                }}>
                  {averageRating}
                </span>
                <span style={{ 
                  color: colors.mediumGray, 
                  fontSize: '0.9rem' 
                }}>
                  ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Final Score Display in main content */}
            {finalScore > 0 && (
              <div style={{ 
                margin: '0.5rem 0', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: `2px solid ${colors.mediumBlue}`
              }}>
                <span style={{ fontSize: '1.2rem' }}>🏆</span>
                <span style={{ 
                  color: colors.mediumBlue, 
                  fontWeight: 'bold', 
                  fontSize: '1rem' 
                }}>
                  Final Score: {finalScore}
                </span>
              </div>
            )}
            
            <p style={{ margin: '0.25rem 0', color: colors.mediumBlue, fontWeight: 'bold' }}>
              <strong>Business ID:</strong> {business.business_ID || 'N/A'}
            </p>
            {business.originalTempID && (
              <p style={{ margin: '0.25rem 0', color: colors.mediumGray, fontSize: '0.9rem' }}>
                <strong>Original Temp ID:</strong> {business.originalTempID}
              </p>
            )}
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Category:</strong> {business.category || 'N/A'}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>District:</strong> {business.district || 'N/A'}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Location:</strong> {business.location || 'N/A'}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Address:</strong> {business.address || 'N/A'}
            </p>
          </div>
          
          <div>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Contact:</strong> {business.contact || 'N/A'}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Email:</strong> {business.email || 'N/A'}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>WhatsApp:</strong> {business.whatsapp || 'N/A'}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Website:</strong> {business.website || 'N/A'}
            </p>
            {business.status === 'approved' && business.approvedAt && (
              <p style={{ margin: '0.25rem 0', color: '#28a745', fontWeight: '500' }}>
                <strong>Approved:</strong> {formatDate(business.approvedAt)}
              </p>
            )}
            {business.createdAt && (
              <p style={{ margin: '0.25rem 0', color: colors.mediumBlue, fontWeight: '500' }}>
                <strong>Created:</strong> {formatDate(business.createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* About Section */}
      {business.about && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
            <strong>About:</strong> {business.about}
          </p>
        </div>
      )}

      {/* Operating Hours */}
      <div style={{ marginBottom: '1rem' }}>
        <strong style={{ color: colors.darkNavy }}>Operating Hours:</strong>
        {business.alwaysOpen ? (
          <span style={{ marginLeft: '0.5rem', color: colors.mediumBlue }}>
            Always Open (24/7)
          </span>
        ) : business.operatingTimes ? (
          <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {Object.entries(business.operatingTimes).map(([day, hours]) => (
              <div key={day} style={{ margin: '0.2rem 0' }}>
                <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>{' '}
                {hours && typeof hours === 'object' && hours.isOpen 
                  ? `${hours.openTime || 'N/A'} - ${hours.closeTime || 'N/A'}` 
                  : 'Closed'
                }
              </div>
            ))}
          </div>
        ) : (
          <span style={{ marginLeft: '0.5rem', color: colors.mediumGray }}>
            No operating hours specified
          </span>
        )}
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div style={{ 
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h4 style={{ 
              color: colors.darkNavy, 
              margin: 0,
              fontSize: '1.1rem'
            }}>
              Customer Reviews
            </h4>
            {reviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.mediumBlue,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textDecoration: 'underline'
                }}
              >
                {showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            ...(showAllReviews && reviews.length > 3 && {
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '1rem',
            }),
          }}>
            {reviewsToShow.map((review, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* User Avatar */}
                    {review.userImage ? (
                      <img
                        src={review.userImage}
                        alt={review.userName || 'User'}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #e0e0e0'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: colors.mediumBlue,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        {(review.userName || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: colors.darkNavy,
                        fontSize: '0.9rem'
                      }}>
                        {review.userName || 'Anonymous User'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {renderStars(review.rating || 0, '14px')}
                        <span style={{ 
                          color: colors.mediumGray, 
                          fontSize: '0.8rem',
                          marginLeft: '0.25rem'
                        }}>
                          {review.rating || 0}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {review.timestamp && (
                    <div style={{ 
                      color: colors.mediumGray, 
                      fontSize: '0.8rem' 
                    }}>
                      {formatDate(review.timestamp)}
                    </div>
                  )}
                </div>
                
                {review.comment && (
                  <div style={{ 
                    color: colors.mediumGray,
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    fontStyle: review.comment.startsWith('"') && review.comment.endsWith('"') ? 'italic' : 'normal'
                  }}>
                    {review.comment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Reviews Message */}
      {reviews.length === 0 && (
        <div style={{ 
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <div style={{ 
            color: colors.mediumGray,
            fontSize: '0.9rem'
          }}>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>⭐</span>
            No reviews yet. Be the first to review this business!
          </div>
        </div>
      )}

      {/* Contact Links */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        flexWrap: 'wrap',
        marginTop: '1rem',
        marginBottom: '1rem'
      }}>
        {business.website && (
          <a 
            href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              backgroundColor: colors.mediumBlue,
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            Visit Website
          </a>
        )}
        {business.facebook && (
          <a 
            href={business.facebook.startsWith('http') ? business.facebook : `https://${business.facebook}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#4267B2',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            Facebook
          </a>
        )}
        {business.locationUrl && (
          <a 
            href={business.locationUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#34A853',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            View Location
          </a>
        )}
        {business.whatsapp && (
          <a 
            href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#25D366',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            WhatsApp
          </a>
        )}
      </div>

      {/* Delete Business Button */}
      <div style={{
        borderTop: '1px solid #e0e0e0',
        paddingTop: '1rem',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => handleDeleteBusiness(business)}
          disabled={deletingBusinessId === business.id}
          style={{
            backgroundColor: deletingBusinessId === business.id ? '#6c757d' : '#dc3545',
            color: 'white',
            border: 'none',
            padding: '0.7rem 1.5rem',
            borderRadius: '5px',
            cursor: deletingBusinessId === business.id ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            opacity: deletingBusinessId === business.id ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {deletingBusinessId === business.id ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Deleting...
            </>
          ) : (
            <>
              🗑️ Delete Permanently
            </>
          )}
        </button>
      </div>

      {/* Detailed View */}
      {viewMode === 'detailed' && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          <strong style={{ color: colors.darkNavy, display: 'block', marginBottom: '0.5rem' }}>
            Raw Data (All Fields):
          </strong>
          <pre style={{
            backgroundColor: '#e9ecef',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.8rem',
            whiteSpace: 'pre-wrap'
          }}>
            {JSON.stringify(business, null, 2)}
          </pre>
        </div>
      )}

      {/* CSS for spinning animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BusinessCard;