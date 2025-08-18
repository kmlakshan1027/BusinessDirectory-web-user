// components/ImageUpload.js
import React, { useState } from 'react';
import { ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { storage } from '../configs/FirebaseConfigs.js';
import { colors } from '../utils/colors.js';

const ImageUpload = ({ 
  images, 
  setImages, 
  validationErrors, 
  setValidationErrors 
}) => {
  const [uploading, setUploading] = useState(false);

  // Validate image file
  const validateImage = (file) => {
    const errors = [];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('Please select only image files');
    }
    
    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('Image size must be less than 5MB');
    }
    
    return errors;
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    // Check maximum images limit
    if (images.length + files.length > 5) {
      alert(`You can upload maximum 5 images. Currently you have ${images.length} images.`);
      return;
    }

    setUploading(true);
    
    try {
      const newImages = [];
      
      for (const file of files) {
        // Validate each file
        const fileErrors = validateImage(file);
        if (fileErrors.length > 0) {
          alert(`Error with file ${file.name}: ${fileErrors.join(', ')}`);
          continue;
        }

        // Create image object with preview
        const imageObject = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file: file,
          name: file.name,
          size: file.size,
          preview: URL.createObjectURL(file),
          uploaded: false,
          storageRef: null,
          downloadURL: null
        };
        
        newImages.push(imageObject);
      }
      
      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages]);
        
        // Clear validation errors if any
        if (validationErrors?.images) {
          setValidationErrors(prev => ({
            ...prev,
            images: undefined
          }));
        }
      }
      
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Error processing images. Please try again.');
    } finally {
      setUploading(false);
      // Clear the input value to allow selecting the same file again
      event.target.value = '';
    }
  };

  // Remove image
  const removeImage = async (imageId) => {
    try {
      const imageToRemove = images.find(img => img.id === imageId);
      
      if (imageToRemove) {
        // Clean up preview URL
        if (imageToRemove.preview) {
          URL.revokeObjectURL(imageToRemove.preview);
        }
        
        // If image was uploaded to Firebase, delete it
        if (imageToRemove.uploaded && imageToRemove.storageRef) {
          try {
            await deleteObject(imageToRemove.storageRef);
            console.log('Image deleted from Firebase Storage');
          } catch (deleteError) {
            console.error('Error deleting image from storage:', deleteError);
            // Continue with removal from state even if Firebase deletion fails
          }
        }
        
        // Remove from state
        setImages(prev => prev.filter(img => img.id !== imageId));
      }
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Error removing image. Please try again.');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{
        color: colors.darkNavy,
        marginBottom: '1rem',
        fontSize: '1.3rem',
        fontWeight: 'bold'
      }}>
        Business Images
      </h3>
      
      <p style={{
        color: colors.mediumBlue,
        marginBottom: '1.5rem',
        fontSize: '0.95rem',
        lineHeight: '1.5'
      }}>
        Upload your business images including your business logo. We will create an attractive cover image for you. 
        Maximum 5 images, each under 5MB.
      </p>

      {/* Upload Button */}
      {images.length < 5 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            backgroundColor: colors.lightBlue,
            color: 'white',
            borderRadius: '8px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'background-color 0.3s',
            opacity: uploading ? 0.7 : 1
          }}>
            {uploading ? 'Processing...' : '+ Add Images'}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.85rem',
            color: colors.mediumBlue
          }}>
            {images.length}/5 images selected
          </div>
        </div>
      )}

      {/* Images Preview */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {images.map((image) => (
            <div key={image.id} style={{
              border: `2px solid ${colors.lightBlue}`,
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'white',
              position: 'relative'
            }}>
              {/* Image Preview */}
              <div style={{
                width: '100%',
                height: '150px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <img
                  src={image.preview}
                  alt={image.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Upload Status Indicator */}
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  backgroundColor: image.uploaded ? '#4CAF50' : '#FF9800',
                  color: 'white',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  {image.uploaded ? 'Uploaded' : 'Ready'}
                </div>
              </div>
              
              {/* Image Details */}
              <div style={{
                padding: '0.75rem'
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: colors.darkNavy,
                  marginBottom: '0.3rem',
                  wordBreak: 'break-word'
                }}>
                  {image.name.length > 20 ? `${image.name.substring(0, 20)}...` : image.name}
                </div>
                
                <div style={{
                  fontSize: '0.75rem',
                  color: colors.mediumBlue,
                  marginBottom: '0.5rem'
                }}>
                  {formatFileSize(image.size)}
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#cc3333'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#ff4444'}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Error */}
      {validationErrors?.images && (
        <div style={{
          color: '#ff4444',
          fontSize: '0.9rem',
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#ffe6e6',
          borderRadius: '4px',
          border: '1px solid #ff4444'
        }}>
          {validationErrors.images}
        </div>
      )}

      {/* Guidelines */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9ff',
        borderRadius: '8px',
        border: `1px solid ${colors.lightBlue}`
      }}>
        <h4 style={{
          color: colors.darkNavy,
          margin: '0 0 0.5rem 0',
          fontSize: '1rem',
          fontWeight: '600'
        }}>
          Image Upload Guidelines:
        </h4>
        <ul style={{
          margin: 0,
          paddingLeft: '1.2rem',
          color: colors.mediumBlue,
          fontSize: '0.9rem',
          lineHeight: '1.5'
        }}>
          <li>Maximum 5 images allowed</li>
          <li>Each image must be under 5MB</li>
          <li>Include your business logo for better presentation</li>
          <li>Supported formats: JPG, PNG, GIF, WebP</li>
          <li>Images will be uploaded when you submit the form</li>
        </ul>
      </div>
    </div>
  );
};

// UPDATED uploadBusinessImages function - Improved with better error handling
export const uploadBusinessImages = async (images, businessId) => {
  console.log('=== UPLOAD BUSINESS IMAGES FUNCTION START ===');
  console.log('Input images:', images?.length || 0);
  console.log('Business ID:', businessId);
  
  // Validation checks
  if (!images || !Array.isArray(images) || images.length === 0) {
    console.log('No images provided, returning empty array');
    return [];
  }
  
  if (!businessId || typeof businessId !== 'string') {
    throw new Error('Invalid businessId provided');
  }
  
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }
  
  const uploadedImages = [];
  const uploadPromises = [];
  
  console.log(`Starting parallel upload of ${images.length} images...`);
  
  // Create upload promises for all images
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    const uploadPromise = (async (imageIndex) => {
      try {
        console.log(`Processing image ${imageIndex + 1}/${images.length}: ${image.name}`);
        
        // Validate image object
        if (!image || !image.file) {
          throw new Error(`Image ${imageIndex + 1} has no file data`);
        }
        
        if (!(image.file instanceof File)) {
          throw new Error(`Image ${imageIndex + 1} file is not a valid File object`);
        }
        
        // Generate unique filename with proper sanitization
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const fileExtension = image.file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const baseName = image.file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${businessId}_${timestamp}_${randomId}_${baseName}.${fileExtension}`;
        
        // Create storage path
        const storagePath = `business-images/${fileName}`;
        const imageRef = ref(storage, storagePath);
        
        console.log(`Uploading to path: ${storagePath}`);
        
        // Upload metadata
        const metadata = {
          contentType: image.file.type || 'image/jpeg',
          customMetadata: {
            businessId: businessId,
            originalName: image.file.name,
            uploadTime: new Date().toISOString(),
            imageId: image.id || `img_${imageIndex}`
          }
        };
        
        // Upload file to Firebase Storage
        console.log(`Starting upload for ${fileName}...`);
        const uploadResult = await uploadBytes(imageRef, image.file, metadata);
        console.log(`Upload completed for ${fileName}`);
        
        // Get download URL
        console.log(`Getting download URL for ${fileName}...`);
        const downloadURL = await getDownloadURL(imageRef);
        console.log(`Download URL obtained: ${downloadURL.substring(0, 50)}...`);
        
        // Validate download URL
        if (!downloadURL || typeof downloadURL !== 'string' || !downloadURL.startsWith('https://')) {
          throw new Error(`Invalid download URL for ${fileName}`);
        }
        
        // Create image data object
        const imageData = {
          id: image.id || `img_${imageIndex}_${timestamp}`,
          fileName: fileName,
          storagePath: storagePath,
          downloadURL: downloadURL,
          originalName: image.file.name,
          size: image.file.size,
          contentType: image.file.type || 'image/jpeg',
          uploadTime: new Date().toISOString(),
          businessId: businessId,
          storageRef: imageRef,
          uploadIndex: imageIndex
        };
        
        console.log(`✅ Image ${imageIndex + 1} processed successfully`);
        return imageData;
        
      } catch (uploadError) {
        console.error(`❌ Error uploading image ${imageIndex + 1}:`, uploadError);
        
        // Provide specific error messages
        let errorMessage = 'Unknown upload error';
        
        if (uploadError.code) {
          switch (uploadError.code) {
            case 'storage/unauthorized':
              errorMessage = 'Permission denied. Check Firebase Storage security rules.';
              break;
            case 'storage/canceled':
              errorMessage = 'Upload was canceled.';
              break;
            case 'storage/quota-exceeded':
              errorMessage = 'Storage quota exceeded.';
              break;
            case 'storage/invalid-format':
              errorMessage = 'Invalid file format.';
              break;
            case 'storage/retry-limit-exceeded':
              errorMessage = 'Upload failed after multiple retries.';
              break;
            case 'storage/invalid-checksum':
              errorMessage = 'File integrity check failed.';
              break;
            default:
              errorMessage = `Storage error: ${uploadError.code}`;
          }
        } else {
          errorMessage = uploadError.message || 'Upload failed';
        }
        
        throw new Error(`Failed to upload ${image.name}: ${errorMessage}`);
      }
    })(i);
    
    uploadPromises.push(uploadPromise);
  }
  
  try {
    // Wait for all uploads to complete
    console.log('Waiting for all uploads to complete...');
    const results = await Promise.all(uploadPromises);
    
    // Filter out any failed uploads and sort by upload index
    const successfulUploads = results
      .filter(result => result && result.downloadURL)
      .sort((a, b) => (a.uploadIndex || 0) - (b.uploadIndex || 0));
    
    console.log(`✅ Upload batch completed: ${successfulUploads.length}/${images.length} successful`);
    
    if (successfulUploads.length === 0) {
      throw new Error('No images were uploaded successfully');
    }
    
    if (successfulUploads.length < images.length) {
      console.warn(`⚠️ Warning: Only ${successfulUploads.length} out of ${images.length} images were uploaded successfully`);
    }
    
    // Log final results
    console.log('=== UPLOAD RESULTS ===');
    console.log('Total images processed:', images.length);
    console.log('Successful uploads:', successfulUploads.length);
    console.log('Download URLs:', successfulUploads.map(img => img.downloadURL.substring(0, 50) + '...'));
    console.log('=== UPLOAD BUSINESS IMAGES FUNCTION END ===');
    
    return successfulUploads;
    
  } catch (batchError) {
    console.error('=== BATCH UPLOAD ERROR ===');
    console.error('Error details:', batchError);
    
    // Clean up any partial uploads if possible
    console.log('Attempting to clean up partial uploads...');
    for (const promise of uploadPromises) {
      try {
        const result = await promise.catch(() => null);
        if (result && result.storageRef) {
          try {
            await deleteObject(result.storageRef);
            console.log(`Cleaned up: ${result.fileName}`);
          } catch (cleanupError) {
            console.warn(`Could not clean up: ${result.fileName}`, cleanupError);
          }
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    throw new Error(`Batch upload failed: ${batchError.message}`);
  }
};

export default ImageUpload;