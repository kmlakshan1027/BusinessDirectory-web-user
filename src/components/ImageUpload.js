// components/ImageUpload.js
import React, { useState } from 'react';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '../configs/CloudinaryConfig';
import { colors } from '../utils/colors';

const ImageUpload = ({ 
  onImagesChange, 
  maxImages = 5, 
  currentImages = [], 
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState('');
  const [removing, setRemoving] = useState({}); 

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    const maxSizePerFile = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, JPEG, and PNG images are allowed';
    }
    
    if (file.size > maxSizePerFile) {
      return `Image "${file.name}" is too large. Maximum size is 5MB per image`;
    }
    
    return null;
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    setErrors('');
    
    // Check total number of images
    if (currentImages.length + files.length > maxImages) {
      setErrors(`Cannot add ${files.length} more images. Maximum ${maxImages} images total allowed`);
      return;
    }
    
    // Validate each file
    for (let file of files) {
      const error = validateFile(file);
      if (error) {
        setErrors(error);
        return;
      }
    }
    
    // Upload files to Cloudinary
    setUploading(true);
    const uploadedImages = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${Date.now()}-${i}`;
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { fileName: file.name, progress: 0, status: 'uploading' }
        }));
        
        const result = await uploadImageToCloudinary(file, 'business-images');
        
        if (result.success) {
          uploadedImages.push({
            id: fileId,
            name: file.name,
            size: file.size,
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
            format: result.format
          });
          
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], progress: 100, status: 'completed' }
          }));
        } else {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], status: 'error', error: result.error }
          }));
          setErrors(`Failed to upload ${file.name}: ${result.error}`);
        }
      }
      
      // Update parent component with new images
      if (uploadedImages.length > 0) {
        onImagesChange([...currentImages, ...uploadedImages]);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrors('An unexpected error occurred during upload');
    } finally {
      setUploading(false);
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress({});
      }, 3000);
    }
    
    // Clear the input
    e.target.value = '';
  };

  const removeImage = async (imageId) => {
    const imageToRemove = currentImages.find(img => img.id === imageId);
    if (!imageToRemove) return;

    // Set removing state for this image
    setRemoving(prev => ({ ...prev, [imageId]: true }));

    try {
      // Delete from Cloudinary first
      if (imageToRemove.publicId) {
        console.log(`Deleting image from Cloudinary: ${imageToRemove.publicId}`);
        const deleteResult = await deleteImageFromCloudinary(imageToRemove.publicId);
        
        if (!deleteResult.success) {
          console.error(`Failed to delete image from Cloudinary:`, deleteResult.error);
          setErrors(`Failed to delete image from cloud storage: ${deleteResult.error || deleteResult.message}`);
          return; // Don't remove from UI if cloud deletion failed
        } else {
          console.log(`Successfully deleted image ${imageToRemove.publicId} from Cloudinary`);
        }
      }

      // Remove from local state only after successful Cloudinary deletion
      const updatedImages = currentImages.filter(img => img.id !== imageId);
      onImagesChange(updatedImages);
      setErrors('');
      
    } catch (error) {
      console.error('Error removing image:', error);
      setErrors(`Failed to remove image: ${error.message}`);
    } finally {
      // Clear removing state
      setRemoving(prev => {
        const newState = { ...prev };
        delete newState[imageId];
        return newState;
      });
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.7rem',
        color: colors.darkNavy,
        fontWeight: 'bold',
        fontSize: '1rem'
      }}>
        Business Images
      </label>
      
      {/* File Input */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          multiple
          onChange={handleFileSelect}
          disabled={disabled || uploading || currentImages.length >= maxImages}
          style={{
            width: '100%',
            padding: '1rem',
            border: `2px solid ${colors.lightBlue}`,
            borderRadius: '8px',
            fontSize: '1rem',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            backgroundColor: (disabled || uploading || currentImages.length >= maxImages) ? '#f0f0f0' : 'white',
            cursor: (disabled || uploading || currentImages.length >= maxImages) ? 'not-allowed' : 'pointer'
          }}
        />
      </div>
      
      {/* Helper Text */}
      <p style={{
        fontSize: '0.85rem',
        color: colors.mediumBlue,
        margin: '0.5rem 0',
        fontStyle: 'italic'
      }}>
        Upload JPG, JPEG, or PNG images. Maximum {maxImages} images, 5MB each.
        {uploading && ' Uploading in progress...'}
      </p>
      
      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          border: `1px solid ${colors.lightBlue}`,
          borderRadius: '8px',
          backgroundColor: '#f0f8ff'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: colors.darkNavy }}>
            Upload Progress
          </h4>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} style={{
              marginBottom: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>{progress.fileName}</span>
                <span style={{
                  fontSize: '0.8rem',
                  color: progress.status === 'completed' ? 'green' : 
                         progress.status === 'error' ? 'red' : colors.mediumBlue,
                  fontWeight: '500'
                }}>
                  {progress.status === 'completed' ? '✓ Completed' :
                   progress.status === 'error' ? '✗ Failed' : 'Uploading...'}
                </span>
              </div>
              {progress.error && (
                <div style={{ fontSize: '0.8rem', color: 'red', marginTop: '0.25rem' }}>
                  {progress.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Error Messages */}
      {errors && (
        <div style={{
          color: 'red',
          fontSize: '0.85rem',
          marginBottom: '1rem',
          padding: '0.5rem',
          backgroundColor: '#ffe6e6',
          borderRadius: '4px',
          border: '1px solid #ffcccc'
        }}>
          {errors}
        </div>
      )}
      
      {/* Display Uploaded Images */}
      {currentImages.length > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          border: `1px solid ${colors.lightBlue}`,
          borderRadius: '8px',
          backgroundColor: '#f8f9ff'
        }}>
          <h4 style={{
            margin: '0 0 1rem 0',
            color: colors.darkNavy,
            fontSize: '1rem'
          }}>
            Uploaded Images ({currentImages.length}/{maxImages})
          </h4>
          
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {currentImages.map((image) => (
              <div key={image.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                opacity: removing[image.id] ? 0.6 : 1,
                transition: 'opacity 0.3s ease'
              }}>
                {/* Image Preview */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  marginRight: '1rem',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #ddd'
                }}>
                  <img
                    src={image.url}
                    alt={image.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                
                {/* Image Details */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '500',
                    color: colors.darkNavy,
                    marginBottom: '0.3rem'
                  }}>
                    {image.name}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: colors.mediumBlue,
                    marginBottom: '0.2rem'
                  }}>
                    Size: {formatFileSize(image.size)} | Format: {image.format?.toUpperCase()}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: colors.mediumBlue
                  }}>
                    Dimensions: {image.width} × {image.height}px
                  </div>
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  disabled={uploading || removing[image.id]}
                  style={{
                    backgroundColor: removing[image.id] ? '#cccccc' : '#ff4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: (uploading || removing[image.id]) ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    opacity: (uploading || removing[image.id]) ? 0.6 : 1,
                    minWidth: '80px'
                  }}
                  onMouseOver={(e) => {
                    if (!uploading && !removing[image.id]) {
                      e.target.style.backgroundColor = '#cc0000';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!uploading && !removing[image.id]) {
                      e.target.style.backgroundColor = '#ff4444';
                    }
                  }}
                >
                  {removing[image.id] ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;