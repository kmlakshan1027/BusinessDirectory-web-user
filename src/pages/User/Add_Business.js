//Add_Business.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, addDoc, doc } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs.js';
import { colors } from '../../utils/colors.js';
import BusinessRequestService from '../../services/BusinessRequestService.js';
import ImageUpload, { uploadBusinessImages } from '../../components/ImageUpload.js';
import AlertNotification from '../../components/AlertNotification.js';

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

  // Add image state
  const [images, setImages] = useState([]);
  const [timeErrors, setTimeErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Alert state
  const [alert, setAlert] = useState({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
    duration: 5000
  });

  const daysOfWeek = [
    { key: 'sunday', label: 'Sunday' },
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' }
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

  // UPDATED VALIDATION FUNCTIONS - Added required validations for images, email, and locationUrl
  const validateForm = () => {
    const errors = {};

    // Required field validation
    if (!formData.name.trim()) errors.name = 'Business name is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.about.trim()) errors.about = 'Business description is required';
    if (!formData.contact.trim()) errors.contact = 'Contact number is required';
    if (!formData.email.trim()) errors.email = 'Email is required'; // NOW REQUIRED
    if (!formData.locationUrl.trim()) errors.locationUrl = 'Location URL is required'; // NOW REQUIRED
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.location) errors.location = 'Location is required';
    if (!formData.district) errors.district = 'District is required';

    // IMAGES VALIDATION - NOW REQUIRED
    if (!images || !Array.isArray(images) || images.length === 0) {
      errors.images = 'At least one business image is required';
    }

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

    // Email validation - NOW REQUIRED
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
    // Location URL validation - NOW REQUIRED
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
        const categoryCollection = collection(db, 'Category');
        const categorySnapshot = await getDocs(categoryCollection);
        const categoryList = categorySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setCategories(categoryList);
      } catch (error) {
        console.error('Error fetching categories:', error);
        showAlert('error', 'Loading Error', 'Error loading categories. Please refresh the page.');
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
        setLocations(locationList);
      } catch (error) {
        console.error('Error fetching locations:', error);
        showAlert('error', 'Loading Error', 'Error loading locations. Please refresh the page.');
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
    setImages([]);
    setTimeErrors({});
    setValidationErrors({});
  };

  // UPDATED SUBMIT HANDLER - Enhanced validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION START ===');
    console.log('Images to upload:', images?.length || 0);
    
    // Check Firebase initialization
    if (!db) {
      console.error('Firebase database not initialized');
      showAlert('error', 'Connection Error', 'Database connection error. Please refresh the page.', 0);
      return;
    }
    
    // Validate form and times
    if (!validateForm() || !validateTimes()) {
      console.log('Form validation failed');
      showAlert('warning', 'Validation Error', 'Please correct the errors before submitting.', 6000);
      return;
    }

    setLoading(true);

    try {
      // Generate unique business ID
      const businessId = `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Business ID:', businessId);
      
      let imageUrls = [];
      
      // Upload images - NOW REQUIRED
      if (images && Array.isArray(images) && images.length > 0) {
        console.log('Uploading', images.length, 'images...');
        
        try {
          // Upload images to Firebase Storage
          const uploadedImageData = await uploadBusinessImages(images, businessId);
          console.log('Upload result:', uploadedImageData);
          
          // Validate and extract download URLs
          if (uploadedImageData && Array.isArray(uploadedImageData)) {
            imageUrls = uploadedImageData
              .map(img => img?.downloadURL)
              .filter(url => url && typeof url === 'string' && url.trim().length > 0);
            
            console.log('Extracted image URLs:', imageUrls);
            
            if (imageUrls.length === 0) {
              throw new Error('No valid image URLs were generated');
            }
          } else {
            throw new Error('Image upload function returned invalid data');
          }
          
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          showAlert('error', 'Upload Failed', `Error uploading images: ${imageError.message}. Please try again.`, 0);
          setLoading(false);
          return;
        }
      } else {
        // This should never happen now since images are required
        console.error('No images provided - this should be caught by validation');
        showAlert('error', 'Images Required', 'At least one business image is required.', 0);
        setLoading(false);
        return;
      }

      console.log('Final imageUrls for Firestore:', imageUrls);

      // Prepare business data for Firestore
      const businessData = {
        // Basic information
        name: formData.name.trim(),
        address: formData.address.trim(),
        about: formData.about.trim(),
        contact: formData.contact ? `+94${formData.contact}` : '',
        whatsapp: formData.whatsapp ? `+94${formData.whatsapp}` : '',
        email: formData.email.toLowerCase().trim(), // NOW REQUIRED
        
        // Business details
        category: formData.category === 'other' 
          ? (formData.customCategory?.trim() || '') 
          : (formData.category || ''),
        location: formData.location === 'other' 
          ? (formData.customLocation?.trim() || '') 
          : (formData.location || ''),
        district: formData.district || '',
        
        // URLs
        website: formData.website || '',
        facebook: formData.facebook || '',
        locationUrl: formData.locationUrl.trim(), // NOW REQUIRED
        
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
        
        // *** CRITICAL: Image URLs field ***
        imageUrl: imageUrls, // This will be an array of image URLs (now guaranteed to have at least one)
        
        // Metadata
        businessId: businessId,
        submissionDate: new Date().toISOString(),
        status: 'pending',
        approved: false,
        rejected: false,
        lastUpdated: new Date().toISOString(),
        requestDate: new Date().toISOString()
      };

      console.log('Business data to submit:');
      console.log('- imageUrl field exists:', 'imageUrl' in businessData);
      console.log('- imageUrl is array:', Array.isArray(businessData.imageUrl));
      console.log('- imageUrl length:', businessData.imageUrl?.length || 0);
      console.log('- imageUrl content:', businessData.imageUrl);

      // Submit to Firestore
      console.log('Submitting to TemporaryBusinessDetails...');
      const docRef = await addDoc(collection(db, 'TemporaryBusinessDetails'), businessData);
      const documentId = docRef.id;
      
      console.log('Document created successfully:', documentId);
      
      // Update document with its own ID for reference
      await updateDoc(doc(db, 'TemporaryBusinessDetails', documentId), {
        documentId: documentId
      });
      
      console.log('Document updated with ID reference');
      console.log('=== SUBMISSION SUCCESS ===');
      
      // Success alert
      const imageCount = imageUrls.length;
      showAlert(
        'success', 
        'Business Submitted Successfully!', 
        `Your business "${formData.name}" has been submitted for review and will be published soon. ${imageCount} image${imageCount > 1 ? 's' : ''} uploaded successfully.`,
        6000
      );
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('=== SUBMISSION ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      showAlert(
        'error',
        'Submission Failed',
        `Failed to submit business request: ${error.message}. Please try again or contact support if the problem persists.`,
        0
      );
    } finally {
      setLoading(false);
      console.log('=== FORM SUBMISSION END ===');
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
      {/* Alert Notification */}
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

              {/* Image Upload Section - NOW REQUIRED */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.7rem',
                  color: colors.darkNavy,
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  Business Images <span style={{ color: 'red' }}>*</span>
                </label>
                <ImageUpload
                  images={images}
                  setImages={setImages}
                  validationErrors={validationErrors}
                  setValidationErrors={setValidationErrors}
                />
                {validationErrors?.images && (
                  <div style={{
                    color: '#ff4444',
                    fontSize: '0.8rem',
                    marginTop: '0.3rem'
                  }}>
                    {validationErrors.images}
                  </div>
                )}
              </div>

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