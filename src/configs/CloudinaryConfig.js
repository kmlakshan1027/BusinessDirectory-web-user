// configs/CloudinaryConfig.js
import CloudinaryService from '../services/CloudinaryService';

// Validate environment variables on import
const validateEnvironmentVariables = () => {
  const required = [
    'REACT_APP_CLOUDINARY_CLOUD_NAME',
    'REACT_APP_CLOUDINARY_UPLOAD_PRESET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required Cloudinary environment variables:', missing);
    console.error('Please add these to your .env file:');
    missing.forEach(key => {
      console.error(`${key}=your_value_here`);
    });
  }
  
  return missing.length === 0;
};

// Validate on module load
const isConfigValid = validateEnvironmentVariables();

// Cloudinary configuration object
export const cloudinaryConfig = {
  cloud_name: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.REACT_APP_CLOUDINARY_API_KEY,
  api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET, // Note: Don't expose this in frontend
  upload_preset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
  isValid: isConfigValid
};

// Upload preset configuration
export const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

// Function to upload image to Cloudinary
export const uploadImageToCloudinary = async (file, folder = 'business-images') => {
  if (!isConfigValid) {
    return {
      success: false,
      error: 'Cloudinary configuration is invalid. Please check your environment variables.'
    };
  }
  
  return await CloudinaryService.uploadImage(file, folder);
};

// Function to delete image from Cloudinary via backend API
export const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) {
    return {
      success: false,
      error: 'Public ID is required for deletion'
    };
  }
  
  return await CloudinaryService.deleteImage(publicId);
};

// Function to delete multiple images from Cloudinary
export const deleteMultipleImagesFromCloudinary = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return {
      success: false,
      error: 'Array of public IDs is required for deletion'
    };
  }
  
  return await CloudinaryService.deleteMultipleImages(publicIds);
};

// Function to generate optimized image URLs
export const generateOptimizedImageUrl = (publicId, options = {}) => {
  return CloudinaryService.generateUrl(publicId, {
    quality: 'auto',
    format: 'auto',
    ...options
  });
};

// Function to validate image before upload
export const validateImageFile = (file, options = {}) => {
  return CloudinaryService.validateImage(file, options);
};

// Default image transformation options
export const defaultTransformations = {
  thumbnail: { width: 150, height: 150, crop: 'fill', quality: 'auto' },
  medium: { width: 400, height: 300, crop: 'fill', quality: 'auto' },
  large: { width: 800, height: 600, crop: 'fill', quality: 'auto' },
  fullscreen: { width: 1200, height: 800, crop: 'fill', quality: 'auto' }
};

// Helper function to get image URL with specific transformation
export const getTransformedImageUrl = (publicId, transformation = 'medium') => {
  if (!publicId || !cloudinaryConfig.cloud_name) {
    return '';
  }
  
  const options = defaultTransformations[transformation] || defaultTransformations.medium;
  return generateOptimizedImageUrl(publicId, options);
};

export default {
  config: cloudinaryConfig,
  uploadImage: uploadImageToCloudinary,
  deleteImage: deleteImageFromCloudinary,
  deleteMultipleImages: deleteMultipleImagesFromCloudinary,
  generateUrl: generateOptimizedImageUrl,
  validateFile: validateImageFile,
  transformations: defaultTransformations,
  getTransformedUrl: getTransformedImageUrl
};