// services/CloudinaryService.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

class CloudinaryService {
  // Upload image to Cloudinary
  static async uploadImage(file, folder = 'business-images') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fetch images from your backend API
  static async fetchImages(page = 1, limit = 20, search = '', folder = 'business-images') {
    try {
      const url = `${API_BASE_URL}/cloudinary/images?page=${page}&limit=${limit}&search=${search}&folder=${folder}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Fetch images error:', error);
      return {
        success: false,
        error: error.message,
        resources: [],
        total_count: 0
      };
    }
  }

  // Fetch storage statistics
  static async fetchStorageStats(folder = 'business-images') {
    try {
      const response = await fetch(`${API_BASE_URL}/cloudinary/stats?folder=${folder}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Fetch stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete single image
  static async deleteImage(publicId) {
    try {
      const response = await fetch(`${API_BASE_URL}/cloudinary/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id: publicId }),
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete multiple images
  static async deleteMultipleImages(publicIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/cloudinary/delete-multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_ids: publicIds }),
      });

      if (!response.ok) {
        throw new Error(`Bulk delete failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Bulk delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate optimized image URL
  static generateUrl(publicId, options = {}) {
    if (!publicId || !process.env.REACT_APP_CLOUDINARY_CLOUD_NAME) {
      return '';
    }

    const baseUrl = `https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    // Build transformation string
    const transformations = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    
    const transformString = transformations.length > 0 ? `/${transformations.join(',')}` : '';
    
    return `${baseUrl}${transformString}/${publicId}`;
  }

  // Validate image file
  static validateImage(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    } = options;

    if (!file) {
      return {
        valid: false,
        error: 'No file provided'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum size ${(maxSize / 1024 / 1024).toFixed(2)}MB`
      };
    }

    return {
      valid: true,
      file
    };
  }

  // Test backend connection
  static async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/cloudinary/health`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default CloudinaryService;