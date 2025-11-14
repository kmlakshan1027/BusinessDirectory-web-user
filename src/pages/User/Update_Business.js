// pages/Update_Business.js - Enhanced with Products Section
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs.js';
import { colors } from '../../utils/colors.js';
import ImageUpload, { uploadBusinessImages } from '../../components/ImageUpload.js';
import ProductsUpdateSection from '../../components/ProductsUpdateSection.js';
import AlertNotification from '../../components/AlertNotification.js';
import { Building2, Search, Edit3, CheckCircle, XCircle, Loader } from 'lucide-react';

const FormField = ({ label, children, error, required = true }) => (
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
    {children}
    {error && (
      <div style={{
        color: '#ef4444',
        fontSize: '0.85rem',
        marginTop: '0.3rem'
      }}>
        {error}
      </div>
    )}
  </div>
);

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '0.875rem',
  border: `2px solid ${hasError ? '#ef4444' : '#e5e7eb'}`,
  borderRadius: '8px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
});

const Update_Business = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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
    newServices: '',
    otherDescription: '',
    Always_Open: false,
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
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);
  
  // Products state
  const [products, setProducts] = useState([]);
  const [productsValidationError, setProductsValidationError] = useState('');

  const [alert, setAlert] = useState({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
    duration: 5000
  });

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
    'Services',
    'Business Images',
    'Products',
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

  // Handle products change
  const handleProductsChange = (updatedProducts) => {
    setProducts(updatedProducts);
    setProductsValidationError('');
  };

  // ALL ORIGINAL FIREBASE FUNCTIONS - PRESERVED
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
          showAlert('error', 'Loading Error', 'Error loading categories. Please try again.');
        } finally {
          setCategoriesLoading(false);
        }
      }
    };
    fetchCategories();
  }, [formData.fieldToUpdate]);

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
            allDistricts.add(doc.id);
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
          showAlert('error', 'Loading Error', 'Error loading locations. Please try again.');
        } finally {
          setLocationsLoading(false);
        }
      }
    };
    fetchLocationsAndDistricts();
  }, [formData.fieldToUpdate]);

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
          
          if (formData.fieldToUpdate === 'Operating Hours') {
            const existingTimes = data.Operating_Times || {};
            const defaultDay = { isOpen: false, openTime: '', closeTime: '' };
            setFormData(prev => ({
              ...prev,
              Always_Open: data.Always_Open || false,
              operatingHours: {
                sunday: { ...defaultDay, ...existingTimes.sunday },
                monday: { ...defaultDay, ...existingTimes.monday },
                tuesday: { ...defaultDay, ...existingTimes.tuesday },
                wednesday: { ...defaultDay, ...existingTimes.wednesday },
                thursday: { ...defaultDay, ...existingTimes.thursday },
                friday: { ...defaultDay, ...existingTimes.friday },
                saturday: { ...defaultDay, ...existingTimes.saturday }
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
      setFormData(prev => ({
        ...prev,
        [name]: value.trim()
      }));
    } else if (name === 'newContact' || name === 'newWhatsApp') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 9) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
    } else if (name === 'newEmail') {
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
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAlwaysOpenToggle = () => {
    setFormData(prev => ({
      ...prev,
      Always_Open: !prev.Always_Open
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
    if (formData.Always_Open) {
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

  const validateProducts = () => {
    if (products.length === 0) {
      setProductsValidationError('Please add at least one product');
      return false;
    }

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (!product.name || !product.name.trim()) {
        setProductsValidationError(`Product ${i + 1}: Name is required`);
        return false;
      }
      
      if (!product.itemCode || !product.itemCode.trim()) {
        setProductsValidationError(`Product ${i + 1}: Item Code is required`);
        return false;
      }
    }

    setProductsValidationError('');
    return true;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.businessId.trim()) {
      newErrors.businessId = 'Business ID is required';
    } else if (businessNotFound) {
      newErrors.businessId = 'Business ID not found in our records';
    }
    
    if (!formData.fieldToUpdate) {
      newErrors.fieldToUpdate = 'Please select a field to update';
    }

    if (formData.fieldToUpdate) {
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
          if (!formData.Always_Open) {
            const hasOpenDay = Object.values(formData.operatingHours).some(day => day.isOpen);
            if (!hasOpenDay) {
              newErrors.operatingHours = 'Please select at least one operating day or choose "Always Open"';
            }
          }
          break;

        case 'Services':
          if (!formData.newServices.trim()) {
            newErrors.newServices = 'New services information is required';
          } else if (formData.newServices.trim().length < 10) {
            newErrors.newServices = 'Services description must be at least 10 characters';
          }
          break;

        case 'Business Images':
          if (!images || images.length === 0) {
            newErrors.images = 'New business images are required. Please upload at least one image.';
          } else if (images.length > 5) {
            newErrors.images = 'Maximum 5 images allowed';
          }
          break;

        case 'Products':
          if (!validateProducts()) {
            newErrors.products = 'Please ensure all products have required information';
          }
          break;

        case 'Other':
          if (!formData.otherDescription.trim()) {
            newErrors.otherDescription = 'Please describe what you want to change';
          } else if (formData.otherDescription.trim().length < 10) {
            newErrors.otherDescription = 'Description must be at least 10 characters';
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

  // ORIGINAL SUBMIT HANDLER - ENHANCED FOR PRODUCTS
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showAlert('warning', 'Validation Error', 'Please correct the errors before submitting.');
      return;
    }

    if (formData.fieldToUpdate === 'Operating Hours' && !validateTimes()) {
      showAlert('warning', 'Time Validation Error', 'Please correct the operating hours before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      let newValue = '';
      let imageUrls = [];
      
      if (formData.fieldToUpdate === 'Business Images' && images && images.length > 0) {
        try {
          console.log('Uploading', images.length, 'images for business update...');
          
          const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const uploadedImageData = await uploadBusinessImages(images, updateId);
          console.log('Upload result:', uploadedImageData);
          
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
          setIsSubmitting(false);
          return;
        }
      }
      
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
            Always_Open: formData.Always_Open,
            Operating_Times: formData.Always_Open ? null : formData.operatingHours
          });
          break;
        case 'Services':
          newValue = formData.newServices.trim();
          break;
        case 'Business Images':
          newValue = JSON.stringify(imageUrls);
          break;
        case 'Products':
          // Clean products data - only include necessary fields
          const cleanedProducts = products.map(product => ({
            name: product.name.trim(),
            itemCode: product.itemCode.trim(),
            discount: product.discount ? product.discount.toString() : '',
            oldPrice: product.oldPrice ? product.oldPrice.toString() : '',
            newPrice: product.newPrice ? product.newPrice.toString() : '',
            imageUrl: product.imageUrl || '',
            inStock: product.inStock !== undefined ? product.inStock : true
          }));
          newValue = JSON.stringify(cleanedProducts);
          break;
        case 'Other':
          newValue = formData.otherDescription.trim();
          break;
        default:
          newValue = 'See description for details';
      }

      const updateRequestData = {
        businessId: formData.businessId.trim(),
        businessName: businessData?.name || 'Unknown',
        fieldToUpdate: formData.fieldToUpdate,
        currentValue: getCurrentValue(),
        newValue: newValue,
        requestedAt: new Date(),
        status: 'pending_review',
        reviewedBy: null,
        reviewedAt: null,
        ...(formData.fieldToUpdate === 'Business Images' && { 
          newImageUrls: imageUrls,
          imageCount: imageUrls.length 
        }),
        ...(formData.fieldToUpdate === 'Products' && {
          productsData: products,
          productCount: products.length
        }),
        ...(formData.fieldToUpdate === 'Other' && { 
          description: formData.otherDescription.trim() 
        })
      };

      await addDoc(collection(db, 'Temporary-Update-Requests'), updateRequestData);

      const imageCountText = formData.fieldToUpdate === 'Business Images' ? 
        ` with ${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''}` : '';
      
      const productCountText = formData.fieldToUpdate === 'Products' ?
        ` with ${products.length} product${products.length > 1 ? 's' : ''}` : '';
      
      showAlert(
        'success', 
        'Update Request Submitted!', 
        `Your update request for "${businessData?.name || 'your business'}" has been submitted successfully${imageCountText}${productCountText}. Our team will review and process your request soon.`,
        6000
      );
      
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
        newServices: '',
        otherDescription: '',
        Always_Open: false,
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
      setProductsValidationError('');
      setBusinessData(null);
      setBusinessNotFound(false);
      setTimeErrors({});
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting update request:', error);
      showAlert('error', 'Submission Failed', `Failed to submit update request: ${error.message}. Please try again.`, 0);
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
        Always_Open: businessData.Always_Open || false,
        Operating_Times: businessData.Operating_Times || null
      });
      case 'Services': return businessData.Services || 'N/A';
      case 'Business Images': return `Current images: ${businessData.imageUrl?.length || 0} image(s)`;
      case 'Products': return `Current products: ${businessData.products?.length || 0} product(s)`;
      case 'Other': return 'N/A - See description';
      default: return 'N/A';
    }
  };

  const getDisplayValue = () => {
    if (!businessData) return 'N/A';

    if (formData.fieldToUpdate === 'Operating Hours') {
      if (businessData.Always_Open) {
        return 'Always Open (24/7)';
      }
      if (!businessData.Operating_Times) {
        return 'Operating hours not specified.';
      }

      const formatTime = (time) => {
        if (!time) return 'N/A';
        const [hour, minute] = time.split(':');
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minute} ${ampm}`;
      };

      const lines = daysOfWeek
        .map(({ key, label }) => {
            const dayData = businessData.Operating_Times[key];
            if (dayData && dayData.isOpen) {
                return `${label}: ${formatTime(dayData.openTime)} - ${formatTime(dayData.closeTime)}`;
            }
            return `${label}: Closed`;
        });

      return lines.join('\n');
    }

    if (formData.fieldToUpdate === 'Services') {
      return businessData.Services || 'No services information available';
    }

    if (formData.fieldToUpdate === 'Products') {
      const productCount = businessData.products?.length || 0;
      if (productCount === 0) return 'No products added yet';
      return `${productCount} product${productCount > 1 ? 's' : ''} currently listed`;
    }

    return getCurrentValue();
  };

  // ENHANCED UI RENDER FUNCTIONS
  const renderDynamicField = () => {
    if (!formData.fieldToUpdate) return null;

    switch (formData.fieldToUpdate) {
      case 'Business Name':
        return (
          <FormField label="New Business Name" error={errors.newBusinessName}>
            <input
              type="text"
              name="newBusinessName"
              value={formData.newBusinessName}
              onChange={handleInputChange}
              placeholder="Enter new business name"
              style={inputStyle(errors.newBusinessName)}
            />
          </FormField>
        );

      case 'About/Description':
        return (
          <FormField label="New Description" error={errors.newAbout}>
            <textarea
              name="newAbout"
              value={formData.newAbout}
              onChange={handleInputChange}
              placeholder="Enter new business description"
              rows={6}
              style={{
                ...inputStyle(errors.newAbout),
                resize: 'vertical'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              fontSize: '0.85rem',
              color: getWordCount(formData.newAbout) > 180 ? '#f59e0b' : colors.mediumBlue,
              marginTop: '0.3rem'
            }}>
              {getWordCount(formData.newAbout)}/200 words
            </div>
          </FormField>
        );

      case 'Address':
        return (
          <FormField label="New Address" error={errors.newAddress}>
            <textarea
              name="newAddress"
              value={formData.newAddress}
              onChange={handleInputChange}
              placeholder="Enter new business address"
              rows={3}
              style={{
                ...inputStyle(errors.newAddress),
                resize: 'vertical'
              }}
            />
          </FormField>
        );

      case 'Contact Number':
      case 'WhatsApp Number':
        const fieldName = formData.fieldToUpdate === 'Contact Number' ? 'newContact' : 'newWhatsApp';
        return (
          <FormField label={`New ${formData.fieldToUpdate}`} error={errors[fieldName]}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
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
                name={fieldName}
                value={formData[fieldName]}
                onChange={handleInputChange}
                placeholder="712345678"
                maxLength="9"
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  border: `2px solid ${errors[fieldName] ? '#ef4444' : '#e5e7eb'}`,
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
                marginLeft: '0.5rem',
                whiteSpace: 'nowrap'
              }}>
                {formData[fieldName].length}/9
              </div>
            </div>
          </FormField>
        );

      case 'Email':
        return (
          <FormField label="New Email" error={errors.newEmail}>
            <input
              type="email"
              name="newEmail"
              value={formData.newEmail}
              onChange={handleInputChange}
              placeholder="business@example.com"
              style={inputStyle(errors.newEmail)}
            />
          </FormField>
        );

      case 'Category':
        return (
          <FormField label="New Category" error={errors.newCategory}>
            <select
              name="newCategory"
              value={formData.newCategory}
              onChange={handleInputChange}
              disabled={categoriesLoading}
              style={{
                ...inputStyle(errors.newCategory),
                backgroundColor: categoriesLoading ? '#f0f0f0' : 'white',
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
                  ...inputStyle(errors.customCategory),
                  marginTop: '0.5rem'
                }}
              />
            )}
            {errors.customCategory && (
              <div style={{
                color: '#ef4444',
                fontSize: '0.85rem',
                marginTop: '0.3rem'
              }}>
                {errors.customCategory}
              </div>
            )}
          </FormField>
        );

      case 'Location':
        return (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <FormField label="New Location" error={errors.newLocation}>
                <select
                  name="newLocation"
                  value={formData.newLocation}
                  onChange={handleInputChange}
                  disabled={locationsLoading}
                  style={{
                    ...inputStyle(errors.newLocation),
                    backgroundColor: locationsLoading ? '#f0f0f0' : 'white',
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
                      ...inputStyle(errors.customLocation),
                      marginTop: '0.5rem'
                    }}
                  />
                )}
                {errors.customLocation && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginTop: '0.3rem'
                  }}>
                    {errors.customLocation}
                  </div>
                )}
              </FormField>

              <FormField label="New District" error={errors.newDistrict}>
                <select
                  name="newDistrict"
                  value={formData.newDistrict}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle(errors.newDistrict),
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
              </FormField>
            </div>
          </div>
        );

      case 'District':
        return (
          <FormField label="New District" error={errors.newDistrict}>
            <select
              name="newDistrict"
              value={formData.newDistrict}
              onChange={handleInputChange}
              style={{
                ...inputStyle(errors.newDistrict),
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
          </FormField>
        );

      case 'Facebook Page':
      case 'Website':
      case 'Location URL':
        const urlFieldName = formData.fieldToUpdate === 'Facebook Page' ? 'newFacebook' : 
                            formData.fieldToUpdate === 'Website' ? 'newWebsite' : 'newLocationUrl';
        const placeholder = formData.fieldToUpdate === 'Facebook Page' ? 'https://facebook.com/your-page' :
                           formData.fieldToUpdate === 'Website' ? 'https://your-website.com' :
                           'https://maps.google.com/...';
        
        return (
          <FormField label={`New ${formData.fieldToUpdate}`} error={errors[urlFieldName]}>
            <input
              type="url"
              name={urlFieldName}
              value={formData[urlFieldName]}
              onChange={handleInputChange}
              placeholder={placeholder}
              style={inputStyle(errors[urlFieldName])}
            />
          </FormField>
        );

      case 'Operating Hours':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: '700',
              color: colors.darkNavy,
              marginBottom: '1.5rem'
            }}>
              New Operating Hours
            </h3>
            
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: formData.Always_Open ? '#ecfdf5' : '#f3f4f6',
              border: `2px solid ${formData.Always_Open ? '#3183B5' : '#e5e7eb'}`,
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
                  checked={formData.Always_Open}
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

            {!formData.Always_Open && (
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

            {errors.operatingHours && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '2px solid #ef4444',
                borderRadius: '8px',
                color: '#ef4444',
                fontWeight: '500'
              }}>
                {errors.operatingHours}
              </div>
            )}
          </div>
        );

      case 'Services':
        return (
          <FormField label="New Services" error={errors.newServices}>
            <textarea
              name="newServices"
              value={formData.newServices}
              onChange={handleInputChange}
              placeholder="Enter the services your business offers (e.g., Wedding & Reception Venue, Full-Service Catering, Event Planning, etc.)"
              rows={5}
              style={{
                ...inputStyle(errors.newServices),
                resize: 'vertical'
              }}
            />
            <div style={{
              fontSize: '0.85rem',
              color: colors.mediumBlue,
              marginTop: '0.3rem'
            }}>
              Separate multiple services with commas for better readability
            </div>
          </FormField>
        );

      case 'Business Images':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <ImageUpload
              images={images}
              setImages={setImages}
              validationErrors={errors}
              setValidationErrors={setErrors}
              maxImages={5}
            />
            
            {businessData?.imageUrl && businessData.imageUrl.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{
                  color: colors.darkNavy,
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.8rem'
                }}>
                  Current Business Images ({businessData.imageUrl.length}):
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '0.8rem'
                }}>
                  {businessData.imageUrl.slice(0, 5).map((url, index) => (
                    <div key={index} style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid #e5e7eb'
                    }}>
                      <img
                        src={url}
                        alt={`Current business image ${index + 1}`}
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
                </div>
              </div>
            )}
          </div>
        );

      case 'Products':
        return (
          <ProductsUpdateSection
            businessData={businessData}
            onProductsChange={handleProductsChange}
            validationError={productsValidationError}
          />
        );

      case 'Other':
        return (
          <FormField label="Describe What You Want to Change" error={errors.otherDescription}>
            <textarea
              name="otherDescription"
              value={formData.otherDescription}
              onChange={handleInputChange}
              placeholder="Please describe in detail what you want to update or change about your business..."
              rows={4}
              style={{
                ...inputStyle(errors.otherDescription),
                resize: 'vertical'
              }}
            />
            <div style={{
              fontSize: '0.8rem',
              color: colors.mediumBlue,
              marginTop: '0.3rem',
              textAlign: 'right'
            }}>
              {formData.otherDescription.length} characters
            </div>
          </FormField>
        );

      default:
        return null;
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
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .update-container { padding: 1.5rem !important; }
            .update-title { font-size: 1.8rem !important; }
            .form-card { padding: 1.5rem !important; }
            .search-grid { grid-template-columns: 1fr !important; }
            .business-card-grid { grid-template-columns: 1fr !important; }
          }
        `}
      </style>

      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        padding: '2rem 1rem'
      }}>
        <div className="update-container" style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h1 className="update-title" style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1A365D',
              marginBottom: '0.5rem'
            }}>
              Update Your Business
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: colors.mediumBlue,
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              Request changes to your business information. Our team will review and apply updates.
            </p>
          </div>

          {/* Main Form Card */}
          <div className="form-card" style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            animation: 'fadeIn 0.5s ease'
          }}>
            <form onSubmit={handleSubmit}>
              {/* Search Section */}
              <div className="search-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {/* Business ID Input */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: colors.darkNavy,
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}>
                    Business ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: colors.mediumBlue
                    }}>
                      <Search size={20} />
                    </div>
                    <input
                      type="text"
                      name="businessId"
                      value={formData.businessId}
                      onChange={handleInputChange}
                      placeholder="Enter your business ID"
                      style={{
                        width: '100%',
                        padding: '0.875rem 0.875rem 0.875rem 3rem',
                        border: `2px solid ${
                          errors.businessId ? '#ef4444' : 
                          businessData ? '#10b981' : 
                          loadingBusiness ? '#f59e0b' : '#e5e7eb'
                        }`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                    {formData.businessId && (
                      <div style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {loadingBusiness ? (
                          <>
                            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ color: '#f59e0b' }}>Searching...</span>
                          </>
                        ) : businessData ? (
                          <>
                            <CheckCircle size={16} color="#10b981" />
                            <span style={{ color: '#10b981' }}>Found</span>
                          </>
                        ) : businessNotFound ? (
                          <>
                            <XCircle size={16} color="#ef4444" />
                            <span style={{ color: '#ef4444' }}>Not Found</span>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                  {errors.businessId && (
                    <div style={{
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      marginTop: '0.3rem'
                    }}>
                      {errors.businessId}
                    </div>
                  )}
                </div>

                {/* Field to Update Select */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: colors.darkNavy,
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}>
                    Field to Update <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: colors.mediumBlue
                    }}>
                      <Edit3 size={20} />
                    </div>
                    <select
                      name="fieldToUpdate"
                      value={formData.fieldToUpdate}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.875rem 0.875rem 0.875rem 3rem',
                        border: `2px solid ${errors.fieldToUpdate ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select field to update</option>
                      {fieldOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  {errors.fieldToUpdate && (
                    <div style={{
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      marginTop: '0.3rem'
                    }}>
                      {errors.fieldToUpdate}
                    </div>
                  )}
                </div>
              </div>

              {/* Business Info Card */}
              {businessData && (
                <div style={{
                  backgroundColor: '#f8f9ff',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  border: '2px solid #e0e7ff'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <Building2 size={24} color={colors.darkNavy} />
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      color: colors.darkNavy,
                      margin: 0
                    }}>
                      {businessData.name}
                    </h3>
                  </div>
                  
                  <div className="business-card-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem'
                  }}>
                    <div>
                      <p style={{ margin: '0.5rem 0', color: colors.mediumBlue }}>
                        <strong>ID:</strong> {businessData.business_ID}
                      </p>
                      <p style={{ margin: '0.5rem 0', color: colors.mediumBlue }}>
                        <strong>Category:</strong> {businessData.category || 'N/A'}
                      </p>
                      <p style={{ margin: '0.5rem 0', color: colors.mediumBlue }}>
                        <strong>Location:</strong> {businessData.location || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0.5rem 0', color: colors.mediumBlue }}>
                        <strong>Contact:</strong> {businessData.contact || 'N/A'}
                      </p>
                      <p style={{ margin: '0.5rem 0', color: colors.mediumBlue }}>
                        <strong>Email:</strong> {businessData.email || 'N/A'}
                      </p>
                      <p style={{ margin: '0.5rem 0', color: colors.mediumBlue }}>
                        <strong>District:</strong> {businessData.district || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Value Display */}
              {businessData && formData.fieldToUpdate && formData.fieldToUpdate !== 'Other' && (
                <div style={{
                  backgroundColor: '#fffbeb',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  border: '2px solid #fef08a'
                }}>
                  <h4 style={{
                    color: colors.darkNavy,
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    Current {formData.fieldToUpdate}:
                  </h4>
                  <p style={{
                    color: '#78350f',
                    fontSize: '0.95rem',
                    margin: 0,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {getDisplayValue()}
                  </p>
                </div>
              )}

              {/* Dynamic Form Fields */}
              {renderDynamicField()}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '2px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    padding: '1rem 2rem',
                    backgroundColor: '#f3f4f6',
                    color: colors.darkNavy,
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !businessData}
                  style={{
                    padding: '1rem 2.5rem',
                    backgroundColor: isSubmitting || !businessData ? '#cccccc' : '#3183B5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: isSubmitting || !businessData ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      Submitting...
                    </>
                  ) : (
                    'Submit Update Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Update_Business;