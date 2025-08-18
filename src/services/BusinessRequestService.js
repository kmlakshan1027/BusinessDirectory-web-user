//BusinessRequestService.js
import { db } from '../configs/FirebaseConfigs.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Service to handle business request operations with Firestore
 */
class BusinessRequestService {
  
  /**
   * Adds a new business request to TemporaryBusinessDetails collection
   * @param {Object} businessData - The business form data
   * @returns {Promise<string>} - Returns the document ID of the created request
   */
  static async addBusinessRequest(businessData) {
    try {
      console.log('BusinessRequestService: Starting submission with data:', businessData);
      
      // Validate that Firebase is initialized
      if (!db) {
        throw new Error('Firebase database is not initialized');
      }
      
      
      
      // Prepare the document data structure exactly as specified
      const requestData = {
        // Basic business information
        about: String(businessData.about || '').trim(),
        address: String(businessData.address || '').trim(),
        category: String(businessData.category || '').trim(),
        contact: String(businessData.contact || '').trim(),
        district: String(businessData.district || '').trim(),
        email: String(businessData.email || '').toLowerCase().trim(),
        facebook: String(businessData.facebook || '').trim(),
        location: String(businessData.location || '').trim(),
        locationUrl: String(businessData.locationUrl || '').trim(),
        name: String(businessData.name || '').trim(),
        website: String(businessData.website || '').trim(),
        whatsapp: String(businessData.whatsapp || '').trim(),
        
        // Operating information
        alwaysOpen: Boolean(businessData.alwaysOpen),
        operatingTimes: businessData.alwaysOpen ? null : (businessData.operatingTimes || null),
        
        
        
        // Request metadata
        status: 'pending',
        requestDate: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        
        // Additional tracking fields
        approved: false,
        rejected: false,
        reviewNotes: ''
      };

      console.log('BusinessRequestService: Prepared data for Firestore:', requestData);

      // Test Firebase connection first
      try {
        const testCollection = collection(db, 'TemporaryBusinessDetails');
        console.log('BusinessRequestService: Firebase connection test successful');
      } catch (connectionError) {
        console.error('BusinessRequestService: Firebase connection failed:', connectionError);
        throw new Error('Cannot connect to Firebase. Please check your internet connection and Firebase configuration.');
      }

      // Add document to TemporaryBusinessDetails collection
      console.log('BusinessRequestService: Adding document to Firestore...');
      const docRef = await addDoc(
        collection(db, 'TemporaryBusinessDetails'), 
        requestData
      );

      console.log('BusinessRequestService: Document created successfully with ID:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('BusinessRequestService: Error adding business request:', error);
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check Firebase security rules or authentication.');
      } else if (error.code === 'unavailable') {
        throw new Error('Firebase service is temporarily unavailable. Please try again later.');
      } else if (error.code === 'failed-precondition') {
        throw new Error('Firebase configuration error. Please contact support.');
      } else if (error.message.includes('image')) {
        throw new Error(`Image upload error: ${error.message}`);
      } else {
        throw new Error(`Failed to submit business request: ${error.message}`);
      }
    }
  }

  

