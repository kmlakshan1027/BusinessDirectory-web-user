// pages/Add_Business.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs.js';
import { colors } from '../../utils/colors.js';

import BusinessRequestService from '../../services/BusinessRequestService.js';

// Sri Lankan districts list
const DISTRICTS = [
  'Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar',
  'Vavuniya','Mullaitivu','Trincomalee','Batticaloa','Ampara','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla',
  'Monaragala','Ratnapura','Kegalle'
];

// Move FormField component outside of the main component
const FormField = ({ 
  label, 
  type = 'text', 
  field, 
  placeholder, 
  required = false, 
  formData, 
  handleInputChange, 
  categories, 
  locations, 
  categoriesLoading, 
  locationsLoading, 
  districts,
  validationErrors,
  maxLength,
  showWordCount = false
}) => {
  const getWordCount = (text) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

const renderPhoneInput = () => (
  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
    <span style={{
      color: colors.darkNavy,
      fontWeight: '500',
      fontSize: '1rem',
      whiteSpace: 'nowrap',
      marginRight: '0.5rem'
    }}>
      +94
    </span>
    <input
      type="text"
      value={formData[field]}
      onChange={(e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length <= 9) {
          handleInputChange(field, value);
        }
      }}
      placeholder="712345678"
      maxLength="9"
      style={{
        flex: 1,
        padding: '0.8rem 1rem',
        border: `2px solid ${validationErrors?.[field] ? '#ff4444' : colors.lightBlue}`,
        borderRadius: '8px',
        fontSize: '1rem',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        lineHeight: '1.2'
      }}
    />
    <div style={{
      fontSize: '0.8rem',
      color: colors.mediumBlue,
      marginTop: '0.3rem',
      marginLeft:'0.3rem'
    }}>
      {formData[field].length}/9 digits
    </div>
  </div>
);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.7rem',
        color: colors.darkNavy,
        fontWeight: 'bold',
        fontSize: '1rem'
      }}>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      
      {(field === 'contact' || field === 'whatsapp') ? renderPhoneInput() : 
      type === 'textarea' ? (
        <div>
          <textarea
            value={formData[field]}
            onChange={(e) => {
              if (maxLength) {
                const words = getWordCount(e.target.value);
                if (words <= maxLength) {
                  handleInputChange(field, e.target.value);
                }
              } else {
                handleInputChange(field, e.target.value);
              }
            }}
            placeholder={placeholder}
            rows="4"
            style={{
              width: '100%',
              padding: '1rem',
              border: `2px solid ${validationErrors?.[field] ? '#ff4444' : colors.lightBlue}`,
              borderRadius: '8px',
              fontSize: '1rem',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
          {showWordCount && (
            <div style={{
              fontSize: '0.8rem',
              color: getWordCount(formData[field]) > (maxLength * 0.9) ? '#ff6600' : colors.mediumBlue,
              marginTop: '0.3rem',
              textAlign: 'right'
            }}>
              {getWordCount(formData[field])}/{maxLength} words
            </div>
          )}
        </div>
      ) : type === 'select' ? (
        <div>
          <select
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            disabled={(field === 'category' && categoriesLoading) || (field === 'location' && locationsLoading)}
            style={{
              width: '100%',
              padding: '1rem',
              border: `2px solid ${validationErrors?.[field] ? '#ff4444' : colors.lightBlue}`,
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              backgroundColor: ((field === 'category' && categoriesLoading) || (field === 'location' && locationsLoading)) ? '#f0f0f0' : 'white',
              cursor: ((field === 'category' && categoriesLoading) || (field === 'location' && locationsLoading)) ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">
              {field === 'category' && categoriesLoading ? 'Loading categories...' : 
               field === 'location' && locationsLoading ? 'Loading locations...' : 
               `Select ${label}`}
            </option>
            {field === 'category' && categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
            {field === 'category' && (
              <option value="other">Other (Specify below)</option>
            )}
            {field === 'location' && locations.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
            {field === 'location' && (
              <option value="other">Other (Specify below)</option>
            )}
            {field === 'district' && districts.map(district => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          
          {field === 'category' && formData.category === 'other' && (
            <input
              type="text"
              value={formData.customCategory || ''}
              onChange={(e) => handleInputChange('customCategory', e.target.value)}
              placeholder="Please specify your business category"
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${validationErrors?.customCategory ? '#ff4444' : colors.lightBlue}`,
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                marginTop: '0.5rem'
              }}
            />
          )}
          {field === 'location' && formData.location === 'other' && (
            <input
              type="text"
              value={formData.customLocation || ''}
              onChange={(e) => handleInputChange('customLocation', e.target.value)}
              placeholder="Please specify your business location"
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${validationErrors?.customLocation ? '#ff4444' : colors.lightBlue}`,
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                marginTop: '0.5rem'
              }}
            />
          )}
        </div>
      ) : (
        <input
          type={type}
          value={formData[field]}
          onChange={(e) => {
            let value = e.target.value;
            
            // Email validation - only allow simple letters, numbers, @ and .
            if (type === 'email') {
              value = value.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase();
            }
            
            handleInputChange(field, value);
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '1rem',
            border: `2px solid ${validationErrors?.[field] ? '#ff4444' : colors.lightBlue}`,
            borderRadius: '8px',
            fontSize: '1rem',
            boxSizing: 'border-box',
            fontFamily: 'inherit'
          }}
        />
      )}
      
      {validationErrors?.[field] && (
        <div style={{
          color: '#ff4444',
          fontSize: '0.8rem',
          marginTop: '0.3rem'
        }}>
          {validationErrors[field]}
        </div>
      )}
    </div>
  );
};

const AddBusiness = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    about: '',
    contact: '',
    whatsapp: '',
    email: '',
    facebook: '',
    website: '',
    category: '',
    customCategory: '',
    location: '',
    customLocation: '',
    district: '',
    locationUrl: '',
    alwaysOpen: false,
    operatingHours: {
      sunday: { isOpen: false, openTime: '', closeTime: '' },
      monday: { isOpen: false, openTime: '', closeTime: '' },
      tuesday: { isOpen: false, openTime: '', closeTime: '' },
      wednesday: { isOpen: false, openTime: '', closeTime: '' },
      thursday: { isOpen: false, openTime: '', closeTime: '' },
      friday: { isOpen: false, openTime: '', closeTime: '' },
      saturday: { isOpen: false, openTime: '', closeTime: '' }
    }
  });

  const [timeErrors, setTimeErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);

  const daysOfWeek = [
    { key: 'sunday', label: 'Sunday' },
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' }
  ];

  // Validation functions
  const validateForm = () => {
    const errors = {};

    // Required field validation
    if (!formData.name.trim()) errors.name = 'Business name is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.about.trim()) errors.about = 'Business description is required';
    if (!formData.contact.trim()) errors.contact = 'Contact number is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.location) errors.location = 'Location is required';
    if (!formData.district) errors.district = 'District is required';

    // Business name validation
    if (formData.name.trim().length < 2) {
      errors.name = 'Business name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Business name must not exceed 100 characters';
    }

    // Phone number validation (9 digits for Sri Lanka)
    if (formData.contact && formData.contact.length !== 9) {
      errors.contact = 'Contact number must be exactly 9 digits';
    }
    if (formData.whatsapp && formData.whatsapp.length !== 9) {
      errors.whatsapp = 'WhatsApp number must be exactly 9 digits';
    }

    // Email validation
    if (formData.email) {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // About business word limit (200 words)
    const aboutWords = formData.about.trim() === '' ? 0 : formData.about.trim().split(/\s+/).length;
    if (aboutWords > 200) {
      errors.about = 'Business description must not exceed 200 words';
    }

    // Custom category validation
    if (formData.category === 'other' && !formData.customCategory.trim()) {
      errors.customCategory = 'Please specify your business category';
    }

    // Custom location validation
    if (formData.location === 'other' && !formData.customLocation.trim()) {
      errors.customLocation = 'Please specify your business location';
    }

    // URL validation
    const urlRegex = /^https?:\/\/.+/;
    if (formData.website && !urlRegex.test(formData.website)) {
      errors.website = 'Website URL must start with http:// or https://';
    }
    if (formData.facebook && !urlRegex.test(formData.facebook)) {
      errors.facebook = 'Facebook URL must start with http:// or https://';
    }
    if (formData.locationUrl && !urlRegex.test(formData.locationUrl)) {
      errors.locationUrl = 'Location URL must start with http:// or https://';
    }

    // Operating hours validation
    if (!formData.alwaysOpen) {
      const hasOpenDay = Object.values(formData.operatingHours).some(day => day.isOpen);
      if (!hasOpenDay) {
        errors.operatingHours = 'Please select at least one operating day or choose "Always Open"';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        console.log('Fetching categories...');
        const categoryCollection = collection(db, 'Category');
        const categorySnapshot = await getDocs(categoryCollection);
        const categoryList = categorySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        console.log('Categories fetched:', categoryList);
        setCategories(categoryList);
      } catch (error) {
        console.error('Error fetching categories:', error);
        alert('Error loading categories. Please refresh the page.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch locations from Firestore Locations collection
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLocationsLoading(true);
        console.log('Fetching locations...');
        const locationsCollection = collection(db, 'Locations');
        const locationsSnapshot = await getDocs(locationsCollection);
        
        const allLocations = new Set();
        
        locationsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          Object.keys(data).forEach(key => {
            if (key.startsWith('name') && data[key]) {
              allLocations.add(data[key]);
            }
          });
        });
        
        const locationList = Array.from(allLocations).sort();
        console.log('Locations fetched:', locationList);
        setLocations(locationList);
      } catch (error) {
        console.error('Error fetching locations:', error);
        alert('Error loading locations. Please refresh the page.');
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  

  const handleAlwaysOpenToggle = () => {
    setFormData(prev => ({
      ...prev,
      alwaysOpen: !prev.alwaysOpen
    }));
    
    setTimeErrors({});
    // Clear operating hours validation error
    if (validationErrors.operatingHours) {
      setValidationErrors(prev => ({
        ...prev,
        operatingHours: undefined
      }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          isOpen: !prev.operatingHours[day].isOpen,
          openTime: !prev.operatingHours[day].isOpen ? prev.operatingHours[day].openTime : '',
          closeTime: !prev.operatingHours[day].isOpen ? prev.operatingHours[day].closeTime : ''
        }
      }
    }));
    
    setTimeErrors(prev => ({
      ...prev,
      [day]: ''
    }));

    // Clear operating hours validation error
    if (validationErrors.operatingHours) {
      setValidationErrors(prev => ({
        ...prev,
        operatingHours: undefined
      }));
    }
  };

  const handleTimeChange = (day, timeType, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [timeType]: value
        }
      }
    }));

    setTimeErrors(prev => ({
      ...prev,
      [day]: ''
    }));
  };

  const validateTimes = () => {
    if (formData.alwaysOpen) {
      return true;
    }

    const errors = {};
    let hasErrors = false;

    Object.keys(formData.operatingHours).forEach(day => {
      const dayData = formData.operatingHours[day];
      
      if (dayData.isOpen) {
        if (!dayData.openTime) {
          errors[day] = 'Open time is required for open days';
          hasErrors = true;
          return;
        }
        
        if (!dayData.closeTime) {
          errors[day] = 'Close time is required for open days';
          hasErrors = true;
          return;
        }
        
        if (dayData.openTime && dayData.closeTime) {
          const openTime = new Date(`2000-01-01T${dayData.openTime}`);
          const closeTime = new Date(`2000-01-01T${dayData.closeTime}`);
          
          if (closeTime <= openTime) {
            errors[day] = 'Close time must be after open time';
            hasErrors = true;
          }
        }
      }
    });

    setTimeErrors(errors);
    return !hasErrors;
  };

  // Reset form function
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      about: '',
      contact: '',
      whatsapp: '',
      email: '',
      facebook: '',
      website: '',
      category: '',
      customCategory: '',
      location: '',
      customLocation: '',
      district: '',
      locationUrl: '',
      alwaysOpen: false,
      operatingHours: {
        sunday: { isOpen: false, openTime: '', closeTime: '' },
        monday: { isOpen: false, openTime: '', closeTime: '' },
        tuesday: { isOpen: false, openTime: '', closeTime: '' },
        wednesday: { isOpen: false, openTime: '', closeTime: '' },
        thursday: { isOpen: false, openTime: '', closeTime: '' },
        friday: { isOpen: false, openTime: '', closeTime: '' },
        saturday: { isOpen: false, openTime: '', closeTime: '' }
      }
    });
    setTimeErrors({});
    setValidationErrors({});
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('Form submission started');
  
  // Check if Firebase is initialized properly
  if (!db) {
    console.error('Firebase database not initialized');
    alert('Database connection error. Please refresh the page.');
    return;
  }
  
  if (!validateForm() || !validateTimes()) {
    console.log('Validation failed');
    alert('Please correct the errors before submitting.');
    return;
  }

  

  setLoading(true);

  try {
    // Prepare data exactly matching the Firestore fields structure
    const businessData = {
      // Basic information
      about: formData.about ? formData.about.trim() : '',
      address: formData.address ? formData.address.trim() : '',
      category: formData.category === 'other' 
        ? (formData.customCategory ? formData.customCategory.trim() : '') 
        : (formData.category || ''),
      contact: formData.contact ? `+94${formData.contact}` : '',
      district: formData.district || '',
      email: formData.email ? formData.email.toLowerCase().trim() : '',
      facebook: formData.facebook || '',
      location: formData.location === 'other' 
        ? (formData.customLocation ? formData.customLocation.trim() : '') 
        : (formData.location || ''),
      locationUrl: formData.locationUrl || '',
      name: formData.name ? formData.name.trim() : '',
      website: formData.website || '',
      whatsapp: formData.whatsapp ? `+94${formData.whatsapp}` : '',
      
      // Operating information
      alwaysOpen: Boolean(formData.alwaysOpen),
      operatingTimes: formData.alwaysOpen ? null : {
        sunday: {
          isOpen: Boolean(formData.operatingHours.sunday?.isOpen),
          openTime: formData.operatingHours.sunday?.openTime || '',
          closeTime: formData.operatingHours.sunday?.closeTime || ''
        },
        monday: {
          isOpen: Boolean(formData.operatingHours.monday?.isOpen),
          openTime: formData.operatingHours.monday?.openTime || '',
          closeTime: formData.operatingHours.monday?.closeTime || ''
        },
        tuesday: {
          isOpen: Boolean(formData.operatingHours.tuesday?.isOpen),
          openTime: formData.operatingHours.tuesday?.openTime || '',
          closeTime: formData.operatingHours.tuesday?.closeTime || ''
        },
        wednesday: {
          isOpen: Boolean(formData.operatingHours.wednesday?.isOpen),
          openTime: formData.operatingHours.wednesday?.openTime || '',
          closeTime: formData.operatingHours.wednesday?.closeTime || ''
        },
        thursday: {
          isOpen: Boolean(formData.operatingHours.thursday?.isOpen),
          openTime: formData.operatingHours.thursday?.openTime || '',
          closeTime: formData.operatingHours.thursday?.closeTime || ''
        },
        friday: {
          isOpen: Boolean(formData.operatingHours.friday?.isOpen),
          openTime: formData.operatingHours.friday?.openTime || '',
          closeTime: formData.operatingHours.friday?.closeTime || ''
        },
        saturday: {
          isOpen: Boolean(formData.operatingHours.saturday?.isOpen),
          openTime: formData.operatingHours.saturday?.openTime || '',
          closeTime: formData.operatingHours.saturday?.closeTime || ''
        }
      },
      
      
    };

    console.log('Prepared business data for submission:', businessData);

    // Validate the data using BusinessRequestService
    const validation = BusinessRequestService.validateBusinessData(businessData);
    
    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors);
      alert('Please fix the following errors:\n' + validation.errors.join('\n'));
      setLoading(false);
      return;
    }

    console.log('Validation passed, submitting to Firestore...');

    // Submit the business request using BusinessRequestService
    const documentId = await BusinessRequestService.addBusinessRequest(businessData);
    
    console.log('Business request submitted successfully with ID:', documentId);
    alert('Business request submitted successfully for approval!');
    
    // Reset form
    resetForm();
    
  } catch (error) {
    console.error('Error submitting business request:', error);
    
    // More specific error handling
    if (error.code === 'permission-denied') {
      alert('Permission denied. Please check your Firebase security rules.');
    } else if (error.code === 'unavailable') {
      alert('Firebase service is temporarily unavailable. Please try again later.');
    } else {
      alert(`Failed to submit business request: ${error.message}`);
    }
  } finally {
    setLoading(false);
  }
};

  const OperatingHoursSection = () => (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{
        color: colors.darkNavy,
        marginBottom: '1.5rem',
        fontSize: '1.3rem',
        fontWeight: 'bold'
      }}>
        Operating Hours <span style={{ color: 'red' }}>*</span>
      </h3>
      
      {/* Always Open Option */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        border: `2px solid ${formData.alwaysOpen ? colors.mediumBlue : colors.lightBlue}`,
        borderRadius: '8px',
        backgroundColor: formData.alwaysOpen ? '#e8f4ff' : '#f8f9ff'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: colors.darkNavy
        }}>
          <input
            type="checkbox"
            checked={formData.alwaysOpen}
            onChange={handleAlwaysOpenToggle}
            style={{
              marginRight: '0.7rem',
              transform: 'scale(1.3)'
            }}
          />
          Always Open (24/7)
        </label>
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: '0.9rem',
          color: colors.mediumBlue,
          fontStyle: 'italic'
        }}>
          Check this if your business operates 24 hours a day, 7 days a week
        </p>
      </div>

      {/* Day-wise Schedule */}
      <div style={{
        opacity: formData.alwaysOpen ? 0.5 : 1,
        pointerEvents: formData.alwaysOpen ? 'none' : 'auto',
        transition: 'opacity 0.3s ease'
      }}>
        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          {daysOfWeek.map(({ key, label }) => (
            <div key={key} style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 1fr',
              gap: '1rem',
              alignItems: 'center',
              padding: '1rem',
              border: `1px solid ${colors.lightBlue}`,
              borderRadius: '8px',
              backgroundColor: formData.operatingHours[key].isOpen ? '#f8f9ff' : '#f5f5f5'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}>
                <input
                  type="checkbox"
                  checked={formData.operatingHours[key].isOpen}
                  onChange={() => handleDayToggle(key)}
                  disabled={formData.alwaysOpen}
                  style={{
                    marginRight: '0.5rem',
                    transform: 'scale(1.2)'
                  }}
                />
                {label}
              </label>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.3rem',
                  fontSize: '0.9rem',
                  color: colors.darkNavy,
                  fontWeight: '500'
                }}>
                  Open Time
                </label>
                <input
                  type="time"
                  value={formData.operatingHours[key].openTime}
                  onChange={(e) => handleTimeChange(key, 'openTime', e.target.value)}
                  disabled={!formData.operatingHours[key].isOpen || formData.alwaysOpen}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    border: `1px solid ${colors.lightBlue}`,
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    backgroundColor: (formData.operatingHours[key].isOpen && !formData.alwaysOpen) ? 'white' : '#f0f0f0',
                    cursor: (formData.operatingHours[key].isOpen && !formData.alwaysOpen) ? 'pointer' : 'not-allowed'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.3rem',
                  fontSize: '0.9rem',
                  color: colors.darkNavy,
                  fontWeight: '500'
                }}>
                  Close Time
                </label>
                <input
                  type="time"
                  value={formData.operatingHours[key].closeTime}
                  onChange={(e) => handleTimeChange(key, 'closeTime', e.target.value)}
                  disabled={!formData.operatingHours[key].isOpen || formData.alwaysOpen}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    border: `1px solid ${colors.lightBlue}`,
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    backgroundColor: (formData.operatingHours[key].isOpen && !formData.alwaysOpen) ? 'white' : '#f0f0f0',
                    cursor: (formData.operatingHours[key].isOpen && !formData.alwaysOpen) ? 'pointer' : 'not-allowed'
                  }}
                />
              </div>
              
              {timeErrors[key] && !formData.alwaysOpen && (
                <div style={{
                  gridColumn: '2 / 4',
                  color: 'red',
                  fontSize: '0.85rem',
                  marginTop: '0.3rem'
                }}>
                  {timeErrors[key]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Operating hours validation error */}
      {validationErrors.operatingHours && (
        <div style={{
          color: '#ff4444',
          fontSize: '0.9rem',
          marginTop: '1rem',
          padding: '0.5rem',
          backgroundColor: '#ffe6e6',
          borderRadius: '4px',
          border: '1px solid #ff4444'
        }}>
          {validationErrors.operatingHours}
        </div>
      )}
      
      <p style={{
        marginTop: '1rem',
        fontSize: '0.9rem',
        color: colors.mediumBlue,
        fontStyle: 'italic'
      }}>
        * {formData.alwaysOpen 
          ? 'Your business is set to always open (24/7). Uncheck "Always Open" to set specific hours.' 
          : 'Check the days your business is open and set the operating hours. Close time must be after open time.'
        }
      </p>
    </div>
  );

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .form-grid {
              grid-template-columns: 1fr !important;
            }
            .add-business-main {
              padding: 1.5rem !important;
            }
            .form-container {
              padding: 1.5rem !important;
            }
            .operating-hours-row {
              grid-template-columns: 1fr !important;
              gap: 0.5rem !important;
            }
            .operating-hours-row label {
              margin-bottom: 0.5rem;
            }
          }
        `}
      </style>
      
      <main className="add-business-main" style={{
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
            <h2 style={{ 
              color: colors.darkNavy, 
              margin: 0,
              fontSize: '2rem',
              fontWeight: 'bold'
            }}>
              Add New Business
            </h2>
          </div>
          
          <div className="form-container" style={{
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '15px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            width: '100%'
          }}>
            <p style={{ 
              color: colors.mediumBlue, 
              marginBottom: '2.5rem',
              fontSize: '1.1rem',
              lineHeight: '1.6'
            }}>
              Submit your business information for review. All fields marked with * are required.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem',
                marginBottom: '1rem'
              }}>
                <FormField
                  label="Business Name"
                  field="name"
                  placeholder="Enter business name"
                  required
                  formData={formData}
                  handleInputChange={handleInputChange}
                  categories={categories}
                  locations={locations}
                  districts={DISTRICTS}
                  categoriesLoading={categoriesLoading}
                  locationsLoading={locationsLoading}
                  validationErrors={validationErrors}
                />
                <FormField
                  label="Contact Number"
                  field="contact"
                  type="tel"
                  placeholder="712345678"
                  required
                  formData={formData}
                  handleInputChange={handleInputChange}
                  categories={categories}
                  locations={locations}
                  districts={DISTRICTS}
                  categoriesLoading={categoriesLoading}
                  locationsLoading={locationsLoading}
                  validationErrors={validationErrors}
                />
              </div>

              <FormField
                label="Address"
                field="address"
                placeholder="Enter full business address"
                required
                formData={formData}
                handleInputChange={handleInputChange}
                categories={categories}
                locations={locations}
                districts={DISTRICTS}
                categoriesLoading={categoriesLoading}
                locationsLoading={locationsLoading}
                validationErrors={validationErrors}
              />

              <FormField
                label="About Business"
                field="about"
                type="textarea"
                placeholder="Describe your business (maximum 200 words)..."
                required
                formData={formData}
                handleInputChange={handleInputChange}
                categories={categories}
                locations={locations}
                districts={DISTRICTS}
                categoriesLoading={categoriesLoading}
                locationsLoading={locationsLoading}
                validationErrors={validationErrors}
                maxLength={200}
                showWordCount={true}
              />

              <div className="form-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem'
              }}>
                <FormField
                  label="Category"
                  field="category"
                  type="select"
                  required
                  formData={formData}
                  handleInputChange={handleInputChange}
                  categories={categories}
                  locations={locations}
                  districts={DISTRICTS}
                  categoriesLoading={categoriesLoading}
                  locationsLoading={locationsLoading}
                  validationErrors={validationErrors}
                />
                <FormField
                  label="Location"
                  field="location"
                  type="select"
                  required
                  formData={formData}
                  handleInputChange={handleInputChange}
                  categories={categories}
                  locations={locations}
                  districts={DISTRICTS}
                  categoriesLoading={categoriesLoading}
                  locationsLoading={locationsLoading}
                  validationErrors={validationErrors}
                />
              </div>

              {/* District field */}
              <FormField
                label="District"
                field="district"
                type="select"
                required
                formData={formData}
                handleInputChange={handleInputChange}
                categories={categories}
                locations={locations}
                districts={DISTRICTS}
                categoriesLoading={categoriesLoading}
                locationsLoading={locationsLoading}
                validationErrors={validationErrors}
              />

              <OperatingHoursSection />

              <div className="form-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem'
              }}>
                <FormField
                  label="WhatsApp Number"
                  field="whatsapp"
                  type="tel"
                  placeholder="712345678 (optional)"
                  formData={formData}
                  handleInputChange={handleInputChange}
                  categories={categories}
                  locations={locations}
                  districts={DISTRICTS}
                  categoriesLoading={categoriesLoading}
                  locationsLoading={locationsLoading}
                  validationErrors={validationErrors}
                />
                <FormField
                  label="Email"
                  field="email"
                  type="email"
                  placeholder="business@example.com"
                  formData={formData}
                  handleInputChange={handleInputChange}
                  categories={categories}
                  locations={locations}
                  districts={DISTRICTS}
                  categoriesLoading={categoriesLoading}
                  locationsLoading={locationsLoading}
                  validationErrors={validationErrors}
                />
              </div>

              <div className="form-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem'
              }}>
                <FormField
                  label="Facebook Page"
                  field="facebook"
                  type="url"
                  placeholder="https://facebook.com/your-page"
                  formData={formData}
                  handleInputChange={handleInputChange}
                  categories={categories}
                  locations={locations}
                  districts={DISTRICTS}
                  categoriesLoading={categoriesLoading}
                  locationsLoading={locationsLoading}
                  validationErrors={validationErrors}
                />
                <FormField
                  label="Website"
                  field="website"
                  type="url"
                  placeholder="https://your-website.com"
                  formData={formData}
                  handleInputChange={handleInputChange}
                  categories={categories}
                  locations={locations}
                  districts={DISTRICTS}
                  categoriesLoading={categoriesLoading}
                  locationsLoading={locationsLoading}
                  validationErrors={validationErrors}
                />
              </div>

              <FormField
                label="Location URL"
                field="locationUrl"
                type="url"
                placeholder="https://maps.google.com/..."
                formData={formData}
                handleInputChange={handleInputChange}
                categories={categories}
                locations={locations}
                districts={DISTRICTS}
                categoriesLoading={categoriesLoading}
                locationsLoading={locationsLoading}
                validationErrors={validationErrors}
              />

              

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#cccccc' : colors.mediumBlue,
                  color: 'white',
                  border: 'none',
                  padding: '1.2rem 2.5rem',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginTop: '2rem',
                  width: '100%',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => {
                  if (!loading) e.target.style.backgroundColor = colors.lightBlue;
                }}
                onMouseOut={(e) => {
                  if (!loading) e.target.style.backgroundColor = colors.mediumBlue;
                }}
              >
                {loading ? 'Submitting...' : 'Submit Business Request'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
};

export default AddBusiness;