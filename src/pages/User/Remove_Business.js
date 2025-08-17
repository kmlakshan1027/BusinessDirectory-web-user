// pages/Remove_Business.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs.js';
import { colors } from '../../utils/colors.js';

const Remove_Business = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessId: '',
    reason: '',
    customReason: '',
    additionalComments: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [businessData, setBusinessData] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [businessNotFound, setBusinessNotFound] = useState(false);

  const removalReasons = [
    {
      value: 'business_closed',
      label: 'Business Permanently Closed',
      description: 'The business has shut down and is no longer operating'
    },
    {
      value: 'duplicate_listing',
      label: 'Duplicate Listing',
      description: 'This business is already listed under a different Business ID'
    },
    {
      value: 'incorrect_information',
      label: 'Incorrect Business Information',
      description: 'The business information is completely wrong and cannot be corrected'
    },
    {
      value: 'not_my_business',
      label: 'Not My Business',
      description: 'This business was listed without my permission'
    },
    {
      value: 'relocating',
      label: 'Business Relocating',
      description: 'Moving to a new location and will re-register with new details'
    },
    {
      value: 'change_ownership',
      label: 'Change of Ownership',
      description: 'Business has been sold or transferred to new ownership'
    },
    {
      value: 'privacy_concerns',
      label: 'Privacy Concerns',
      description: 'No longer want business information to be publicly listed'
    },
    {
      value: 'other',
      label: 'Other Reason',
      description: 'Please specify your reason in the comments below'
    }
  ];

  // Fetch business data when Business ID changes
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!formData.businessId || !isValidBusinessIdFormat(formData.businessId)) {
        setBusinessData(null);
        setBusinessNotFound(false);
        return;
      }

      setLoadingBusiness(true);
      setBusinessNotFound(false);

      try {
        const businessCollection = collection(db, 'BusinessList');
        const q = query(businessCollection, where('business_ID', '==', formData.businessId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = {
            id: doc.id,
            ...doc.data()
          };
          setBusinessData(data);
          setBusinessNotFound(false);
        } else {
          setBusinessData(null);
          setBusinessNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching business data:', error);
        setBusinessData(null);
        setBusinessNotFound(true);
      } finally {
        setLoadingBusiness(false);
      }
    };

    const timeoutId = setTimeout(fetchBusinessData, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.businessId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'businessId') {
      const upperValue = value.toUpperCase();
      setFormData(prev => ({
        ...prev,
        [name]: upperValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing/selecting
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate Business ID format
  const isValidBusinessIdFormat = (businessId) => {
    const regex = /^BIZ-[A-Z0-9]{2}-[A-Z0-9]{4}$/;
    return regex.test(businessId);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.businessId.trim()) {
      newErrors.businessId = 'Business ID is required';
    } else if (!isValidBusinessIdFormat(formData.businessId)) {
      newErrors.businessId = 'Business ID must be in format: BIZ-XX-XXXX (e.g., BIZ-01-0001)';
    } else if (businessNotFound) {
      newErrors.businessId = 'Business ID not found in our records';
    }
    
    if (!formData.reason) {
      newErrors.reason = 'Please select a reason for removal';
    } else if (formData.reason === 'other' && !formData.customReason.trim()) {
      newErrors.customReason = 'Please specify your reason for removal';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare removal reason
      const reasonText = formData.reason === 'other' 
        ? formData.customReason.trim() 
        : removalReasons.find(r => r.value === formData.reason)?.label || formData.reason;

      // Add to RemovalBusinessRequest collection for admin review
      await addDoc(collection(db, 'RemovalBusinessRequest'), {
        businessId: formData.businessId.trim(),
        businessName: businessData?.name || 'Unknown',
        businessDocId: businessData?.id || null,
        reason: reasonText,
        reasonCategory: formData.reason,
        additionalComments: formData.additionalComments.trim() || null,
        businessData: businessData, // Store complete business data for reference
        requestedAt: new Date(),
        status: 'pending_review',
        reviewedBy: null,
        reviewedAt: null,
        removedAt: null
      });

      alert('Removal request submitted successfully! Your request will be reviewed by our team.');
      
      // Reset form
      setFormData({
        businessId: '',
        reason: '',
        customReason: '',
        additionalComments: ''
      });
      setBusinessData(null);
      setBusinessNotFound(false);
      
      // Navigate back to home
      navigate('/');
      
    } catch (error) {
      console.error('Error submitting removal request:', error);
      alert('Failed to submit removal request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Business Card Component (same structure as Update_Business.js)
  const BusinessCard = ({ business }) => (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginBottom: '2rem',
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
          marginTop: '2rem'
        }}>
          <div>
            <h3 style={{ color: colors.darkNavy, margin: '0 0 0.5rem 0' }}>
              {business.name || 'N/A'}
            </h3>
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
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .form-grid {
              grid-template-columns: 1fr !important;
            }
            .remove-main {
              padding: 1.5rem !important;
            }
            .form-container {
              padding: 1.5rem !important;
            }
            .remove-title {
              font-size: 1.8rem !important;
            }
            .form-actions {
              flex-direction: column !important;
              gap: 1rem !important;
            }
            .form-actions button {
              width: 100% !important;
            }
            .reason-option {
              padding: 1rem !important;
            }
          }
          .reason-option:hover {
            background-color: #f8f9ff !important;
            border-color: ${colors.mediumBlue} !important;
          }
          .reason-option.selected {
            background-color: #e8f4ff !important;
            border-color: ${colors.mediumBlue} !important;
          }
        `}
      </style>
      
      <main className="remove-main" style={{
        flex: 1,
        padding: '3rem',
        backgroundColor: '#ffffff',
        minHeight: '60vh',
        width: '100%'
      }}>
        <div style={{ 
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            marginBottom: '3rem'
          }}>
            <h1 className="remove-title" style={{
              color: colors.darkNavy,
              fontSize: '2rem',
              fontWeight: 'bold',
              margin: 0
            }}>
              🗑️ Remove Your Business
            </h1>
          </div>

          <div className="form-container" style={{
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '15px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            width: '100%'
          }}>
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div>
                  <strong style={{ color: '#856404' }}>Important Notice:</strong>
                  <p style={{
                    margin: '0.5rem 0 0 0',
                    color: '#856404',
                    lineHeight: '1.5'
                  }}>
                    This action will permanently remove your business from our directory. 
                    Please make sure this is what you want to do, as this action cannot be undone easily. 
                    Our team will review your request before processing the removal.
                  </p>
                </div>
              </div>
            </div>

            <p style={{
              color: colors.mediumBlue,
              marginBottom: '2.5rem',
              lineHeight: '1.6',
              fontSize: '1.1rem'
            }}>
              Please provide your business ID and select the reason for removal. Our team will review your request and process the removal accordingly.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Business ID Field */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.7rem',
                  color: colors.darkNavy,
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  Business ID <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="businessId"
                  value={formData.businessId}
                  onChange={handleInputChange}
                  placeholder="BIZ-XX-XXXX (e.g., BIZ-01-0001)"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: `2px solid ${errors.businessId ? '#ff4444' : businessData ? '#00cc44' : isValidBusinessIdFormat(formData.businessId) ? (loadingBusiness ? '#ffc107' : '#00cc44') : colors.lightBlue}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.3rem'
                }}>
                  <small style={{
                    color: colors.mediumBlue,
                    fontSize: '0.8rem'
                  }}>
                    Format: BIZ-XX-XXXX
                  </small>
                  {formData.businessId && (
                    <div style={{
                      color: businessData ? '#00cc44' : businessNotFound ? '#ff4444' : isValidBusinessIdFormat(formData.businessId) ? (loadingBusiness ? '#ffc107' : '#00cc44') : '#ff6600',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      {loadingBusiness ? (
                        <>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #ffc107',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Checking...
                        </>
                      ) : businessData ? (
                        '✓ Business Found'
                      ) : businessNotFound ? (
                        '✗ Not Found'
                      ) : isValidBusinessIdFormat(formData.businessId) ? (
                        '✓ Valid Format'
                      ) : (
                        '⚠ Invalid Format'
                      )}
                    </div>
                  )}
                </div>
                {errors.businessId && (
                  <div style={{
                    color: '#ff4444',
                    fontSize: '0.8rem',
                    marginTop: '0.3rem'
                  }}>
                    {errors.businessId}
                  </div>
                )}
              </div>

              {/* Display Business Data if found */}
              {businessData && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    color: colors.darkNavy,
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    marginBottom: '1rem'
                  }}>
                    📋 Business to be Removed
                  </h3>
                  <BusinessCard business={businessData} />
                </div>
              )}

              {/* Removal Reason Selection */}
              {businessData && (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '1rem',
                    color: colors.darkNavy,
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    Reason for Removal <span style={{ color: 'red' }}>*</span>
                  </label>
                  
                  <div style={{
                    display: 'grid',
                    gap: '0.75rem'
                  }}>
                    {removalReasons.map((reason) => (
                      <div key={reason.value}>
                        <label 
                          className={`reason-option ${formData.reason === reason.value ? 'selected' : ''}`}
                          style={{
                            display: 'block',
                            padding: '1.2rem',
                            border: `2px solid ${formData.reason === reason.value ? colors.mediumBlue : colors.lightBlue}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backgroundColor: formData.reason === reason.value ? '#e8f4ff' : 'white'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem'
                          }}>
                            <input
                              type="radio"
                              name="reason"
                              value={reason.value}
                              checked={formData.reason === reason.value}
                              onChange={handleInputChange}
                              style={{
                                marginTop: '0.2rem',
                                transform: 'scale(1.2)'
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: 'bold',
                                color: colors.darkNavy,
                                marginBottom: '0.3rem',
                                fontSize: '1rem'
                              }}>
                                {reason.label}
                              </div>
                              <div style={{
                                color: colors.mediumBlue,
                                fontSize: '0.9rem',
                                lineHeight: '1.4'
                              }}>
                                {reason.description}
                              </div>
                            </div>
                          </div>
                        </label>
                        
                        {/* Custom reason input for "Other" option */}
                        {formData.reason === 'other' && reason.value === 'other' && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <input
                              type="text"
                              name="customReason"
                              value={formData.customReason}
                              onChange={handleInputChange}
                              placeholder="Please specify your reason for removal"
                              style={{
                                width: '100%',
                                padding: '1rem',
                                border: `2px solid ${errors.customReason ? '#ff4444' : colors.lightBlue}`,
                                borderRadius: '8px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit'
                              }}
                            />
                            {errors.customReason && (
                              <div style={{
                                color: '#ff4444',
                                fontSize: '0.8rem',
                                marginTop: '0.3rem'
                              }}>
                                {errors.customReason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {errors.reason && (
                    <div style={{
                      color: '#ff4444',
                      fontSize: '0.8rem',
                      marginTop: '0.5rem'
                    }}>
                      {errors.reason}
                    </div>
                  )}
                </div>
              )}

              {/* Additional Comments */}
              {businessData && formData.reason && (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.7rem',
                    color: colors.darkNavy,
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    name="additionalComments"
                    value={formData.additionalComments}
                    onChange={handleInputChange}
                    placeholder="Any additional information you'd like to provide..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: `2px solid ${colors.lightBlue}`,
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                  <small style={{
                    color: colors.mediumBlue,
                    fontSize: '0.8rem',
                    marginTop: '0.3rem',
                    display: 'block'
                  }}>
                    This information will help our team better understand your request
                  </small>
                </div>
              )}

              <div className="form-actions" style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1.5rem',
                marginTop: '3rem'
              }}>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    padding: '1rem 2rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: colors.lightGray,
                    color: colors.darkNavy,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !businessData || !formData.reason}
                  style={{
                    padding: '1rem 2rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: isSubmitting || !businessData || !formData.reason ? colors.mediumGray : '#dc3545',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: isSubmitting || !businessData || !formData.reason ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      🗑️ Submit Removal Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
};

export default Remove_Business;