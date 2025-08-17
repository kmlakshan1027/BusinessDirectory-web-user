// pages/UpdateBusinessRequest.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where, updateDoc, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs';
import { colors } from '../../utils/colors';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '../../configs/CloudinaryConfig';
import ImageUpload from '../../components/ImageUpload';

const UpdateBusinessRequest = () => {
  const [updateRequests, setUpdateRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [expandedRequests, setExpandedRequests] = useState(new Set());

  // Data for dropdowns
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Field mappings for dropdown and database fields
  const fieldMappings = {
    'Business Name': 'name',
    'About/Description': 'about',
    'Address': 'address',
    'Contact Number': 'contact',
    'WhatsApp Number': 'whatsapp',
    'Email': 'email',
    'Category': 'category',
    'Location': 'location',
    'District': 'district',
    'Facebook Page': 'facebook',
    'Website': 'website',
    'Location URL': 'locationUrl',
    'Operating Hours': 'operatingTimes',
    'Business Images': 'imageUrl',
    'Other': 'other'
  };

  const daysOfWeek = [
    { key: 'sunday', label: 'Sunday' },
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' }
  ];

  useEffect(() => {
    fetchUpdateRequests();
    fetchCategoriesAndLocations();
  }, []);

  const fetchCategoriesAndLocations = async () => {
    try {
      // Fetch categories
      const categoryCollection = collection(db, 'Category');
      const categorySnapshot = await getDocs(categoryCollection);
      const categoryList = categorySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setCategories(categoryList);

      // Fetch locations and districts
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
      console.error('Error fetching categories and locations:', error);
    }
  };

  const fetchUpdateRequests = async () => {
    try {
      setLoading(true);
      const updateCollection = collection(db, 'Temporary_Update_Business');
      const q = query(updateCollection, orderBy('requestedAt', 'desc'));
      const updateSnapshot = await getDocs(q);
      
      const updateRequests = updateSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch corresponding business data for each request
      const requestsWithBusinessData = await Promise.all(
        updateRequests.map(async (request) => {
          try {
            const businessCollection = collection(db, 'BusinessList');
            const businessQuery = query(businessCollection, where('business_ID', '==', request.businessId));
            const businessSnapshot = await getDocs(businessQuery);
            
            if (!businessSnapshot.empty) {
              const businessData = businessSnapshot.docs[0].data();
              return {
                ...request,
                businessData: {
                  id: businessSnapshot.docs[0].id,
                  ...businessData
                },
                businessExists: true
              };
            } else {
              return {
                ...request,
                businessExists: false
              };
            }
          } catch (error) {
            console.error('Error fetching business data for request:', request.id, error);
            return {
              ...request,
              businessExists: false
            };
          }
        })
      );

      setUpdateRequests(requestsWithBusinessData);
    } catch (error) {
      console.error('Error fetching update requests:', error);
      alert('Error loading update requests');
    } finally {
      setLoading(false);
    }
  };

  const validateAdminInput = (fieldToUpdate, adminData) => {
    if (!fieldToUpdate || !adminData) return false;

    switch (fieldToUpdate) {
      case 'Business Name':
        return adminData.newBusinessName && adminData.newBusinessName.trim().length >= 2;
      
      case 'About/Description':
        if (!adminData.newAbout || !adminData.newAbout.trim()) return false;
        const wordCount = adminData.newAbout.trim().split(/\s+/).length;
        return wordCount <= 200;
      
      case 'Address':
        return adminData.newAddress && adminData.newAddress.trim();
      
      case 'Contact Number':
      case 'WhatsApp Number':
        const phoneField = fieldToUpdate === 'Contact Number' ? 'newContact' : 'newWhatsApp';
        return adminData[phoneField] && adminData[phoneField].length === 9;
      
      case 'Email':
        if (!adminData.newEmail) return false;
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(adminData.newEmail);
      
      case 'Category':
        if (!adminData.newCategory) return false;
        return adminData.newCategory !== 'other' || (adminData.customCategory && adminData.customCategory.trim());
      
      case 'Location':
        if (!adminData.newLocation || !adminData.newDistrict) return false;
        return adminData.newLocation !== 'other' || (adminData.customLocation && adminData.customLocation.trim());
      
      case 'District':
        return adminData.newDistrict && adminData.newDistrict.trim();
      
      case 'Facebook Page':
      case 'Website':
      case 'Location URL':
        const urlField = fieldToUpdate === 'Facebook Page' ? 'newFacebook' : 
                        fieldToUpdate === 'Website' ? 'newWebsite' : 'newLocationUrl';
        if (!adminData[urlField]) return false;
        const urlRegex = /^https?:\/\/.+/;
        return urlRegex.test(adminData[urlField]);
      
      case 'Operating Hours':
        if (adminData.alwaysOpen) return true;
        return Object.values(adminData.operatingHours || {}).some(day => day.isOpen);
      
      case 'Business Images':
        return adminData.businessImages && adminData.businessImages.length > 0;
      
      default:
        return adminData.customChange && adminData.customChange.trim();
    }
  };

  const checkForNewCategoryOrLocation = async (fieldToUpdate, adminData) => {
    const notifications = [];

    if (fieldToUpdate === 'Category') {
      const categoryValue = adminData.newCategory === 'other' ? adminData.customCategory : adminData.newCategory;
      const existingCategory = categories.find(cat => 
        cat.name.toLowerCase() === categoryValue.toLowerCase()
      );
      
      if (!existingCategory && categoryValue) {
        notifications.push({
          type: 'new_category',
          value: categoryValue,
          message: `"${categoryValue}" is a new category not in the current list.`
        });
      }
    }

    if (fieldToUpdate === 'Location') {
      const locationValue = adminData.newLocation === 'other' ? adminData.customLocation : adminData.newLocation;
      const existingLocation = locations.find(loc => 
        loc.toLowerCase() === locationValue.toLowerCase()
      );
      
      if (!existingLocation && locationValue) {
        notifications.push({
          type: 'new_location',
          value: locationValue,
          message: `"${locationValue}" is a new location not in the current list.`
        });
      }
    }

    return notifications;
  };

  const addNewCategoryIfNeeded = async (categoryName) => {
    try {
      // Check if category already exists
      const existingCategory = categories.find(cat => 
        cat.name.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (!existingCategory) {
        await addDoc(collection(db, 'Category'), {
          name: categoryName,
          createdAt: new Date(),
          createdBy: 'admin'
        });
        console.log('New category added:', categoryName);
        // Refresh categories list
        await fetchCategoriesAndLocations();
      }
    } catch (error) {
      console.error('Error adding new category:', error);
    }
  };

  const prepareUpdateData = (fieldToUpdate, adminData) => {
    let updateData = {};
    let newValue = '';

    switch (fieldToUpdate) {
      case 'Business Name':
        newValue = adminData.newBusinessName.trim();
        updateData.name = newValue;
        break;
      
      case 'About/Description':
        newValue = adminData.newAbout.trim();
        updateData.about = newValue;
        break;
      
      case 'Address':
        newValue = adminData.newAddress.trim();
        updateData.address = newValue;
        break;
      
      case 'Contact Number':
        newValue = `+94${adminData.newContact}`;
        updateData.contact = newValue;
        break;
      
      case 'WhatsApp Number':
        newValue = `+94${adminData.newWhatsApp}`;
        updateData.whatsapp = newValue;
        break;
      
      case 'Email':
        newValue = adminData.newEmail.toLowerCase();
        updateData.email = newValue;
        break;
      
      case 'Category':
        newValue = adminData.newCategory === 'other' ? adminData.customCategory.trim() : adminData.newCategory;
        updateData.category = newValue;
        break;
      
      case 'Location':
        newValue = adminData.newLocation === 'other' ? adminData.customLocation.trim() : adminData.newLocation;
        updateData.location = newValue;
        updateData.district = adminData.newDistrict;
        break;
      
      case 'District':
        newValue = adminData.newDistrict;
        updateData.district = newValue;
        break;
      
      case 'Facebook Page':
        newValue = adminData.newFacebook;
        updateData.facebook = newValue;
        break;
      
      case 'Website':
        newValue = adminData.newWebsite;
        updateData.website = newValue;
        break;
      
      case 'Location URL':
        newValue = adminData.newLocationUrl;
        updateData.locationUrl = newValue;
        break;
      
      case 'Operating Hours':
        updateData.alwaysOpen = adminData.alwaysOpen;
        updateData.operatingTimes = adminData.alwaysOpen ? null : adminData.operatingHours;
        newValue = JSON.stringify({
          alwaysOpen: adminData.alwaysOpen,
          operatingTimes: adminData.alwaysOpen ? null : adminData.operatingHours
        });
        break;
      
      case 'Business Images':
        // For business images, we'll update the imageUrl field with the new image URL
        if (adminData.businessImages && adminData.businessImages.length > 0) {
          updateData.imageUrl = adminData.businessImages[0].url; // Use first image as primary
          updateData.businessImages = adminData.businessImages; // Store all images
          newValue = adminData.businessImages[0].url;
        }
        break;
      
      default:
        newValue = adminData.customChange || '';
        updateData[fieldMappings[fieldToUpdate] || fieldToUpdate.toLowerCase()] = newValue;
    }

    return { updateData, newValue };
  };

  const handleApproveUpdate = async (request, adminData) => {
    if (processingIds.has(request.id)) return;

    if (!adminData.fieldToUpdate) {
      alert('Please select the field to update.');
      return;
    }

    if (!validateAdminInput(adminData.fieldToUpdate, adminData)) {
      alert('Please fill in all required fields with valid data.');
      return;
    }

    if (!request.businessExists || !request.businessData) {
      alert('Cannot update: Business not found in the system.');
      return;
    }

    // Check for new categories or locations
    const notifications = await checkForNewCategoryOrLocation(adminData.fieldToUpdate, adminData);
    
    if (notifications.length > 0) {
      const notificationMessages = notifications.map(n => n.message).join('\n');
      const confirmWithNotification = window.confirm(
        `NOTICE: New entries detected!\n\n${notificationMessages}\n\nDo you want to proceed with the update? These new entries will be added to the system.`
      );
      
      if (!confirmWithNotification) {
        return;
      }

      // Add new categories if needed
      for (const notification of notifications) {
        if (notification.type === 'new_category') {
          await addNewCategoryIfNeeded(notification.value);
        }
      }
    }

    const { updateData, newValue } = prepareUpdateData(adminData.fieldToUpdate, adminData);
    
    const confirmMessage = `Are you sure you want to approve this update for "${request.businessName}"?\n\nField: ${adminData.fieldToUpdate}\nNew Value: ${newValue}`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setProcessingIds(prev => new Set([...prev, request.id]));
    
    try {
      const businessRef = doc(db, 'BusinessList', request.businessData.id);
      
      // Add metadata about the update
      updateData.lastUpdatedAt = new Date();
      updateData.lastUpdateBy = 'admin';
      updateData.updateHistory = request.businessData.updateHistory || [];
      updateData.updateHistory.push({
        field: adminData.fieldToUpdate,
        oldValue: request.businessData[fieldMappings[adminData.fieldToUpdate]] || 'N/A',
        newValue: newValue,
        updatedAt: new Date(),
        updatedBy: 'admin',
        requestId: request.id
      });

      await updateDoc(businessRef, updateData);
      
      // Remove the request from Temporary_Update_Business
      await deleteDoc(doc(db, 'Temporary_Update_Business', request.id));
      
      alert(`Update approved successfully! Business "${request.businessName}" has been updated.`);
      
      // Refresh the requests
      await fetchUpdateRequests();
      
    } catch (error) {
      console.error('Error approving update:', error);
      alert('Error approving update. Please try again.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const handleRejectUpdate = async (request) => {
    if (processingIds.has(request.id)) return;

    const reason = window.prompt(`Why are you rejecting this update request for "${request.businessName}"?\n\nEnter rejection reason:`);
    
    if (reason === null) return; // User cancelled
    
    if (!reason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    
    setProcessingIds(prev => new Set([...prev, request.id]));
    
    try {
      await deleteDoc(doc(db, 'Temporary_Update_Business', request.id));
      
      alert(`Update request rejected. Reason: ${reason}`);
      await fetchUpdateRequests();
      
    } catch (error) {
      console.error('Error rejecting update request:', error);
      alert('Error rejecting update request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const getStatusColor = (businessExists) => {
    return businessExists ? '#28a745' : '#dc3545';
  };

  const toggleRequestExpansion = (requestId) => {
    setExpandedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const parseOperatingHours = (operatingHoursString) => {
    try {
      const parsed = JSON.parse(operatingHoursString);
      return {
        alwaysOpen: parsed.alwaysOpen || false,
        operatingTimes: parsed.operatingTimes || {}
      };
    } catch (error) {
      return {
        alwaysOpen: false,
        operatingTimes: {}
      };
    }
  };

  // Helper function to parse requested location data
  const parseLocationRequest = (newValue) => {
    try {
      // First try to parse as JSON
      const parsed = JSON.parse(newValue);
      return {
        location: parsed.location || parsed.newLocation || '',
        district: parsed.district || parsed.newDistrict || ''
      };
    } catch (error) {
      // If it's not JSON, check if it contains both location and district info
      if (typeof newValue === 'string') {
        // Look for patterns like "Location: X, District: Y" or similar
        const locationMatch = newValue.match(/location[:\s]*([^,\n]+)/i);
        const districtMatch = newValue.match(/district[:\s]*([^,\n]+)/i);
        
        return {
          location: locationMatch ? locationMatch[1].trim() : newValue.trim(),
          district: districtMatch ? districtMatch[1].trim() : ''
        };
      }
      
      return {
        location: newValue || '',
        district: ''
      };
    }
  };

  // Helper function to parse requested images
  const parseImageRequest = (newValue) => {
    try {
      if (typeof newValue === 'string') {
        const parsed = JSON.parse(newValue);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      return Array.isArray(newValue) ? newValue : [newValue];
    } catch (error) {
      // If it's a simple URL string
      return typeof newValue === 'string' ? [{ url: newValue }] : [];
    }
  };

  // Helper function to download image
  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'business-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error downloading image');
    }
  };

  const UpdateRequestCard = ({ request, index }) => {
    const [adminData, setAdminData] = useState(() => {
      // Initialize adminData based on the request
      let initialData = {
        fieldToUpdate: request.fieldToUpdate || '',
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
        businessImages: [],
        alwaysOpen: false,
        operatingHours: {
          sunday: { isOpen: false, openTime: '', closeTime: '' },
          monday: { isOpen: false, openTime: '', closeTime: '' },
          tuesday: { isOpen: false, openTime: '', closeTime: '' },
          wednesday: { isOpen: false, openTime: '', closeTime: '' },
          thursday: { isOpen: false, openTime: '', closeTime: '' },
          friday: { isOpen: false, openTime: '', closeTime: '' },
          saturday: { isOpen: false, openTime: '', closeTime: '' }
        },
        customChange: ''
      };

      // Pre-populate operating hours if this is an operating hours request
      if (request.fieldToUpdate === 'Operating Hours' && request.newValue) {
        const operatingData = parseOperatingHours(request.newValue);
        initialData.alwaysOpen = operatingData.alwaysOpen;
        initialData.operatingHours = operatingData.operatingTimes || initialData.operatingHours;
      }

      return initialData;
    });

    const isProcessing = processingIds.has(request.id);
    const isExpanded = expandedRequests.has(request.id);

    // Parse requested location data if it's a location request
    const requestedLocationData = request.fieldToUpdate === 'Location' ? 
      parseLocationRequest(request.newValue) : null;

    // Parse requested images if it's a business images request
    const requestedImages = request.fieldToUpdate === 'Business Images' ? 
      parseImageRequest(request.newValue) : [];

    const handleAdminInputChange = (e) => {
      const { name, value } = e.target;
      
      if (name === 'newContact' || name === 'newWhatsApp') {
        const numericValue = value.replace(/\D/g, '');
        if (numericValue.length <= 9) {
          setAdminData(prev => ({
            ...prev,
            [name]: numericValue
          }));
        }
      } else if (name === 'newEmail') {
        const emailValue = value.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase();
        setAdminData(prev => ({
          ...prev,
          [name]: emailValue
        }));
      } else {
        setAdminData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    };

    const handleImagesChange = (newImages) => {
      setAdminData(prev => ({
        ...prev,
        businessImages: newImages
      }));
    };

    const handleAlwaysOpenToggle = () => {
      setAdminData(prev => ({
        ...prev,
        alwaysOpen: !prev.alwaysOpen
      }));
    };

    const handleDayToggle = (day) => {
      setAdminData(prev => ({
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
    };

    const handleTimeChange = (day, timeType, value) => {
      setAdminData(prev => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [day]: {
            ...prev.operatingHours[day],
            [timeType]: value
          }
        }
      }));
    };

    const renderRequestedValue = () => {
      if (request.fieldToUpdate === 'Business Images' && requestedImages.length > 0) {
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1rem',
            marginTop: '0.5rem'
          }}>
            {requestedImages.map((image, index) => (
              <div key={index} style={{
                position: 'relative',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white'
              }}>
                <img
                  src={image.url || image}
                  alt={`Requested image ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '120px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  fontSize: '0.8rem'
                }}>
                  Image not available
                </div>
                <button
                  onClick={() => downloadImage(image.url || image, `business-image-${index + 1}.jpg`)}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    opacity: '0.8',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                >
                  ⬇ Download
                </button>
              </div>
            ))}
          </div>
        );
      } else if (request.fieldToUpdate === 'Location' && requestedLocationData) {
        return (
          <div style={{
            backgroundColor: '#f0f8ff',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #b0d4f1',
            marginTop: '0.5rem'
          }}>
            <div style={{ 
              marginBottom: requestedLocationData.district ? '0.8rem' : '0', 
              display: 'flex', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <strong style={{ color: colors.darkNavy }}>📍 Requested Location:</strong> 
              <span style={{
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                {requestedLocationData.location || 'Not specified'}
              </span>
            </div>
            {requestedLocationData.district && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <strong style={{ color: colors.darkNavy }}>🏛️ Requested District:</strong>
                <span style={{
                  backgroundColor: '#e8f5e8',
                  color: '#388e3c',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  {requestedLocationData.district}
                </span>
              </div>
            )}
            {!requestedLocationData.district && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#ff6600',
                fontStyle: 'italic',
                marginTop: '0.3rem'
              }}>
                No district information provided in the request
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div style={{ 
            margin: '0.5rem 0', 
            color: colors.mediumGray, 
            lineHeight: '1.5',
            backgroundColor: 'white',
            padding: '0.8rem',
            borderRadius: '5px',
            border: '1px solid #e0e0e0',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            {request.newValue || 'No value provided'}
          </div>
        );
      }
    };

    const renderAdminFormField = () => {
      if (!adminData.fieldToUpdate) return null;

      switch (adminData.fieldToUpdate) {
        case 'Business Name':
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                New Business Name: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="newBusinessName"
                value={adminData.newBusinessName}
                onChange={handleAdminInputChange}
                placeholder="Enter new business name"
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  border: `2px solid ${colors.lightBlue}`,
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          );

        case 'About/Description':
          const wordCount = adminData.newAbout ? adminData.newAbout.trim().split(/\s+/).length : 0;
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                New Description: <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="newAbout"
                value={adminData.newAbout}
                onChange={handleAdminInputChange}
                placeholder="Enter new business description"
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  border: `2px solid ${colors.lightBlue}`,
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <small style={{ 
                color: wordCount > 180 ? '#ff6600' : colors.mediumBlue,
                fontSize: '0.8rem',
                display: 'block',
                marginTop: '0.3rem'
              }}>
                {wordCount}/200 words
              </small>
            </div>
          );

        case 'Address':
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                New Address: <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="newAddress"
                value={adminData.newAddress}
                onChange={handleAdminInputChange}
                placeholder="Enter new business address"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  border: `2px solid ${colors.lightBlue}`,
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          );

        case 'Contact Number':
        case 'WhatsApp Number':
          const fieldName = adminData.fieldToUpdate === 'Contact Number' ? 'newContact' : 'newWhatsApp';
          const placeholder = adminData.fieldToUpdate === 'Contact Number' ? '712345678' : '712345678';
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                New {adminData.fieldToUpdate}: <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  color: colors.darkNavy,
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  marginRight: '0.5rem'
                }}>
                  +94
                </span>
                <input
                  type="text"
                  name={fieldName}
                  value={adminData[fieldName]}
                  onChange={handleAdminInputChange}
                  placeholder={placeholder}
                  maxLength="9"
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    border: `2px solid ${colors.lightBlue}`,
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
                <small style={{
                  marginLeft: '0.5rem',
                  color: colors.mediumBlue,
                  fontSize: '0.8rem'
                }}>
                  {adminData[fieldName].length}/9
                </small>
              </div>
            </div>
          );

        case 'Email':
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                New Email: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="email"
                name="newEmail"
                value={adminData.newEmail}
                onChange={handleAdminInputChange}
                placeholder="business@example.com"
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  border: `2px solid ${colors.lightBlue}`,
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          );

        case 'Category':
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                New Category: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="newCategory"
                value={adminData.newCategory}
                onChange={handleAdminInputChange}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  border: `2px solid ${colors.lightBlue}`,
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  backgroundColor: 'white',
                  boxSizing: 'border-box',
                  marginBottom: '0.5rem'
                }}
              >
                <option value="">Select new category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
                <option value="other">Other (Specify below)</option>
              </select>
              
              {adminData.newCategory === 'other' && (
                <input
                  type="text"
                  name="customCategory"
                  value={adminData.customCategory}
                  onChange={handleAdminInputChange}
                  placeholder="Please specify the business category"
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    border: `2px solid ${colors.lightBlue}`,
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              )}
            </div>
          );

        case 'Location':
          return (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: colors.darkNavy,
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  New Location: <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  name="newLocation"
                  value={adminData.newLocation}
                  onChange={handleAdminInputChange}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    border: `2px solid ${colors.lightBlue}`,
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    backgroundColor: 'white',
                    boxSizing: 'border-box',
                    marginBottom: '0.5rem'
                  }}
                >
                  <option value="">Select new location</option>
                  {locations.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                  <option value="other">Other (Specify below)</option>
                </select>
                
                {adminData.newLocation === 'other' && (
                  <input
                    type="text"
                    name="customLocation"
                    value={adminData.customLocation}
                    onChange={handleAdminInputChange}
                    placeholder="Please specify the business location"
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      border: `2px solid ${colors.lightBlue}`,
                      borderRadius: '5px',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: colors.darkNavy,
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  New District: <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  name="newDistrict"
                  value={adminData.newDistrict}
                  onChange={handleAdminInputChange}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    border: `2px solid ${colors.lightBlue}`,
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select district</option>
                  {districts.map(district => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        case 'District':
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                New District: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="newDistrict"
                value={adminData.newDistrict}
                onChange={handleAdminInputChange}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  border: `2px solid ${colors.lightBlue}`,
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select new district</option>
                {districts.map(district => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
          );

        case 'Facebook Page':
        case 'Website':
        case 'Location URL':
          const urlFieldName = adminData.fieldToUpdate === 'Facebook Page' ? 'newFacebook' : 
                              adminData.fieldToUpdate === 'Website' ? 'newWebsite' : 'newLocationUrl';
          const urlPlaceholder = adminData.fieldToUpdate === 'Facebook Page' ? 'https://facebook.com/your-page' :
                                 adminData.fieldToUpdate === 'Website' ? 'https://your-website.com' :
                                 'https://maps.google.com/...';
          
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                New {adminData.fieldToUpdate}: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="url"
                name={urlFieldName}
                value={adminData[urlFieldName]}
                onChange={handleAdminInputChange}
                placeholder={urlPlaceholder}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  border: `2px solid ${colors.lightBlue}`,
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          );

        case 'Operating Hours':
          return (
            <div>
              <h4 style={{
                color: colors.darkNavy,
                marginBottom: '1rem',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}>
                New Operating Hours: <span style={{ color: 'red' }}>*</span>
              </h4>
              
              {/* Always Open Option */}
              <div style={{
                marginBottom: '1rem',
                padding: '0.8rem',
                border: `2px solid ${adminData.alwaysOpen ? colors.mediumBlue : colors.lightBlue}`,
                borderRadius: '6px',
                backgroundColor: adminData.alwaysOpen ? '#e8f4ff' : '#f8f9ff'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: colors.darkNavy
                }}>
                  <input
                    type="checkbox"
                    checked={adminData.alwaysOpen}
                    onChange={handleAlwaysOpenToggle}
                    style={{
                      marginRight: '0.5rem',
                      transform: 'scale(1.2)'
                    }}
                  />
                  Always Open (24/7)
                </label>
              </div>

              {/* Day-wise Schedule */}
              <div style={{
                opacity: adminData.alwaysOpen ? 0.5 : 1,
                pointerEvents: adminData.alwaysOpen ? 'none' : 'auto',
                transition: 'opacity 0.3s ease'
              }}>
                <div style={{
                  display: 'grid',
                  gap: '0.8rem'
                }}>
                  {daysOfWeek.map(({ key, label }) => (
                    <div key={key} style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr 1fr',
                      gap: '0.8rem',
                      alignItems: 'center',
                      padding: '0.8rem',
                      border: `1px solid ${colors.lightBlue}`,
                      borderRadius: '6px',
                      backgroundColor: adminData.operatingHours[key].isOpen ? '#f8f9ff' : '#f5f5f5'
                    }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}>
                        <input
                          type="checkbox"
                          checked={adminData.operatingHours[key].isOpen}
                          onChange={() => handleDayToggle(key)}
                          disabled={adminData.alwaysOpen}
                          style={{
                            marginRight: '0.4rem',
                            transform: 'scale(1.1)'
                          }}
                        />
                        {label}
                      </label>
                      
                      <input
                        type="time"
                        value={adminData.operatingHours[key].openTime}
                        onChange={(e) => handleTimeChange(key, 'openTime', e.target.value)}
                        disabled={!adminData.operatingHours[key].isOpen || adminData.alwaysOpen}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: `1px solid ${colors.lightBlue}`,
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          backgroundColor: (adminData.operatingHours[key].isOpen && !adminData.alwaysOpen) ? 'white' : '#f0f0f0',
                          cursor: (adminData.operatingHours[key].isOpen && !adminData.alwaysOpen) ? 'pointer' : 'not-allowed'
                        }}
                      />
                      
                      <input
                        type="time"
                        value={adminData.operatingHours[key].closeTime}
                        onChange={(e) => handleTimeChange(key, 'closeTime', e.target.value)}
                        disabled={!adminData.operatingHours[key].isOpen || adminData.alwaysOpen}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: `1px solid ${colors.lightBlue}`,
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          backgroundColor: (adminData.operatingHours[key].isOpen && !adminData.alwaysOpen) ? 'white' : '#f0f0f0',
                          cursor: (adminData.operatingHours[key].isOpen && !adminData.alwaysOpen) ? 'pointer' : 'not-allowed'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );

        case 'Business Images':
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                New Business Images: <span style={{ color: 'red' }}>*</span>
              </label>
              <ImageUpload
                onImagesChange={handleImagesChange}
                currentImages={adminData.businessImages}
                maxImages={5}
                disabled={isProcessing}
              />
              <small style={{
                display: 'block',
                marginTop: '0.5rem',
                color: colors.mediumBlue,
                fontSize: '0.8rem',
                fontStyle: 'italic'
              }}>
                Upload new business images. The first image will be used as the primary image.
              </small>
            </div>
          );

        case 'Other':
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                Custom Change Description: <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="customChange"
                value={adminData.customChange}
                onChange={handleAdminInputChange}
                placeholder="Describe the change you want to make..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  border: `2px solid ${colors.lightBlue}`,
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          );

        default:
          return (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: colors.darkNavy,
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                New Value: <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="customChange"
                value={adminData.customChange}
                onChange={handleAdminInputChange}
                placeholder="Enter the new value or updated information..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  border: `2px solid ${colors.lightBlue}`,
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          );
      }
    };
    
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '1rem',
        border: `2px solid ${getStatusColor(request.businessExists)}`
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ color: colors.darkNavy, margin: '0 0 0.5rem 0' }}>
              {index + 1}. {request.businessName}
            </h3>
            <p style={{ margin: '0.25rem 0', color: colors.mediumBlue, fontWeight: 'bold' }}>
              <strong>Business ID:</strong> {request.businessId}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Requested Field:</strong> {request.fieldToUpdate}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Submitted:</strong> {formatDate(request.requestedAt)}
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{
              backgroundColor: getStatusColor(request.businessExists),
              color: 'white',
              padding: '0.3rem 0.8rem',
              borderRadius: '15px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              {request.businessExists ? '✓ Business Found' : '✗ Business Not Found'}
            </div>
            <button
              onClick={() => toggleRequestExpansion(request.id)}
              style={{
                backgroundColor: colors.mediumBlue,
                color: 'white',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}
            >
              {isExpanded ? '▲ Collapse' : '▼ View Details'}
            </button>
          </div>
        </div>

        {/* User's Change Request */}
        <div style={{
          backgroundColor: '#f8f9ff',
          padding: '1rem',
          borderRadius: '8px',
          border: `1px solid ${colors.lightBlue}`,
          marginBottom: '1rem'
        }}>
          <strong style={{ color: colors.darkNavy, display: 'block', marginBottom: '0.5rem' }}>
            📝 User's Requested Value:
          </strong>
          {renderRequestedValue()}
        </div>

        {/* Current Value Display */}
        {request.businessData && (
          <div style={{
            backgroundColor: '#f0f8ff',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #b0d4f1',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: colors.darkNavy, display: 'block', marginBottom: '0.5rem' }}>
              📋 Current Value in System:
            </strong>
            <div style={{ 
              margin: '0', 
              color: colors.mediumGray, 
              lineHeight: '1.5',
              backgroundColor: 'white',
              padding: '0.8rem',
              borderRadius: '5px',
              border: '1px solid #e0e0e0',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}>
              {request.currentValue || 'No current value'}
            </div>
          </div>
        )}

        {/* Expanded Business Details */}
        {isExpanded && request.businessData && (
          <div style={{
            backgroundColor: '#fff8e1',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #ffcc02',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: colors.darkNavy, display: 'block', marginBottom: '1rem' }}>
              📋 Complete Business Information:
            </strong>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>Name:</strong> {request.businessData.name || 'N/A'}
                </p>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>Category:</strong> {request.businessData.category || 'N/A'}
                </p>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>District:</strong> {request.businessData.district || 'N/A'}
                </p>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>Location:</strong> {request.businessData.location || 'N/A'}
                </p>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>Address:</strong> {request.businessData.address || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>Contact:</strong> {request.businessData.contact || 'N/A'}
                </p>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>Email:</strong> {request.businessData.email || 'N/A'}
                </p>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>WhatsApp:</strong> {request.businessData.whatsapp || 'N/A'}
                </p>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>Website:</strong> {request.businessData.website || 'N/A'}
                </p>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>Facebook:</strong> {request.businessData.facebook || 'N/A'}
                </p>
              </div>
            </div>
            {request.businessData.about && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
                  <strong>About:</strong> {request.businessData.about}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Admin Update Section */}
        {request.businessExists && (
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '1rem',
            borderRadius: '8px',
            border: '2px dashed #28a745',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: colors.darkNavy, display: 'block', marginBottom: '1rem' }}>
              🔧 Admin Update Section:
            </strong>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: colors.darkNavy,
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  Field to Update: <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  name="fieldToUpdate"
                  value={adminData.fieldToUpdate}
                  onChange={handleAdminInputChange}
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    border: `2px solid ${colors.lightBlue}`,
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    backgroundColor: 'white',
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">Select field</option>
                  {Object.keys(fieldMappings).map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic form field based on selection */}
            {renderAdminFormField()}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}>
          {request.businessExists ? (
            <button
              onClick={() => handleApproveUpdate(request, adminData)}
              disabled={isProcessing || !validateAdminInput(adminData.fieldToUpdate, adminData)}
              style={{
                backgroundColor: (isProcessing || !validateAdminInput(adminData.fieldToUpdate, adminData)) ? '#cccccc' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '0.7rem 1.5rem',
                borderRadius: '5px',
                cursor: (isProcessing || !validateAdminInput(adminData.fieldToUpdate, adminData)) ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                minWidth: '120px'
              }}
            >
              {isProcessing ? 'Updating...' : 'Approve Update'}
            </button>
          ) : (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '0.7rem 1rem',
              borderRadius: '5px',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Cannot update: Business not found
            </div>
          )}
          
          <button
            onClick={() => handleRejectUpdate(request)}
            disabled={isProcessing}
            style={{
              backgroundColor: isProcessing ? '#cccccc' : '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.7rem 1.5rem',
              borderRadius: '5px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              minWidth: '100px'
            }}
          >
            {isProcessing ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main style={{
        flex: 1,
        padding: '3rem',
        backgroundColor: colors.lightGray,
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: `4px solid ${colors.lightBlue}`,
            borderTop: `4px solid ${colors.mediumBlue}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <h2 style={{ color: colors.darkNavy }}>Loading update requests...</h2>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </main>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .update-business-request-main {
              padding: 1.5rem !important;
            }
          }
        `}
      </style>
      
      <main className="update-business-request-main" style={{
        flex: 1,
        padding: '3rem',
        backgroundColor: colors.lightGray,
        minHeight: '60vh',
        width: '100%'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              color: colors.darkNavy,
              marginBottom: '0.5rem',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}>
              Business Update Requests
            </h1>
            <p style={{ 
              color: colors.mediumGray, 
              fontSize: '1.1rem',
              marginBottom: '1rem'
            }}>
              Review and process business information update requests from users.
              Select the field and provide the exact new value when approving updates.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                backgroundColor: colors.mediumBlue,
                color: 'white',
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                fontWeight: '500'
              }}>
                Total Requests: {updateRequests.length}
              </div>
              <div style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                fontWeight: '500'
              }}>
                Valid: {updateRequests.filter(r => r.businessExists).length}
              </div>
              <div style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                fontWeight: '500'
              }}>
                Invalid: {updateRequests.filter(r => !r.businessExists).length}
              </div>
            </div>
          </div>

          {updateRequests.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              padding: '3rem',
              borderRadius: '10px',
              textAlign: 'center',
              color: colors.mediumGray,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: '1rem', color: colors.darkNavy }}>
                No Update Requests
              </h3>
              <p>There are no business update requests waiting for review at the moment.</p>
            </div>
          ) : (
            updateRequests.map((request, index) => (
              <UpdateRequestCard
                key={request.id}
                request={request}
                index={index}
              />
            ))
          )}
        </div>
      </main>
    </>
  );
};

export default UpdateBusinessRequest;