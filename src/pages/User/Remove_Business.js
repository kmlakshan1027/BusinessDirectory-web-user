// pages/Remove_Business.js - Modern UI (All Firebase functions preserved)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs.js';
import { colors } from '../../utils/colors.js';
import AlertNotification from '../../components/AlertNotification.js';
import { Search, AlertCircle, Trash2, FileText, Building2, MapPin, Phone, Clock, Globe, Calendar } from 'lucide-react';

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

  // Alert state
  const [alert, setAlert] = useState({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
    duration: 5000
  });

  const removalReasons = [
    {
      value: 'business_closed',
      label: 'Business Permanently Closed',
      description: 'The business has shut down and is no longer operating',
    },
    {
      value: 'duplicate_listing',
      label: 'Duplicate Listing',
      description: 'This business is already listed under a different Business ID',
    },
    {
      value: 'incorrect_information',
      label: 'Incorrect Business Information',
      description: 'The business information is completely wrong and cannot be corrected',
    },
    {
      value: 'not_my_business',
      label: 'Not My Business',
      description: 'This business was listed without my permission',
    },
    {
      value: 'relocating',
      label: 'Business Relocating',
      description: 'Moving to a new location and will re-register with new details',
    },
    {
      value: 'change_ownership',
      label: 'Change of Ownership',
      description: 'Business has been sold or transferred to new ownership',
    },
    {
      value: 'privacy_concerns',
      label: 'Privacy Concerns',
      description: 'No longer want business information to be publicly listed',
    },
    {
      value: 'other',
      label: 'Other Reason',
      description: 'Please specify your reason in the comments below',
    }
  ];

  // Alert functions
  const showAlert = (type, title, message, duration = 5000) => {
    setAlert({
      isVisible: true,
      type,
      title,
      message,
      duration
    });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isVisible: false }));
  };

  // Fetch business data when Business ID changes
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!formData.businessId.trim()) {
        setBusinessData(null);
        setBusinessNotFound(false);
        return;
      }

      setLoadingBusiness(true);
      setBusinessNotFound(false);

      try {
        const businessCollection = collection(db, 'BusinessList');
        const q = query(businessCollection, where('business_ID', '==', formData.businessId.trim()));
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
      setFormData(prev => ({
        ...prev,
        [name]: value.trim()
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.businessId.trim()) {
      newErrors.businessId = 'Business ID is required';
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
      showAlert('warning', 'Validation Error', 'Please correct the errors before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare removal reason
      const reasonText = formData.reason === 'other' 
        ? formData.customReason.trim() 
        : removalReasons.find(r => r.value === formData.reason)?.label || formData.reason;

      // Prepare removal request data
      const removalRequestData = {
        businessId: formData.businessId.trim(),
        businessName: businessData?.name || 'Unknown',
        businessDocId: businessData?.id || null,
        reason: reasonText,
        reasonCategory: formData.reason,
        additionalComments: formData.additionalComments.trim() || null,
        businessData: businessData,
        requestedAt: new Date(),
        status: 'pending_review',
        reviewedBy: null,
        reviewedAt: null,
        removedAt: null
      };

      // Add to Temporary-Remove-Requests collection
      await addDoc(collection(db, 'Temporary-Remove-Requests'), removalRequestData);

      showAlert(
        'success', 
        'Removal Request Submitted!', 
        `Your removal request for "${businessData?.name || 'your business'}" has been submitted successfully. Our team will review and process your request soon.`,
        6000
      );
      
      // Reset form
      setFormData({
        businessId: '',
        reason: '',
        customReason: '',
        additionalComments: ''
      });
      setBusinessData(null);
      setBusinessNotFound(false);
      
      // Navigate back to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting removal request:', error);
      showAlert('error', 'Submission Failed', `Failed to submit removal request: ${error.message}. Please try again.`, 0);
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
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return colors.mediumGray;
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Business Card Component
  const BusinessCard = ({ business }) => (
    <div style={{
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: `2px solid ${getStatusColor(business.status)}`,
      position: 'relative',
      marginBottom: '2rem'
    }}>
      {/* Status Badge */}
      <div style={{
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        backgroundColor: getStatusColor(business.status),
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {getStatusText(business.status)}
      </div>

      {/* Business Images */}
      {business.imageUrl && business.imageUrl.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <Building2 size={20} color={colors.mediumBlue} />
            <h4 style={{
              color: colors.darkNavy,
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: 0
            }}>
              Business Images ({business.imageUrl.length})
            </h4>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '0.75rem',
            maxHeight: '250px',
            overflowY: 'auto',
            padding: '0.5rem'
          }}>
            {business.imageUrl.slice(0, 8).map((url, index) => (
              <div key={index} style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '12px',
                overflow: 'hidden',
                border: `2px solid ${colors.lightBlue}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <img
                  src={url}
                  alt={`Business image ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ))}
            {business.imageUrl.length > 8 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '1',
                backgroundColor: colors.lightGray,
                borderRadius: '12px',
                fontSize: '0.9rem',
                color: colors.darkNavy,
                fontWeight: '600'
              }}>
                +{business.imageUrl.length - 8}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginTop: '1.5rem'
      }}>
        {/* Left Column */}
        <div>
          <h3 style={{ 
            color: colors.darkNavy, 
            margin: '0 0 1rem 0',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
            {business.name || 'N/A'}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <InfoRow icon={<FileText size={16} />} label="Business ID" value={business.business_ID || 'N/A'} highlight />
            {business.originalTempID && (
              <InfoRow icon={<FileText size={16} />} label="Original Temp ID" value={business.originalTempID} />
            )}
            <InfoRow icon={<Building2 size={16} />} label="Category" value={business.category || 'N/A'} />
            <InfoRow icon={<MapPin size={16} />} label="District" value={business.district || 'N/A'} />
            <InfoRow icon={<MapPin size={16} />} label="Location" value={business.location || 'N/A'} />
          </div>
        </div>
        
        {/* Right Column */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <InfoRow icon={<Phone size={16} />} label="Contact" value={business.contact || 'N/A'} />
            <InfoRow icon={<Phone size={16} />} label="WhatsApp" value={business.whatsapp || 'N/A'} />
            <InfoRow icon={<Globe size={16} />} label="Email" value={business.email || 'N/A'} />
            <InfoRow icon={<Globe size={16} />} label="Website" value={business.website || 'N/A'} />
            {business.status === 'approved' && business.approvedAt && (
              <InfoRow 
                icon={<Calendar size={16} />} 
                label="Approved" 
                value={formatDate(business.approvedAt)} 
                valueColor="#10b981"
              />
            )}
            {business.createdAt && (
              <InfoRow 
                icon={<Calendar size={16} />} 
                label="Created" 
                value={formatDate(business.createdAt)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <MapPin size={16} color={colors.mediumBlue} style={{ marginTop: '0.2rem' }} />
          <div>
            <strong style={{ color: colors.darkNavy }}>Address:</strong>
            <p style={{ margin: '0.25rem 0 0 0', color: colors.mediumGray }}>
              {business.address || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      {business.about && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '10px' }}>
          <strong style={{ color: colors.darkNavy }}>About:</strong>
          <p style={{ margin: '0.5rem 0 0 0', color: colors.mediumGray, lineHeight: '1.6' }}>
            {business.about}
          </p>
        </div>
      )}

      {/* Services Section */}
      {business.Services && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '10px' }}>
          <strong style={{ color: colors.darkNavy }}>Services:</strong>
          <p style={{ margin: '0.5rem 0 0 0', color: colors.mediumGray, lineHeight: '1.6' }}>
            {business.Services}
          </p>
        </div>
      )}

      {/* Products Section */}
      {business.products && business.products.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <Building2 size={20} color={colors.mediumBlue} />
            <h4 style={{
              color: colors.darkNavy,
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: 0
            }}>
              Products ({business.products.length})
            </h4>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {business.products.map((product, index) => (
              <div key={index} style={{
                backgroundColor: '#fafafa',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1rem',
                transition: 'all 0.2s'
              }}>
                {/* Product Image */}
                {product.imageUrl && (
                  <div style={{
                    width: '100%',
                    height: '180px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '0.75rem',
                    backgroundColor: '#f3f4f6'
                  }}>
                    <img
                      src={product.imageUrl}
                      alt={product.name || 'Product'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Product Details */}
                <div>
                  <h5 style={{
                    color: colors.darkNavy,
                    fontSize: '1rem',
                    fontWeight: '600',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {product.name || 'Unnamed Product'}
                  </h5>
                  
                  {product.itemCode && (
                    <p style={{
                      fontSize: '0.85rem',
                      color: colors.mediumGray,
                      margin: '0 0 0.5rem 0'
                    }}>
                      <strong>Item Code:</strong> {product.itemCode}
                    </p>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    {product.newPrice && (
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#10b981'
                      }}>
                        Rs. {product.newPrice}
                      </span>
                    )}
                    {product.oldPrice && (
                      <span style={{
                        fontSize: '0.9rem',
                        color: '#9ca3af',
                        textDecoration: 'line-through'
                      }}>
                        Rs. {product.oldPrice}
                      </span>
                    )}
                  </div>
                  
                  {product.discount && (
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      {product.discount}% OFF
                    </div>
                  )}
                  
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.85rem',
                      color: product.inStock ? '#10b981' : '#ef4444',
                      fontWeight: '600'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: product.inStock ? '#10b981' : '#ef4444'
                      }}></span>
                      {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operating Hours */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Clock size={18} color={colors.mediumBlue} />
          <strong style={{ color: colors.darkNavy, fontSize: '1.05rem' }}>Operating Hours:</strong>
        </div>
        {business.alwaysOpen ? (
          <div style={{ 
            padding: '0.75rem 1rem',
            backgroundColor: '#dcfce7',
            borderRadius: '8px',
            color: '#166534',
            fontWeight: '600'
          }}>
            Always Open (24/7)
          </div>
        ) : business.Operating_Times ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}>
            {Object.entries(business.Operating_Times).map(([day, hours]) => (
              <div key={day} style={{ 
                padding: '0.5rem',
                backgroundColor: hours?.isOpen ? '#f0fdf4' : '#f3f4f6',
                borderRadius: '6px',
                border: `1px solid ${hours?.isOpen ? '#86efac' : '#e5e7eb'}`
              }}>
                <strong style={{ textTransform: 'capitalize' }}>{day}:</strong>{' '}
                {hours && typeof hours === 'object' && hours.isOpen 
                  ? `${hours.openTime || 'N/A'} - ${hours.closeTime || 'N/A'}` 
                  : 'Closed'
                }
              </div>
            ))}
          </div>
        ) : (
          <span style={{ color: colors.mediumGray }}>
            No operating hours specified
          </span>
        )}
      </div>

      {/* Contact Links */}
      {(business.website || business.facebook || business.locationUrl || business.whatsapp) && (
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          flexWrap: 'wrap',
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '2px solid #f3f4f6'
        }}>
          {business.website && (
            <a 
              href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: colors.mediumBlue,
                color: 'white',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <Globe size={16} />
              Website
            </a>
          )}
          {business.facebook && (
            <a 
              href={business.facebook.startsWith('http') ? business.facebook : `https://${business.facebook}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#1877f2',
                color: 'white',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600'
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#34a853',
                color: 'white',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              <MapPin size={16} />
              Location
            </a>
          )}
          {business.whatsapp && (
            <a 
              href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#25d366',
                color: 'white',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              <Phone size={16} />
              WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );

  // Info Row Component
  const InfoRow = ({ icon, label, value, highlight, valueColor }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ color: colors.mediumBlue }}>{icon}</span>
      <span style={{ fontSize: '0.9rem' }}>
        <strong style={{ color: colors.darkNavy }}>{label}:</strong>{' '}
        <span style={{ 
          color: valueColor || (highlight ? colors.mediumBlue : colors.mediumGray),
          fontWeight: highlight ? '600' : '400'
        }}>
          {value}
        </span>
      </span>
    </div>
  );

  return (
    <>
      <AlertNotification
        isVisible={alert.isVisible}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        duration={alert.duration}
        position="top-center"
      />

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .remove-container {
              padding: 1.5rem !important;
            }
            .remove-form {
              padding: 2rem !important;
            }
          }
        `}
      </style>
      
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        padding: '2rem 1rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <h1 style={{
              color: colors.darkNavy,
              fontSize: '2.5rem',
              fontWeight: '700',
              margin: '0 0 0.5rem 0'
            }}>
              Remove Your Business
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Submit a Request to Remove your Business from our Directory
            </p>
          </div>

          {/* Main Form Container */}
          <div className="remove-form" style={{
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
          }}>
            {/* Warning Notice */}
            <div style={{
              backgroundColor: '#fef3c7',
              border: '2px solid #fbbf24',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2.5rem',
              display: 'flex',
              gap: '1rem'
            }}>
              <AlertCircle size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <strong style={{ color: '#92400e', fontSize: '1.05rem', display: 'block', marginBottom: '0.5rem' }}>
                  Important Notice
                </strong>
                <p style={{
                  margin: 0,
                  color: '#92400e',
                  lineHeight: '1.6'
                }}>
                  This action will permanently remove your business from our directory. 
                  Please make sure this is what you want to do, as this action cannot be undone easily. 
                  Our team will review your request before processing the removal.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Business ID Search */}
              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: colors.darkNavy,
                  fontWeight: '600',
                  fontSize: '1.05rem'
                }}>
                  Business ID <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={20} 
                    color={colors.mediumBlue}
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    type="text"
                    name="businessId"
                    value={formData.businessId}
                    onChange={handleInputChange}
                    placeholder="Enter your business ID"
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3rem',
                      border: `2px solid ${errors.businessId ? '#ef4444' : businessData ? '#10b981' : (loadingBusiness ? '#f59e0b' : '#e5e7eb')}`,
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s'
                    }}
                  />
                  {formData.businessId && (
                    <div style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: businessData ? '#10b981' : businessNotFound ? '#ef4444' : (loadingBusiness ? '#f59e0b' : colors.mediumBlue),
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      {loadingBusiness ? (
                        <>
                          <div style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid #f59e0b',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Searching...
                        </>
                      ) : businessData ? (
                        '✓ Found'
                      ) : businessNotFound ? (
                        '✗ Not Found'
                      ) : null}
                    </div>
                  )}
                </div>
                <small style={{
                  color: colors.mediumBlue,
                  fontSize: '0.85rem',
                  marginTop: '0.5rem',
                  display: 'block'
                }}>
                  Find your Business ID in the 'My Businesses' section of the mobile app
                </small>
                {errors.businessId && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    <AlertCircle size={14} />
                    {errors.businessId}
                  </div>
                )}
              </div>

              {/* Business Preview */}
              {businessData && (
                <div style={{ marginBottom: '2.5rem' }}>
                  <h3 style={{
                    color: colors.darkNavy,
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Building2 size={24} color={colors.mediumBlue} />
                    Business to be Removed
                  </h3>
                  <BusinessCard business={businessData} />
                </div>
              )}

              {/* Removal Reasons */}
              {businessData && (
                <div style={{ marginBottom: '2.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '1rem',
                    color: colors.darkNavy,
                    fontWeight: '600',
                    fontSize: '1.05rem'
                  }}>
                    Reason for Removal <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  
                  <div style={{
                    display: 'grid',
                    gap: '0.75rem'
                  }}>
                    {removalReasons.map((reason) => (
                      <div key={reason.value}>
                        <label 
                          style={{
                            display: 'block',
                            padding: '1.25rem',
                            border: `2px solid ${formData.reason === reason.value ? colors.mediumBlue : '#e5e7eb'}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: formData.reason === reason.value ? '#f0f9ff' : 'white'
                          }}
                          onMouseEnter={(e) => {
                            if (formData.reason !== reason.value) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.borderColor = colors.lightBlue;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (formData.reason !== reason.value) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#e5e7eb';
                            }
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '1rem'
                          }}>
                            <input
                              type="radio"
                              name="reason"
                              value={reason.value}
                              checked={formData.reason === reason.value}
                              onChange={handleInputChange}
                              style={{
                                marginTop: '0.2rem',
                                transform: 'scale(1.3)',
                                cursor: 'pointer',
                                accentColor: colors.mediumBlue
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.4rem'
                              }}>
                                <span style={{ fontSize: '1.2rem' }}>{reason.icon}</span>
                                <span style={{
                                  fontWeight: '600',
                                  color: colors.darkNavy,
                                  fontSize: '1rem'
                                }}>
                                  {reason.label}
                                </span>
                              </div>
                              <div style={{
                                color: '#6b7280',
                                fontSize: '0.9rem',
                                lineHeight: '1.5'
                              }}>
                                {reason.description}
                              </div>
                            </div>
                          </div>
                        </label>
                        
                        {/* Custom reason input */}
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
                                border: `2px solid ${errors.customReason ? '#ef4444' : '#e5e7eb'}`,
                                borderRadius: '10px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit'
                              }}
                            />
                            {errors.customReason && (
                              <div style={{
                                color: '#ef4444',
                                fontSize: '0.85rem',
                                marginTop: '0.4rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}>
                                <AlertCircle size={14} />
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
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      marginTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      <AlertCircle size={14} />
                      {errors.reason}
                    </div>
                  )}
                </div>
              )}

              {/* Additional Comments */}
              {businessData && formData.reason && (
                <div style={{ marginBottom: '2.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    color: colors.darkNavy,
                    fontWeight: '600',
                    fontSize: '1.05rem'
                  }}>
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    name="additionalComments"
                    value={formData.additionalComments}
                    onChange={handleInputChange}
                    placeholder="Share any additional information that might help us process your request..."
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: `2px solid #e5e7eb`,
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      lineHeight: '1.6'
                    }}
                  />
                  <small style={{
                    color: '#6b7280',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                    display: 'block'
                  }}>
                    This information will help our team better understand and process your request
                  </small>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                paddingTop: '2rem',
                borderTop: '2px solid #f3f4f6'
              }}>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    padding: '1rem 2rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    color: colors.darkNavy,
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = colors.mediumBlue;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !businessData || !formData.reason}
                  style={{
                    padding: '1rem 2.5rem',
                    border: 'none',
                    borderRadius: '10px',
                    backgroundColor: isSubmitting || !businessData || !formData.reason ? '#d1d5db' : '#dc2626',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isSubmitting || !businessData || !formData.reason ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: isSubmitting || !businessData || !formData.reason ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && businessData && formData.reason) {
                      e.currentTarget.style.backgroundColor = '#b91c1c';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && businessData && formData.reason) {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      Submit Removal Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Section */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f0f9ff',
            borderRadius: '12px',
            border: '1px solid #bae6fd'
          }}>
            <h4 style={{
              color: colors.darkNavy,
              fontSize: '1.05rem',
              fontWeight: '600',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={20} color={colors.mediumBlue} />
              Need Help?
            </h4>
            <p style={{
              color: '#6b7280',
              margin: 0,
              lineHeight: '1.6',
              fontSize: '0.95rem'
            }}>
              If you're having trouble finding your Business ID or need assistance with the removal process, 
              please contact our support team. We're here to help you through the process.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Remove_Business;