  /**
   * Validates business data before submission
   * @param {Object} businessData - The business form data to validate
   * @returns {Object} - Validation result with isValid boolean and errors array
   */
  static validateBusinessData(businessData) {
    const errors = [];
    
    console.log('BusinessRequestService: Validating data:', businessData);
    
    // Check if data exists
    if (!businessData || typeof businessData !== 'object') {
      errors.push('Invalid business data provided');
      return { isValid: false, errors };
    }
    
    // Required field validations
    if (!businessData.name || typeof businessData.name !== 'string' || !businessData.name.trim()) {
      errors.push('Business name is required');
    } else if (businessData.name.trim().length < 2) {
      errors.push('Business name must be at least 2 characters long');
    } else if (businessData.name.trim().length > 100) {
      errors.push('Business name must not exceed 100 characters');
    }
    
    if (!businessData.address || typeof businessData.address !== 'string' || !businessData.address.trim()) {
      errors.push('Business address is required');
    }
    
    if (!businessData.about || typeof businessData.about !== 'string' || !businessData.about.trim()) {
      errors.push('Business description is required');
    } else {
      // Check word count for about section
      const aboutWords = businessData.about.trim().split(/\s+/).length;
      if (aboutWords > 200) {
        errors.push('Business description must not exceed 200 words');
      }
    }
    
    if (!businessData.category || typeof businessData.category !== 'string' || !businessData.category.trim()) {
      errors.push('Business category is required');
    }
    
    if (!businessData.location || typeof businessData.location !== 'string' || !businessData.location.trim()) {
      errors.push('Location is required');
    }
    
    if (!businessData.district || typeof businessData.district !== 'string' || !businessData.district.trim()) {
      errors.push('District is required');
    }
    
    if (!businessData.contact || typeof businessData.contact !== 'string' || !businessData.contact.trim()) {
      errors.push('Contact number is required');
    } else {
      // Validate Sri Lankan phone number format (+94xxxxxxxxx)
      const phoneRegex = /^\+94\d{9}$/;
      if (!phoneRegex.test(businessData.contact)) {
        errors.push('Contact number must be in format +94xxxxxxxxx with 9 digits after +94');
      }
    }
    
    // Optional WhatsApp validation
    if (businessData.whatsapp && businessData.whatsapp.trim()) {
      const whatsappRegex = /^\+94\d{9}$/;
      if (!whatsappRegex.test(businessData.whatsapp)) {
        errors.push('WhatsApp number must be in format +94xxxxxxxxx with 9 digits after +94');
      }
    }
    
    // Email validation if provided
    if (businessData.email && businessData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(businessData.email.trim())) {
        errors.push('Please enter a valid email address');
      }
    }
    
    // URL validations if provided
    const validateUrl = (url, fieldName) => {
      if (url && typeof url === 'string' && url.trim()) {
        try {
          const urlObj = new URL(url.trim());
          if (!['http:', 'https:'].includes(urlObj.protocol)) {
            errors.push(`${fieldName} URL must start with http:// or https://`);
          }
        } catch {
          errors.push(`Please enter a valid ${fieldName} URL`);
        }
      }
    };
    
    validateUrl(businessData.website, 'Website');
    validateUrl(businessData.facebook, 'Facebook');
    validateUrl(businessData.locationUrl, 'Location');
    
    // Operating times validation
    if (businessData.alwaysOpen !== true && businessData.alwaysOpen !== false) {
      // Set default if not boolean
      businessData.alwaysOpen = false;
    }
    
    if (!businessData.alwaysOpen) {
      if (!businessData.operatingTimes || typeof businessData.operatingTimes !== 'object') {
        errors.push('Please set operating times or mark as always open');
      } else {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const hasAnyOpenDay = daysOfWeek.some(day => {
          const dayData = businessData.operatingTimes[day];
          return dayData && dayData.isOpen === true;
        });
        
        if (!hasAnyOpenDay) {
          errors.push('Please select at least one operating day or mark as always open');
        }
        
        // Validate time format for open days
        daysOfWeek.forEach(day => {
          const dayData = businessData.operatingTimes[day];
          if (dayData && dayData.isOpen) {
            if (!dayData.openTime || !dayData.closeTime) {
              errors.push(`Please set both open and close times for ${day}`);
            } else {
              // Validate time format (HH:MM)
              const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
              if (!timeRegex.test(dayData.openTime)) {
                errors.push(`Invalid open time format for ${day}`);
              }
              if (!timeRegex.test(dayData.closeTime)) {
                errors.push(`Invalid close time format for ${day}`);
              }
              
              // Validate that close time is after open time
              if (timeRegex.test(dayData.openTime) && timeRegex.test(dayData.closeTime)) {
                const openTime = new Date(`2000-01-01T${dayData.openTime}`);
                const closeTime = new Date(`2000-01-01T${dayData.closeTime}`);
                if (closeTime <= openTime) {
                  errors.push(`Close time must be after open time for ${day}`);
                }
              }
            }
          }
        });
      }
    }
    
    
    
    console.log('BusinessRequestService: Validation completed');
    console.log('BusinessRequestService: Validation errors:', errors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  

  /**
   * Test Firebase connection
   * @returns {Promise<boolean>} - Returns true if connection is successful
   */
  static async testFirebaseConnection() {
    try {
      console.log('BusinessRequestService: Testing Firebase connection...');
      const testCollection = collection(db, 'TemporaryBusinessDetails');
      console.log('BusinessRequestService: Firebase connection successful');
      return true;
    } catch (error) {
      console.error('BusinessRequestService: Firebase connection failed:', error);
      return false;
    }
  }

  
}

export default BusinessRequestService;