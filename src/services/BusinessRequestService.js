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
      // Prepare the document data structure
      const requestData = {
        // Basic business information
        name: businessData.name || '',
        address: businessData.address || '',
        about: businessData.about || '',
        contact: businessData.contact || '',
        whatsapp: businessData.whatsapp || '',
        email: businessData.email || '',
        facebook: businessData.facebook || '',
        website: businessData.website || '',
        category: businessData.category || '',
        location: businessData.location || '', // Changed from 'district' to 'location'
        district: businessData.district || '', // New district field
        locationUrl: businessData.locationUrl || '',
        
        // Business images
        businessImages: businessData.businessImages || [],
        
        // Operating hours information
        alwaysOpen: businessData.alwaysOpen || false,
        
        // Operating times (only if not always open)
        operatingTimes: businessData.alwaysOpen ? null : {
          monday: {
            isOpen: businessData.operatingTimes?.monday?.isOpen || false,
            openTime: businessData.operatingTimes?.monday?.openTime || '',
            closeTime: businessData.operatingTimes?.monday?.closeTime || ''
          },
          tuesday: {
            isOpen: businessData.operatingTimes?.tuesday?.isOpen || false,
            openTime: businessData.operatingTimes?.tuesday?.openTime || '',
            closeTime: businessData.operatingTimes?.tuesday?.closeTime || ''
          },
          wednesday: {
            isOpen: businessData.operatingTimes?.wednesday?.isOpen || false,
            openTime: businessData.operatingTimes?.wednesday?.openTime || '',
            closeTime: businessData.operatingTimes?.wednesday?.closeTime || ''
          },
          thursday: {
            isOpen: businessData.operatingTimes?.thursday?.isOpen || false,
            openTime: businessData.operatingTimes?.thursday?.openTime || '',
            closeTime: businessData.operatingTimes?.thursday?.closeTime || ''
          },
          friday: {
            isOpen: businessData.operatingTimes?.friday?.isOpen || false,
            openTime: businessData.operatingTimes?.friday?.openTime || '',
            closeTime: businessData.operatingTimes?.friday?.closeTime || ''
          },
          saturday: {
            isOpen: businessData.operatingTimes?.saturday?.isOpen || false,
            openTime: businessData.operatingTimes?.saturday?.openTime || '',
            closeTime: businessData.operatingTimes?.saturday?.closeTime || ''
          },
          sunday: {
            isOpen: businessData.operatingTimes?.sunday?.isOpen || false,
            openTime: businessData.operatingTimes?.sunday?.openTime || '',
            closeTime: businessData.operatingTimes?.sunday?.closeTime || ''
          }
        },
        
        // Request metadata
        status: 'pending', // pending, approved, rejected
        requestDate: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };

      // Add document to TemporaryBusinessDetails collection
      const docRef = await addDoc(
        collection(db, 'TemporaryBusinessDetails'), 
        requestData
      );

      console.log('Business request submitted successfully with ID:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('Error adding business request:', error);
      throw new Error(`Failed to submit business request: ${error.message}`);
    }
  }

  /**
   * Validates business data before submission
   * @param {Object} businessData - The business form data to validate
   * @returns {Object} - Validation result with isValid boolean and errors array
   */
  static validateBusinessData(businessData) {
    const errors = [];
    
    // Required field validations
    if (!businessData.name?.trim()) {
      errors.push('Business name is required');
    }
    
    if (!businessData.address?.trim()) {
      errors.push('Business address is required');
    }
    
    if (!businessData.about?.trim()) {
      errors.push('Business description is required');
    }
    
    if (!businessData.category?.trim()) {
      errors.push('Business category is required');
    }
    
    if (!businessData.location?.trim()) { // Changed from 'district' to 'location'
      errors.push('Location is required');
    }
    
    if (!businessData.district?.trim()) {
      errors.push('District is required');
    }
    
    if (!businessData.contact?.trim()) {
      errors.push('Contact number is required');
    }
    
    // Email validation if provided
    if (businessData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(businessData.email.trim())) {
        errors.push('Please enter a valid email address');
      }
    }
    
    // URL validations if provided
    if (businessData.website?.trim()) {
      try {
        new URL(businessData.website.trim());
      } catch {
        errors.push('Please enter a valid website URL');
      }
    }
    
    if (businessData.facebook?.trim()) {
      try {
        new URL(businessData.facebook.trim());
      } catch {
        errors.push('Please enter a valid Facebook URL');
      }
    }
    
    if (businessData.locationUrl?.trim()) {
      try {
        new URL(businessData.locationUrl.trim());
      } catch {
        errors.push('Please enter a valid location URL');
      }
    }
    
    // Operating times validation (if not always open)
    if (!businessData.alwaysOpen && businessData.operatingTimes) {
      const hasAnyOpenDay = Object.values(businessData.operatingTimes).some(day => day.isOpen);
      if (!hasAnyOpenDay) {
        errors.push('Please select at least one operating day or mark as always open');
      }
      
      // Validate time format for open days
      Object.entries(businessData.operatingTimes).forEach(([day, times]) => {
        if (times.isOpen) {
          if (!times.openTime || !times.closeTime) {
            errors.push(`Please set both open and close times for ${day}`);
          } else {
            // Validate that close time is after open time
            const openTime = new Date(`2000-01-01T${times.openTime}`);
            const closeTime = new Date(`2000-01-01T${times.closeTime}`);
            if (closeTime <= openTime) {
              errors.push(`Close time must be after open time for ${day}`);
            }
          }
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default BusinessRequestService;