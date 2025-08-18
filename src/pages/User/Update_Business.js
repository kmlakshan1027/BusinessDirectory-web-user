// pages/Update_Business.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs.js';
import { colors } from '../../utils/colors.js';

const Update_Business = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessId: '',
    fieldToUpdate: '',
    // Dynamic form fields
    newBusinessName: '',
    newAbout: '',
    newAddress: '',
    newContact: '',
    newWhatsApp: '',
    newEmail: '',
    newFacebook: '',
    newWebsite: '',
    newLocationUrl: '',
    newCategory: '',
    customCategory: '',
    newLocation: '',
    customLocation: '',
    newDistrict: '',
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [businessData, setBusinessData] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [businessNotFound, setBusinessNotFound] = useState(false);
  const [timeErrors, setTimeErrors] = useState({});
  
  // Data fetching states
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const fieldOptions = [
    'Business Name',
    'About/Description',
    'Address',
    'Contact Number',
    'WhatsApp Number',
    'Email',
    'Category',
    'Location',
    'District',
    'Facebook Page',
    'Website',
    'Location URL',
    'Operating Hours',
    'Other'
  ];

  const daysOfWeek = [
    { key: 'sunday', label: 'Sunday' },
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' }
  ];

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      if (formData.fieldToUpdate === 'Category') {
        try {
          setCategoriesLoading(true);
          const categoryCollection = collection(db, 'Category');
          const categorySnapshot = await getDocs(categoryCollection);
          const categoryList = categorySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
          }));
          setCategories(categoryList);
        } catch (error) {
          console.error('Error fetching categories:', error);
        } finally {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();
  }, [formData.fieldToUpdate]);

  // Fetch locations and districts from Firestore
  useEffect(() => {
    const fetchLocationsAndDistricts = async () => {
      if (formData.fieldToUpdate === 'Location' || formData.fieldToUpdate === 'District') {
        try {
          setLocationsLoading(true);
          const locationsCollection = collection(db, 'Locations');
          const locationsSnapshot = await getDocs(locationsCollection);
          
          const allLocations = new Set();
          const allDistricts = new Set();
          
          locationsSnapshot.docs.forEach(doc => {
            // District names are document IDs
            allDistricts.add(doc.id);
            
            // Location names are in the document data
            const data = doc.data();
            Object.keys(data).forEach(key => {
              if (key.startsWith('name') && data[key]) {
                allLocations.add(data[key]);
              }
            });
          });
          
          setLocations(Array.from(allLocations).sort());
          setDistricts(Array.from(allDistricts).sort());
        } catch (error) {
          console.error('Error fetching locations:', error);
        } finally {
          setLocationsLoading(false);
        }
      }
    };

    fetchLocationsAndDistricts();
  }, [formData.fieldToUpdate]);

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
          
          // Pre-populate operating hours if updating operating hours
          if (formData.fieldToUpdate === 'Operating Hours' && data.operatingTimes) {
            setFormData(prev => ({
              ...prev,
              alwaysOpen: data.alwaysOpen || false,
              operatingHours: {
                sunday: data.operatingTimes.sunday || { isOpen: false, openTime: '', closeTime: '' },
                monday: data.operatingTimes.monday || { isOpen: false, openTime: '', closeTime: '' },
                tuesday: data.operatingTimes.tuesday || { isOpen: false, openTime: '', closeTime: '' },
                wednesday: data.operatingTimes.wednesday || { isOpen: false, openTime: '', closeTime: '' },
                thursday: data.operatingTimes.thursday || { isOpen: false, openTime: '', closeTime: '' },
                friday: data.operatingTimes.friday || { isOpen: false, openTime: '', closeTime: '' },
                saturday: data.operatingTimes.saturday || { isOpen: false, openTime: '', closeTime: '' }
              }
            }));
          }
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
  }, [formData.businessId, formData.fieldToUpdate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'businessId') {
      const upperValue = value.toUpperCase();
      setFormData(prev => ({
        ...prev,
        [name]: upperValue
      }));
    } else if (name === 'newContact' || name === 'newWhatsApp') {
      // Handle phone numbers - only allow 9 digits
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 9) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
    } else if (name === 'newEmail') {
      // Email validation - only allow simple letters, numbers, @ and .
      const emailValue = value.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase();
      setFormData(prev => ({
        ...prev,
        [name]: emailValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  

  // Operating hours handlers
  const handleAlwaysOpenToggle = () => {
    setFormData(prev => ({
      ...prev,
      alwaysOpen: !prev.alwaysOpen
    }));
    setTimeErrors({});
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
    
    if (!formData.fieldToUpdate) {
      newErrors.fieldToUpdate = 'Please select a field to update';
    }

    // Validate specific fields based on fieldToUpdate
    if (formData.fieldToUpdate && formData.fieldToUpdate !== 'Other') {
      switch (formData.fieldToUpdate) {
        case 'Business Name':
          if (!formData.newBusinessName.trim()) {
            newErrors.newBusinessName = 'New business name is required';
          } else if (formData.newBusinessName.trim().length < 2) {
            newErrors.newBusinessName = 'Business name must be at least 2 characters';
          }
          break;

        case 'About/Description':
          if (!formData.newAbout.trim()) {
            newErrors.newAbout = 'New description is required';
          } else {
            const wordCount = formData.newAbout.trim().split(/\s+/).length;
            if (wordCount > 200) {
              newErrors.newAbout = 'Description must not exceed 200 words';
            }
          }
          break;

        case 'Address':
          if (!formData.newAddress.trim()) {
            newErrors.newAddress = 'New address is required';
          }
          break;

        case 'Contact Number':
          if (!formData.newContact.trim()) {
            newErrors.newContact = 'New contact number is required';
          } else if (formData.newContact.length !== 9) {
            newErrors.newContact = 'Contact number must be exactly 9 digits';
          }
          break;

        case 'WhatsApp Number':
          if (!formData.newWhatsApp.trim()) {
            newErrors.newWhatsApp = 'New WhatsApp number is required';
          } else if (formData.newWhatsApp.length !== 9) {
            newErrors.newWhatsApp = 'WhatsApp number must be exactly 9 digits';
          }
          break;

        case 'Email':
          if (!formData.newEmail.trim()) {
            newErrors.newEmail = 'New email is required';
          } else {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(formData.newEmail)) {
              newErrors.newEmail = 'Please enter a valid email address';
            }
          }
          break;

        case 'Category':
          if (!formData.newCategory) {
            newErrors.newCategory = 'Please select a new category';
          } else if (formData.newCategory === 'other' && !formData.customCategory.trim()) {
            newErrors.customCategory = 'Please specify your business category';
          }
          break;

        case 'Location':
          if (!formData.newLocation) {
            newErrors.newLocation = 'Please select a new location';
          } else if (formData.newLocation === 'other' && !formData.customLocation.trim()) {
            newErrors.customLocation = 'Please specify your business location';
          }
          if (!formData.newDistrict) {
            newErrors.newDistrict = 'Please select a district';
          }
          break;

        case 'District':
          if (!formData.newDistrict) {
            newErrors.newDistrict = 'Please select a new district';
          }
          break;

        case 'Facebook Page':
          if (!formData.newFacebook.trim()) {
            newErrors.newFacebook = 'New Facebook page URL is required';
          } else {
            const urlRegex = /^https?:\/\/.+/;
            if (!urlRegex.test(formData.newFacebook)) {
              newErrors.newFacebook = 'Facebook URL must start with http:// or https://';
            }
          }
          break;

        case 'Website':
          if (!formData.newWebsite.trim()) {
            newErrors.newWebsite = 'New website URL is required';
          } else {
            const urlRegex = /^https?:\/\/.+/;
            if (!urlRegex.test(formData.newWebsite)) {
              newErrors.newWebsite = 'Website URL must start with http:// or https://';
            }
          }
          break;

        case 'Location URL':
          if (!formData.newLocationUrl.trim()) {
            newErrors.newLocationUrl = 'New location URL is required';
          } else {
            const urlRegex = /^https?:\/\/.+/;
            if (!urlRegex.test(formData.newLocationUrl)) {
              newErrors.newLocationUrl = 'Location URL must start with http:// or https://';
            }
          }
          break;

        case 'Operating Hours':
          if (!formData.alwaysOpen) {
            const hasOpenDay = Object.values(formData.operatingHours).some(day => day.isOpen);
            if (!hasOpenDay) {
              newErrors.operatingHours = 'Please select at least one operating day or choose "Always Open"';
            }
          }
          break;

        
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getWordCount = (text) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Validate operating hours if updating operating hours
    if (formData.fieldToUpdate === 'Operating Hours' && !validateTimes()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the new value based on field type
      let newValue = '';
      
      switch (formData.fieldToUpdate) {
        case 'Business Name':
          newValue = formData.newBusinessName.trim();
          break;
        case 'About/Description':
          newValue = formData.newAbout.trim();
          break;
        case 'Address':
          newValue = formData.newAddress.trim();
          break;
        case 'Contact Number':
          newValue = `+94${formData.newContact}`;
          break;
        case 'WhatsApp Number':
          newValue = `+94${formData.newWhatsApp}`;
          break;
        case 'Email':
          newValue = formData.newEmail.toLowerCase();
          break;
        case 'Category':
          newValue = formData.newCategory === 'other' ? formData.customCategory.trim() : formData.newCategory;
          break;
        case 'Location':
          newValue = JSON.stringify({
            location: formData.newLocation === 'other' ? formData.customLocation.trim() : formData.newLocation,
            district: formData.newDistrict
          });
          break;
        case 'District':
          newValue = formData.newDistrict;
          break;
        case 'Facebook Page':
          newValue = formData.newFacebook;
          break;
        case 'Website':
          newValue = formData.newWebsite;
          break;
        case 'Location URL':
          newValue = formData.newLocationUrl;
          break;
        case 'Operating Hours':
          newValue = JSON.stringify({
            alwaysOpen: formData.alwaysOpen,
            operatingTimes: formData.alwaysOpen ? null : formData.operatingHours
          });
          break;
        
        default:
          newValue = 'See description for details';
      }

      // Add to Temporary_Update_Business collection for review
      await addDoc(collection(db, 'Temporary_Update_Business'), {
        businessId: formData.businessId.trim(),
        businessName: businessData?.name || 'Unknown',
        fieldToUpdate: formData.fieldToUpdate,
        currentValue: getCurrentValue(),
        newValue: newValue,
        requestedAt: new Date(),
        status: 'pending_review',
        reviewedBy: null,
        reviewedAt: null
      });

      alert('Update request submitted successfully! Your request will be reviewed and processed soon.');
      
      // Reset form
      setFormData({
        businessId: '',
        fieldToUpdate: '',
        newBusinessName: '',
        newAbout: '',
        newAddress: '',
        newContact: '',
        newWhatsApp: '',
        newEmail: '',
        newFacebook: '',
        newWebsite: '',
        newLocationUrl: '',
        newCategory: '',
        customCategory: '',
        newLocation: '',
        customLocation: '',
        newDistrict: '',
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
      setBusinessData(null);
      setBusinessNotFound(false);
      setTimeErrors({});
      
      // Navigate back to home
      navigate('/');
      
    } catch (error) {
      console.error('Error submitting update request:', error);
      alert('Failed to submit update request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentValue = () => {
    if (!businessData) return 'N/A';
    
    switch (formData.fieldToUpdate) {
      case 'Business Name': return businessData.name || 'N/A';
      case 'About/Description': return businessData.about || 'N/A';
      case 'Address': return businessData.address || 'N/A';
      case 'Contact Number': return businessData.contact || 'N/A';
      case 'WhatsApp Number': return businessData.whatsapp || 'N/A';
      case 'Email': return businessData.email || 'N/A';
      case 'Category': return businessData.category || 'N/A';
      case 'Location': return businessData.location || 'N/A';
      case 'District': return businessData.district || 'N/A';
      case 'Facebook Page': return businessData.facebook || 'N/A';
      case 'Website': return businessData.website || 'N/A';
      case 'Location URL': return businessData.locationUrl || 'N/A';
      case 'Operating Hours': return JSON.stringify({
        alwaysOpen: businessData.alwaysOpen || false,
        operatingTimes: businessData.operatingTimes || null
      });
      
      default: return 'N/A';
    }
  };

  const getCharacterCount = (text) => {
    return text.length;
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

  // Dynamic form field renderer
  const renderDynamicField = () => {
    if (!formData.fieldToUpdate || formData.fieldToUpdate === 'Other') {
      return null;
    }

    switch (formData.fieldToUpdate) {
      case 'Business Name':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.7rem',
              color: colors.darkNavy,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              New Business Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              name="newBusinessName"
              value={formData.newBusinessName}
              onChange={handleInputChange}
              placeholder="Enter new business name"
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${errors.newBusinessName ? '#ff4444' : colors.lightBlue}`,
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
            {errors.newBusinessName && (
              <div style={{
                color: '#ff4444',
                fontSize: '0.8rem',
                marginTop: '0.3rem'
              }}>
                {errors.newBusinessName}
              </div>
            )}
          </div>
        );

      case 'About/Description':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.7rem',
              color: colors.darkNavy,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              New Description <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              name="newAbout"
              value={formData.newAbout}
              onChange={handleInputChange}
              placeholder="Enter new business description"
              rows={6}
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${errors.newAbout ? '#ff4444' : colors.lightBlue}`,
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box'
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
                Maximum 200 words
              </small>
              <div style={{
                fontSize: '0.8rem',
                color: getWordCount(formData.newAbout) > 180 ? '#ff6600' : colors.mediumBlue
              }}>
                {getWordCount(formData.newAbout)}/200 words
              </div>
            </div>
            {errors.newAbout && (
              <div style={{
                color: '#ff4444',
                fontSize: '0.8rem',
                marginTop: '0.3rem'
              }}>
                {errors.newAbout}
              </div>
            )}
          </div>
        );

      case 'Address':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.7rem',
              color: colors.darkNavy,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              New Address <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              name="newAddress"
              value={formData.newAddress}
              onChange={handleInputChange}
              placeholder="Enter new business address"
              rows={3}
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${errors.newAddress ? '#ff4444' : colors.lightBlue}`,
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
            {errors.newAddress && (
              <div style={{
                color: '#ff4444',
                fontSize: '0.8rem',
                marginTop: '0.3rem'
              }}>
                {errors.newAddress}
              </div>
            )}
          </div>
        );

      case 'Contact Number':
      case 'WhatsApp Number':
        const fieldName = formData.fieldToUpdate === 'Contact Number' ? 'newContact' : 'newWhatsApp';
        const errorField = formData.fieldToUpdate === 'Contact Number' ? 'newContact' : 'newWhatsApp';
        return (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.7rem',
              color: colors.darkNavy,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              New {formData.fieldToUpdate} <span style={{ color: 'red' }}>*</span>
            </label>
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
                name={fieldName}
                value={formData[fieldName]}
                onChange={handleInputChange}
                placeholder="712345678"
                maxLength="9"
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: `2px solid ${errors[errorField] ? '#ff4444' : colors.lightBlue}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{
                fontSize: '0.8rem',
                color: colors.mediumBlue,
                marginLeft: '0.5rem'
              }}>
                {formData[fieldName].length}/9 digits
              </div>
            </div>
            {errors[errorField] && (
              <div style={{
                color: '#ff4444',
                fontSize: '0.8rem',
                marginTop: '0.3rem'
              }}>
                {errors[errorField]}
              </div>
            )}
          </div>
        );

      case 'Email':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.7rem',
              color: colors.darkNavy,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              New Email <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="email"
              name="newEmail"
              value={formData.newEmail}
              onChange={handleInputChange}
              placeholder="business@example.com"
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${errors.newEmail ? '#ff4444' : colors.lightBlue}`,
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
            {errors.newEmail && (
              <div style={{
                color: '#ff4444',
                fontSize: '0.8rem',
                marginTop: '0.3rem'
              }}>
                {errors.newEmail}
              </div>
            )}
          </div>
        );

      case 'Category':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.7rem',
              color: colors.darkNavy,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              New Category <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="newCategory"
              value={formData.newCategory}
              onChange={handleInputChange}
              disabled={categoriesLoading}
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${errors.newCategory ? '#ff4444' : colors.lightBlue}`,
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                backgroundColor: categoriesLoading ? '#f0f0f0' : 'white',
                boxSizing: 'border-box',
                cursor: categoriesLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">
                {categoriesLoading ? 'Loading categories...' : 'Select new category'}
              </option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
              <option value="other">Other (Specify below)</option>
            </select>
            
            {formData.newCategory === 'other' && (
              <input
                type="text"
                name="customCategory"
                value={formData.customCategory}
                onChange={handleInputChange}
                placeholder="Please specify your business category"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: `2px solid ${errors.customCategory ? '#ff4444' : colors.lightBlue}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  marginTop: '0.5rem'
                }}
              />
            )}
            
            {errors.newCategory && (
              <div style={{
                color: '#ff4444',
                fontSize: '0.8rem',
                marginTop: '0.3rem'
              }}>
                {errors.newCategory}
              </div>
            )}
            {errors.customCategory && (
              <div style={{
                color: '#ff4444',
                fontSize: '0.8rem',
                marginTop: '0.3rem'
              }}>
                {errors.customCategory}
              </div>
            )}
          </div>
        );

      case 'Location':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <div className="form-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.7rem',
                  color: colors.darkNavy,
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  New Location <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  name="newLocation"
                  value={formData.newLocation}
                  onChange={handleInputChange}
                  disabled={locationsLoading}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: `2px solid ${errors.newLocation ? '#ff4444' : colors.lightBlue}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    backgroundColor: locationsLoading ? '#f0f0f0' : 'white',
                    boxSizing: 'border-box',
                    cursor: locationsLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">
                    {locationsLoading ? 'Loading locations...' : 'Select new location'}
                  </option>
                  {locations.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                  <option value="other">Other (Specify below)</option>
                </select>
                
                {formData.newLocation === 'other' && (
                  <input
                    type="text"
                    name="customLocation"
                    value={formData.customLocation}
                    onChange={handleInputChange}
                    placeholder="Please specify your business location"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: `2px solid ${errors.customLocation ? '#ff4444' : colors.lightBlue}`,
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      marginTop: '0.5rem'
                    }}
                  />
                )}
                
                {errors.newLocation && (
                  <div style={{
                    color: '#ff4444',
                    fontSize: '0.8rem',
                    marginTop: '0.3rem'
                  }}>
                    {errors.newLocation}
                  </div>
                )}
                {errors.customLocation && (
                  <div style={{
                    color: '#ff4444',
                    fontSize: '0.8rem',
                    marginTop: '0.3rem'
                  }}>
                    {errors.customLocation}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.7rem',
                  color: colors.darkNavy,
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  New District <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  name="newDistrict"
                  value={formData.newDistrict}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: `2px solid ${errors.newDistrict ? '#ff4444' : colors.lightBlue}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    backgroundColor: 'white',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select district</option>
                  {districts.map(district => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                
                {errors.newDistrict && (
                  <div style={{
                    color: '#ff4444',
                    fontSize: '0.8rem',
                    marginTop: '0.3rem'
                  }}>
                    {errors.newDistrict}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'District':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.7rem',
              color: colors.darkNavy,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              New District <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="newDistrict"
              value={formData.newDistrict}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${errors.newDistrict ? '#ff4444' : colors.lightBlue}`,
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="">Select new district</option>
              {districts.map(district => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            
            {errors.newDistrict && (
              <div style={{
                color: '#ff4444',
                fontSize: '0.8rem',
                marginTop: '0.3rem'
              }}>
                {errors.newDistrict}
              </div>
            )}
          </div>
        );

      case 'Facebook Page':
      case 'Website':
      case 'Location URL':
        const urlFieldName = formData.fieldToUpdate === 'Facebook Page' ? 'newFacebook' : 
                            formData.fieldToUpdate === 'Website' ? 'newWebsite' : 'newLocationUrl';
        const urlErrorField = formData.fieldToUpdate === 'Facebook Page' ? 'newFacebook' : 
                             formData.fieldToUpdate === 'Website' ? 'newWebsite' : 'newLocationUrl';
        const placeholder = formData.fieldToUpdate === 'Facebook Page' ? 'https://facebook.com/your-page' :
                           formData.fieldToUpdate === 'Website' ? 'https://your-website.com' :
                           'https://maps.google.com/...';
        
        return (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.7rem',
              color: colors.darkNavy,
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              New {formData.fieldToUpdate} <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="url"
              name={urlFieldName}
              value={formData[urlFieldName]}
              onChange={handleInputChange}
              placeholder={placeholder}
              style={{
                width: '100%',
                padding: '1rem',
                border: `2px solid ${errors[urlErrorField] ? '#ff4444' : colors.lightBlue}`,
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
            {errors[urlErrorField] && (
              <div style={{
                color: '#ff4444',
                fontSize: '0.8rem',
                marginTop: '0.3rem'
              }}>
                {errors[urlErrorField]}
              </div>
            )}
          </div>
        );

      case 'Operating Hours':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              color: colors.darkNavy,
              marginBottom: '1.5rem',
              fontSize: '1.3rem',
              fontWeight: 'bold'
            }}>
              New Operating Hours <span style={{ color: 'red' }}>*</span>
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
            {errors.operatingHours && (
              <div style={{
                color: '#ff4444',
                fontSize: '0.9rem',
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#ffe6e6',
                borderRadius: '4px',
                border: '1px solid #ff4444'
              }}>
                {errors.operatingHours}
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

      

      default:
        return null;
    }
  };

  // Business Card Component (same as original)
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
        gridTemplateColumns: '1fr',
        gap: '1.5rem',
        marginBottom: '1rem'
      }}>
        

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
            .update-main {
              padding: 1.5rem !important;
            }
            .form-container {
              padding: 1.5rem !important;
            }
            .update-title {
              font-size: 1.8rem !important;
            }
            .form-actions {
              flex-direction: column !important;
              gap: 1rem !important;
            }
            .form-actions button {
              width: 100% !important;
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
      
      <main className="update-main" style={{
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
            <h1 className="update-title" style={{
              color: colors.darkNavy,
              fontSize: '2rem',
              fontWeight: 'bold',
              margin: 0
            }}>
              Update Your Business
            </h1>
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
              lineHeight: '1.6',
              fontSize: '1.1rem'
            }}>
              Please provide your business ID and select the field you want to update. Our team will review your request and update your business information accordingly.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem',
                marginBottom: '1.5rem'
              }}>
                <div>
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

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.7rem',
                    color: colors.darkNavy,
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    Field to Update <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    name="fieldToUpdate"
                    value={formData.fieldToUpdate}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: `2px solid ${errors.fieldToUpdate ? '#ff4444' : colors.lightBlue}`,
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      backgroundColor: 'white',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select field to update</option>
                    {fieldOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.fieldToUpdate && (
                    <div style={{
                      color: '#ff4444',
                      fontSize: '0.8rem',
                      marginTop: '0.3rem'
                    }}>
                      {errors.fieldToUpdate}
                    </div>
                  )}
                </div>
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
                    📋 Current Business Information
                  </h3>
                  <BusinessCard business={businessData} />
                </div>
              )}

              {/* Dynamic form field based on selection */}
              {renderDynamicField()}

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
                  disabled={isSubmitting || !businessData}
                  style={{
                    padding: '1rem 2rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: isSubmitting || !businessData ? colors.mediumGray : colors.darkNavy,
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: isSubmitting || !businessData ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
};

export default Update_Business;
