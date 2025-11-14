//Add_Business.js - Modern Multi-Step UI (All Firebase functions preserved)
import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, addDoc, doc } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs.js';
import { colors } from '../../utils/colors.js';
import ImageUpload, { uploadBusinessImages, uploadProductImages } from '../../components/ImageUpload.js';
import AlertNotification from '../../components/AlertNotification.js';
import ProductManager from '../../components/ProductManager.js';
import { Building2, MapPin, Phone, Clock, Image as ImageIcon, ChevronRight, ChevronLeft, Check } from 'lucide-react';

// Sri Lankan districts list
const DISTRICTS = [
  'Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar',
  'Vavuniya','Mullaitivu','Trincomalee','Batticaloa','Ampara','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla',
  'Monaragala','Ratnapura','Kegalle'
];

// FormField component remains the same
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
  showWordCount = false,
  subtext
}) => {
  const getWordCount = (text) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  const renderPhoneInput = () => (
    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
      <span style={{
        padding: '0.875rem',
        backgroundColor: '#f3f4f6',
        border: '2px solid #e5e7eb',
        borderRight: 'none',
        borderRadius: '8px 0 0 8px',
        fontWeight: '600',
        color: colors.darkNavy
      }}>
        +94
      </span>
      <input
        type="text"
        value={formData[field]}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '');
          if (value.length <= 9) {
            handleInputChange(field, value);
          }
        }}
        placeholder="712345678"
        maxLength="9"
        style={{
          flex: 1,
          padding: '0.875rem',
          border: `2px solid ${validationErrors?.[field] ? '#3183B5' : '#e5e7eb'}`,
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          fontSize: '1rem',
          boxSizing: 'border-box',
          fontFamily: 'inherit'
        }}
      />
      <div style={{
        fontSize: '0.8rem',
        color: colors.mediumBlue,
        marginLeft:'0.5rem',
        whiteSpace: 'nowrap'
      }}>
        {formData[field].length}/9
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.5rem',
        color: colors.darkNavy,
        fontWeight: '600',
        fontSize: '1rem'
      }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
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
            rows="5"
            style={{
              width: '100%',
              padding: '0.875rem',
              border: `2px solid ${validationErrors?.[field] ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '1rem',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
          {showWordCount && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              fontSize: '0.85rem',
              color: getWordCount(formData[field]) > (maxLength * 0.9) ? '#f59e0b' : colors.gray,
              marginTop: '0.3rem'
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
              padding: '0.875rem',
              border: `2px solid ${validationErrors?.[field] ? '#ef4444' : '#e5e7eb'}`,
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
                padding: '0.875rem',
                border: `2px solid ${validationErrors?.customCategory ? '#ef4444' : '#e5e7eb'}`,
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
                padding: '0.875rem',
                border: `2px solid ${validationErrors?.customLocation ? '#ef4444' : '#e5e7eb'}`,
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
        <div>
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => {
              let value = e.target.value;
              if (type === 'email') {
                value = value.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase();
              }
              handleInputChange(field, value);
            }}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '0.875rem',
              border: `2px solid ${validationErrors?.[field] ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
          {subtext && (
            <div style={{
              fontSize: '0.85rem',
              color: colors.mediumBlue,
              marginTop: '0.3rem'
            }}>
              {subtext}
            </div>
          )}
        </div>
      )}
      
      {validationErrors?.[field] && (
        <div style={{
          color: '#ef4444',
          fontSize: '0.85rem',
          marginTop: '0.3rem'
        }}>
          {validationErrors[field]}
        </div>
      )}
    </div>
  );
};

const AddBusiness = () => {
  // ALL ORIGINAL STATE - NO CHANGES
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    about: '',
    offeringServices: '',
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

  const [images, setImages] = useState([]);
  const [products, setProducts] = useState([]);
  const [timeErrors, setTimeErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);

  const [alert, setAlert] = useState({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
    duration: 5000
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const steps = [
    { id: 0, label: 'Basic Info', icon: Building2, color: '#3183B5' },
    { id: 1, label: 'Location', icon: MapPin, color: '#3183B5' },
    { id: 2, label: 'Contact', icon: Phone, color: '#3183B5' },
    { id: 3, label: 'Hours', icon: Clock, color: '#3183B5' },
    { id: 4, label: 'Media', icon: ImageIcon, color: '#3183B5' }
  ];

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

  // ALL ORIGINAL FIREBASE FUNCTIONS - NO CHANGES
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

  // ALL ORIGINAL VALIDATION - NO CHANGES
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Business name is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.about.trim()) errors.about = 'Business description is required';
    if (!formData.contact.trim()) errors.contact = 'Contact number is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.locationUrl.trim()) errors.locationUrl = 'Location URL is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.location) errors.location = 'Location is required';
    if (!formData.district) errors.district = 'District is required';
    if (!images || !Array.isArray(images) || images.length === 0) {
      errors.images = 'At least one business image is required';
    }
    if (formData.name.trim().length < 2) {
      errors.name = 'Business name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Business name must not exceed 100 characters';
    }
    if (formData.contact && formData.contact.length !== 9) {
      errors.contact = 'Contact number must be exactly 9 digits';
    }
    if (formData.whatsapp && formData.whatsapp.length !== 9) {
      errors.whatsapp = 'WhatsApp number must be exactly 9 digits';
    }
    if (formData.email) {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    const aboutWords = formData.about.trim() === '' ? 0 : formData.about.trim().split(/\s+/).length;
    if (aboutWords > 200) {
      errors.about = 'Business description must not exceed 200 words';
    }
    const offeringServicesWords = formData.offeringServices.trim() === '' ? 0 : formData.offeringServices.trim().split(/\s+/).length;
    if (offeringServicesWords > 150) {
      errors.offeringServices = 'Offering services must not exceed 150 words';
    }
    if (formData.category === 'other' && !formData.customCategory.trim()) {
      errors.customCategory = 'Please specify your business category';
    }
    if (formData.location === 'other' && !formData.customLocation.trim()) {
      errors.customLocation = 'Please specify your business location';
    }
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
    if (!formData.alwaysOpen) {
      const hasOpenDay = Object.values(formData.operatingHours).some(day => day.isOpen);
      if (!hasOpenDay) {
        errors.operatingHours = 'Please select at least one operating day or choose "Always Open"';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCurrentStep = () => {
    const errors = {};
    const getWordCount = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    
    if (currentStep === 0) {
      if (!formData.name.trim()) errors.name = 'Business name is required';
      if (!formData.category) errors.category = 'Category is required';
      if (formData.category === 'other' && !formData.customCategory.trim()) {
        errors.customCategory = 'Please specify your category';
      }
      if (!formData.about.trim()) errors.about = 'Business description is required';
      const wordCount = getWordCount(formData.about);
      if (wordCount > 200) errors.about = 'Description must not exceed 200 words';

      const offeringServicesWords = getWordCount(formData.offeringServices);
      if (offeringServicesWords > 150) {
        errors.offeringServices = 'Offering services must not exceed 150 words';
      }
    }
    
    if (currentStep === 1) {
      if (!formData.address.trim()) errors.address = 'Address is required';
      if (!formData.location) errors.location = 'Location is required';
      if (formData.location === 'other' && !formData.customLocation.trim()) {
        errors.customLocation = 'Please specify your location';
      }
      if (!formData.district) errors.district = 'District is required';
      if (!formData.locationUrl.trim()) errors.locationUrl = 'Location URL is required';
      if (formData.locationUrl && !/^https?:\/\/.+/.test(formData.locationUrl)) {
        errors.locationUrl = 'URL must start with http:// or https://';
      }
    }
    
    if (currentStep === 2) {
      if (!formData.contact.trim()) errors.contact = 'Contact number is required';
      if (formData.contact && formData.contact.length !== 9) {
        errors.contact = 'Contact must be exactly 9 digits';
      }
      if (!formData.email.trim()) errors.email = 'Email is required';
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
        errors.website = 'Website URL must start with http:// or https://';
      }
      if (formData.facebook && !/^https?:\/\/.+/.test(formData.facebook)) {
        errors.facebook = 'Facebook URL must start with http:// or https://';
      }
    }
    
    if (currentStep === 3) {
      if (!formData.alwaysOpen) {
        const hasOpenDay = Object.values(formData.operatingHours).some(day => day.isOpen);
        if (!hasOpenDay) {
          errors.operatingHours = 'Select at least one operating day or choose "Always Open"';
        }

        const timeErrorsForStep = validateTimes(); // Get errors from validateTimes
        if (Object.keys(timeErrorsForStep).length > 0) {
          // Merge time-specific errors into the main errors object for the step
          // This ensures that if there are time errors, the step validation fails.
          // We can add a generic message or just let the individual time errors be displayed.
          errors.operatingHours = errors.operatingHours || 'Please correct the operating hours for selected days.';
        }
      }
    }
    
    if (currentStep === 4) {
      if (!images || images.length === 0) {
        errors.images = 'At least one business image is required';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      setTimeErrors({}); // Clear any previous time errors
      return {}; // No errors if always open
    }
    const errors = {};
    Object.keys(formData.operatingHours).forEach(day => {
      const dayData = formData.operatingHours[day];
      if (dayData.isOpen) {
        if (!dayData.openTime) {
          errors[day] = 'Open time is required for open days';
        } else if (!dayData.closeTime) {
          errors[day] = 'Close time is required for open days';
        } else if (dayData.openTime && dayData.closeTime) {
          const openTime = new Date(`2000-01-01T${dayData.openTime}`);
          const closeTime = new Date(`2000-01-01T${dayData.closeTime}`);
          if (closeTime <= openTime) {
            errors[day] = 'Close time must be after open time';
          }
        }
      }
    });
    setTimeErrors(errors); // Still set the state for display
    return errors; // Return the errors object
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      about: '',
      offeringServices: '',
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
    setProducts([]);
    setTimeErrors({});
    setValidationErrors({});
    setCurrentStep(0);
  };

  // ORIGINAL SUBMIT HANDLER - NO CHANGES
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION START ===');
    console.log('Images to upload:', images?.length || 0);
    console.log('Products to upload:', products?.length || 0);
    
    if (!db) {
      console.error('Firebase database not initialized');
      showAlert('error', 'Connection Error', 'Database connection error. Please refresh the page.', 0);
      return;
    }
    
    if (!validateForm() || !validateTimes()) {
      console.log('Form validation failed');
      showAlert('warning', 'Validation Error', 'Please correct the errors before submitting.', 6000);
      return;
    }

    setLoading(true);

    try {
      const businessId = `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Business ID:', businessId);
      
      let imageUrls = [];
      
      if (images && Array.isArray(images) && images.length > 0) {
        console.log('Uploading', images.length, 'business images...');
        try {
          const uploadedImageData = await uploadBusinessImages(images, businessId);
          console.log('Business upload result:', uploadedImageData);
          if (uploadedImageData && Array.isArray(uploadedImageData)) {
            imageUrls = uploadedImageData
              .map(img => img?.downloadURL)
              .filter(url => url && typeof url === 'string' && url.trim().length > 0);
            console.log('Extracted business image URLs:', imageUrls);
            if (imageUrls.length === 0) {
              throw new Error('No valid business image URLs were generated');
            }
          } else {
            throw new Error('Business image upload function returned invalid data');
          }
        } catch (imageError) {
          console.error('Business image upload error:', imageError);
          showAlert('error', 'Upload Failed', `Error uploading business images: ${imageError.message}. Please try again.`, 0);
          setLoading(false);
          return;
        }
      } else {
        console.error('No business images provided');
        showAlert('error', 'Images Required', 'At least one business image is required.', 0);
        setLoading(false);
        return;
      }

      console.log('Final business imageUrls for Firestore:', imageUrls);

      let productsWithImages = [];
      if (products.length > 0) {
        console.log('Processing', products.length, 'products with images...');
        for (const product of products) {
          try {
            let productImageUrl = '';
            if (product.image) {
              console.log(`Uploading image for product: ${product.name} (ID: ${product.id})`);
              const productImageData = await uploadProductImages(
                [product.image],
                businessId,
                product.id
              );
              if (productImageData && productImageData.length > 0 && productImageData[0].downloadURL) {
                productImageUrl = productImageData[0].downloadURL;
                console.log(`Product image uploaded successfully:`, productImageUrl);
              } else {
                console.warn(`Failed to get download URL for product: ${product.name}`);
              }
            }
            productsWithImages.push({
              name: product.name,
              itemCode: product.itemCode || '',
              newPrice: product.newPrice || '',
              oldPrice: product.oldPrice || '',
              discount: product.discount || '',
              imageUrl: productImageUrl,
              inStock: product.inStock !== undefined ? product.inStock : true 
            });
          } catch (productError) {
            console.error(`Error uploading image for product ${product.name}:`, productError);
            productsWithImages.push({
              name: product.name,
              itemCode: product.itemCode || '',
              newPrice: product.newPrice || '',
              oldPrice: product.oldPrice || '',
              discount: product.discount || '',
              imageUrl: '',
              inStock: product.inStock !== undefined ? product.inStock : true
            });
          }
        }
        console.log('Products with images processed:', productsWithImages.length);
      }

      const businessData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        about: formData.about.trim(),
        offeringServices: formData.offeringServices.trim(),
        contact: formData.contact ? `+94${formData.contact}` : '',
        whatsapp: formData.whatsapp ? `+94${formData.whatsapp}` : '',
        email: formData.email.toLowerCase().trim(),
        category: formData.category === 'other' 
          ? (formData.customCategory?.trim() || '') 
          : (formData.category || ''),
        location: formData.location === 'other' 
          ? (formData.customLocation?.trim() || '') 
          : (formData.location || ''),
        district: formData.district || '',
        website: formData.website || '',
        facebook: formData.facebook || '',
        locationUrl: formData.locationUrl.trim(),
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
        imageUrl: imageUrls,
        products: productsWithImages,
        businessId: businessId,
        submissionDate: new Date().toISOString(),
        status: 'pending',
        approved: false,
        rejected: false,
        lastUpdated: new Date().toISOString(),
        requestDate: new Date().toISOString()
      };

      console.log('Business data to submit:');
      console.log('- Business imageUrl field exists:', 'imageUrl' in businessData);
      console.log('- Business imageUrl is array:', Array.isArray(businessData.imageUrl));
      console.log('- Business imageUrl length:', businessData.imageUrl?.length || 0);
      console.log('- Business imageUrl content:', businessData.imageUrl);
      console.log('- Products count:', businessData.products?.length || 0);
      console.log('- Products with images:', businessData.products?.filter(p => p.imageUrl).length || 0);

      console.log('Submitting to Temporary-AddBusiness-Requests...');
      const docRef = await addDoc(collection(db, 'Temporary-AddBusiness-Requests'), businessData);
      const documentId = docRef.id;
      
      console.log('Document created successfully:', documentId);
      
      await updateDoc(doc(db, 'Temporary-AddBusiness-Requests', documentId), {
        documentId: documentId
      });
      
      console.log('Document updated with ID reference');
      console.log('=== SUBMISSION SUCCESS ===');
      
      const imageCount = imageUrls.length;
      const productCount = products.length;
      const productsWithImagesCount = productsWithImages.filter(p => p.imageUrl).length;
      
      const successMessage = `Your business "${formData.name}" has been submitted for review and will be published soon. ${imageCount} business image${imageCount > 1 ? 's' : ''} uploaded successfully.${productCount > 0 ? ` ${productCount} product${productCount > 1 ? 's' : ''} added${productsWithImagesCount > 0 ? ` (${productsWithImagesCount} with images)` : ''}.` : ''}`;
      
      showAlert(
        'success', 
        'Business Submitted Successfully!', 
        successMessage,
        6000
      );
      
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

  // STEP NAVIGATION
  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // RENDER FUNCTIONS FOR EACH STEP
  const renderStepIndicator = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '3rem',
      position: 'relative',
      padding: '0 1rem'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '10%',
        right: '10%',
        height: '3px',
        backgroundColor: '#e5e7eb',
        zIndex: 0
      }}>
        <div style={{
          height: '100%',
          backgroundColor: '#3183B5',
          width: `${(currentStep / (steps.length - 1)) * 100}%`,
          transition: 'width 0.3s ease'
        }} />
      </div>

      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        
        return (
          <div key={step.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              backgroundColor: isCompleted ? '#3183B5' : isActive ? step.color : 'white',
              border: `3px solid ${isCompleted ? '#3183B5' : isActive ? step.color : '#e5e7eb'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem',
              transition: 'all 0.3s ease',
              cursor: index < currentStep ? 'pointer' : 'default'
            }}
            onClick={() => index < currentStep && setCurrentStep(index)}
            >
              {isCompleted ? (
                <Check size={20} color="white" strokeWidth={3} />
              ) : (
                <Icon size={20} color={isActive ? 'white' : '#6b7280'} />
              )}
            </div>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: isActive ? '600' : '500',
              color: isActive ? step.color : '#6b7280',
              textAlign: 'center'
            }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderBasicInfo = () => (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: '700',
        color: colors.darkNavy,
        marginBottom: '0.5rem'
      }}>
        Basic Information
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Tell us about your business
      </p>

      <FormField
        label="Business Name"
        field="name"
        placeholder="Ocean View Restaurant"
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
        label="About Your Business"
        field="about"
        type="textarea"
        placeholder="Tell customers about your business, what makes you special..."
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

      <FormField
        label="Offering Services"
        field="offeringServices"
        type="textarea"
        placeholder="List the services you offer, separated by commas or on new lines..."
        formData={formData}
        handleInputChange={handleInputChange}
        categories={categories}
        locations={locations}
        districts={DISTRICTS}
        categoriesLoading={categoriesLoading}
        locationsLoading={locationsLoading}
        validationErrors={validationErrors}
        maxLength={150}
        showWordCount={true}
      />
    </div>
  );

  const renderLocation = () => (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: '700',
        color: colors.darkNavy,
        marginBottom: '0.5rem'
      }}>
        Location Details
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Where can customers find you?
      </p>

      <FormField
        label="Full Address"
        field="address"
        placeholder="123 Main Street, City"
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
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
      </div>

      <FormField
        label="Google Maps URL"
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
        subtext="Share your location's Google Maps link"
      />
    </div>
  );

  const renderContact = () => (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: '700',
        color: colors.darkNavy,
        marginBottom: '0.5rem'
      }}>
        Contact Information
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        How can customers reach you?
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
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
      </div>

      <FormField
        label="Email Address"
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
        subtext="You'll use this email for mobile app login"
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      }}>
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
      </div>
    </div>
  );

  const renderHours = () => (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: '700',
        color: colors.darkNavy,
        marginBottom: '0.5rem'
      }}>
        Operating Hours
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        When are you open for business?
      </p>

      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: formData.alwaysOpen ? '#ecfdf5' : '#f3f4f6',
        border: `2px solid ${formData.alwaysOpen ? '#3183B5' : '#e5e7eb'}`,
        borderRadius: '12px'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '1.1rem',
          color: colors.darkNavy
        }}>
          <input
            type="checkbox"
            checked={formData.alwaysOpen}
            onChange={handleAlwaysOpenToggle}
            style={{
              width: '20px',
              height: '20px',
              marginRight: '1rem',
              cursor: 'pointer'
            }}
          />
          Always Open (24/7)
        </label>
        <p style={{
          marginTop: '0.5rem',
          marginLeft: '2.25rem',
          fontSize: '0.9rem',
          color: '#6b7280'
        }}>
          Check this if your business operates 24 hours a day, 7 days a week
        </p>
      </div>

      {!formData.alwaysOpen && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {daysOfWeek.map(({ key, label }) => (
            <div key={key} style={{
              padding: '1rem',
              backgroundColor: formData.operatingHours[key].isOpen ? '#f0fdf4' : '#f3f4f6',
              border: `2px solid ${formData.operatingHours[key].isOpen ? '#3183B5' : '#e5e7eb'}`,
              borderRadius: '12px',
              transition: 'all 0.2s'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr 1fr',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: colors.darkNavy
                }}>
                  <input
                    type="checkbox"
                    checked={formData.operatingHours[key].isOpen}
                    onChange={() => handleDayToggle(key)}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginRight: '0.75rem',
                      cursor: 'pointer'
                    }}
                  />
                  {label}
                </label>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    color: '#6b7280'
                  }}>
                    Opens
                  </label>
                  <input
                    type="time"
                    value={formData.operatingHours[key].openTime}
                    onChange={(e) => handleTimeChange(key, 'openTime', e.target.value)}
                    disabled={!formData.operatingHours[key].isOpen}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: formData.operatingHours[key].isOpen ? 'white' : '#f3f4f6',
                      cursor: formData.operatingHours[key].isOpen ? 'pointer' : 'not-allowed'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    color: '#6b7280'
                  }}>
                    Closes
                  </label>
                  <input
                    type="time"
                    value={formData.operatingHours[key].closeTime}
                    onChange={(e) => handleTimeChange(key, 'closeTime', e.target.value)}
                    disabled={!formData.operatingHours[key].isOpen}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: formData.operatingHours[key].isOpen ? 'white' : '#f3f4f6',
                      cursor: formData.operatingHours[key].isOpen ? 'pointer' : 'not-allowed'
                    }}
                  />
                </div>
              </div>
              {timeErrors[key] && (
                <div style={{
                  marginTop: '0.5rem',
                  color: '#ef4444',
                  fontSize: '0.85rem'
                }}>
                  {timeErrors[key]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {validationErrors.operatingHours && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          color: '#ef4444',
          fontWeight: '500'
        }}>
          {validationErrors.operatingHours}
        </div>
      )}
    </div>
  );

  const renderMedia = () => (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: '700',
        color: colors.darkNavy,
        marginBottom: '0.5rem'
      }}>
        Images & Products
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Showcase your business with photos and products
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <ImageUpload
          images={images}
          setImages={setImages}
          validationErrors={validationErrors}
          setValidationErrors={setValidationErrors}
        />
      </div>

      <ProductManager
        products={products}
        setProducts={setProducts}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
      />
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderBasicInfo();
      case 1: return renderLocation();
      case 2: return renderContact();
      case 3: return renderHours();
      case 4: return renderMedia();
      default: return null;
    }
  };

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
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @media (max-width: 768px) {
            .step-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        padding: '2rem 1rem'
      }}>
        <div style={{
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#1A365D'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '0.2rem'
            }}>
              Register Your Business
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
              Join our platform in just 5 simple steps
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '2.5rem'
          }}>
            {renderStepIndicator()}
            
            <div style={{ minHeight: '400px' }}>
              {renderCurrentStep()}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '2px solid #e5e7eb'
            }}>
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 2rem',
                  backgroundColor: currentStep === 0 ? '#f3f4f6' : 'white',
                  color: currentStep === 0 ? '#6b7280' : colors.darkNavy,
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 2rem',
                    backgroundColor: '#3183B5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3183B5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3183B5'}
                >
                  Continue
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 2.5rem',
                    backgroundColor: loading ? '#cccccc' : '#3183B5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3183B5')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3183B5')}
                >
                  <Check size={20} />
                  {loading ? 'Submitting...' : 'Submit Business'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddBusiness;