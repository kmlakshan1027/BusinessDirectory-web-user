// components/Image_Management.js
import React, { useState, useEffect } from 'react';
import { colors } from '../utils/colors';
import CloudinaryService from '../services/CloudinaryService';

const ImageManagement = ({ isOpen, onClose }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState(null);
  
  const imagesPerPage = 20;

  // Fetch storage statistics
  const fetchStorageStats = async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const result = await CloudinaryService.fetchStorageStats('business-images');
      
      if (result.success) {
        setStorageStats(result.stats);
      } else {
        throw new Error(result.error || 'Failed to fetch storage stats');
      }
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      setError(`Failed to load storage stats: ${error.message}`);
    } finally {
      setLoadingStats(false);
    }
  };

  // Format bytes to readable format
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fetch images from backend
  const fetchImages = async (page = 1, search = '') => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching images - Page: ${page}, Search: "${search}"`);
      
      const result = await CloudinaryService.fetchImages(page, imagesPerPage, search, 'business-images');
      
      if (result.success) {
        console.log('Images fetched successfully:', result);
        setImages(result.resources || []);
        setTotalImages(result.total_count || 0);
      } else {
        throw new Error(result.error || 'Failed to fetch images');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setError(`Failed to load images: ${error.message}`);
      setImages([]);
      setTotalImages(0);
    } finally {
      setLoading(false);
    }
  };

  // Delete single image
  const handleDeleteImage = async (publicId) => {
    setDeleting(publicId);
    setError(null);
    try {
      const result = await CloudinaryService.deleteImage(publicId);
      
      if (result.success) {
        // Remove image from local state
        setImages(prevImages => prevImages.filter(img => img.public_id !== publicId));
        setTotalImages(prev => prev - 1);
        alert('Image deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setError(`Failed to delete image: ${error.message}`);
      alert(`Failed to delete image: ${error.message}`);
    } finally {
      setDeleting(null);
      setShowConfirmModal(false);
      setImageToDelete(null);
    }
  };

  // Delete multiple images
  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) {
      alert('Please select images to delete');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await CloudinaryService.deleteMultipleImages(selectedImages);

      if (result.success) {
        // Remove deleted images from local state
        setImages(prevImages => prevImages.filter(img => !selectedImages.includes(img.public_id)));
        setTotalImages(prev => prev - selectedImages.length);
        setSelectedImages([]);
        setBulkDeleteMode(false);
        alert(result.message);
      } else {
        throw new Error(result.error || 'Failed to delete images');
      }
    } catch (error) {
      console.error('Error deleting images:', error);
      setError(`Failed to delete images: ${error.message}`);
      alert(`Failed to delete some images: ${error.message}`);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchImages(1, value);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchImages(newPage, searchTerm);
  };

  // Toggle image selection
  const toggleImageSelection = (publicId) => {
    setSelectedImages(prev => 
      prev.includes(publicId) 
        ? prev.filter(id => id !== publicId)
        : [...prev, publicId]
    );
  };

  // Select all images on current page
  const selectAllImages = () => {
    const allCurrentIds = images.map(img => img.public_id);
    setSelectedImages(prev => 
      prev.length === allCurrentIds.length 
        ? []
        : allCurrentIds
    );
  };

  // Test connection and load data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, testing connection and loading data...');
      
      // Test connection first
      CloudinaryService.testConnection()
        .then(result => {
          console.log('Connection test result:', result);
          if (result.success) {
            fetchImages();
            fetchStorageStats();
          } else {
            setError(`Connection failed: ${result.error}`);
          }
        })
        .catch(err => {
          console.error('Connection test failed:', err);
          setError(`Connection test failed: ${err.message}`);
        });
    }
  }, [isOpen]);

  // Calculate pagination
  const totalPages = Math.ceil(totalImages / imagesPerPage);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Modal Content */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            width: '95%',
            maxWidth: '1400px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '2rem',
            borderBottom: '2px solid #f0f0f0',
            backgroundColor: colors.lightGray,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                color: colors.darkNavy,
                margin: 0,
                fontSize: '1.8rem',
                fontWeight: 'bold'
              }}>
                🖼️ Image Management
              </h2>
              <p style={{
                color: colors.mediumGray,
                margin: '0.5rem 0 0 0',
                fontSize: '1rem'
              }}>
                Manage your Cloudinary image storage
                {storageStats && (
                  <span> • {storageStats.folder.total_images} images • {formatBytes(storageStats.folder.total_size)}</span>
                )}
              </p>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                color: colors.mediumGray,
                padding: '0.5rem',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.color = colors.darkNavy;
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = colors.mediumGray;
              }}
            >
              ×
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              padding: '1rem 2rem',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderBottom: '1px solid #f5c6cb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>⚠️ {error}</span>
              <button
                onClick={() => setError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#721c24',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Controls */}
          <div style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <input
                type="text"
                placeholder="Search images by name..."
                value={searchTerm}
                onChange={handleSearch}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '1rem',
                  outline: 'none',
                  opacity: loading ? 0.6 : 1
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6f42c1';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={() => setBulkDeleteMode(!bulkDeleteMode)}
                disabled={loading}
                style={{
                  backgroundColor: bulkDeleteMode ? '#dc3545' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {bulkDeleteMode ? 'Cancel Selection' : 'Bulk Delete'}
              </button>

              {bulkDeleteMode && (
                <>
                  <button
                    onClick={selectAllImages}
                    disabled={loading || images.length === 0}
                    style={{
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: (loading || images.length === 0) ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      opacity: (loading || images.length === 0) ? 0.6 : 1
                    }}
                  >
                    {selectedImages.length === images.length ? 'Deselect All' : 'Select All'}
                  </button>

                  {selectedImages.length > 0 && (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={loading}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      Delete Selected ({selectedImages.length})
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => {
                  fetchImages(currentPage, searchTerm);
                  fetchStorageStats();
                }}
                disabled={loading}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  opacity: loading ? 0.6 : 1
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Storage Statistics Panel */}
          {storageStats && (
            <div style={{
              padding: '1rem 2rem',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6f42c1' }}>
                  {storageStats.folder.total_images}
                </div>
                <div style={{ fontSize: '0.8rem', color: colors.mediumGray }}>Total Images</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#17a2b8' }}>
                  {formatBytes(storageStats.folder.total_size)}
                </div>
                <div style={{ fontSize: '0.8rem', color: colors.mediumGray }}>Total Size</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  {formatBytes(storageStats.folder.average_size)}
                </div>
                <div style={{ fontSize: '0.8rem', color: colors.mediumGray }}>Average Size</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>
                  {storageStats.folder.recent_uploads}
                </div>
                <div style={{ fontSize: '0.8rem', color: colors.mediumGray }}>Recent (7 days)</div>
              </div>
            </div>
          )}

          {/* Images Grid */}
          <div style={{
            flex: 1,
            padding: '2rem',
            overflowY: 'auto'
          }}>
            {loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
                fontSize: '1.2rem',
                color: colors.mediumGray
              }}>
                <div>🔄 Loading images...</div>
              </div>
            ) : error ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
                fontSize: '1.2rem',
                color: '#dc3545'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <div>Failed to load images</div>
                <button
                  onClick={() => fetchImages(currentPage, searchTerm)}
                  style={{
                    marginTop: '1rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : images.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
                fontSize: '1.2rem',
                color: colors.mediumGray
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                <div>No images found</div>
                {searchTerm && (
                  <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                    Try a different search term
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                {images.map((image) => (
                  <div
                    key={image.public_id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease',
                      border: bulkDeleteMode && selectedImages.includes(image.public_id) 
                        ? '3px solid #dc3545' 
                        : '3px solid transparent'
                    }}
                    onMouseOver={(e) => {
                      if (!bulkDeleteMode) {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!bulkDeleteMode) {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {/* Image */}
                    <div style={{
                      position: 'relative',
                      height: '200px',
                      overflow: 'hidden',
                      cursor: bulkDeleteMode ? 'pointer' : 'default'
                    }}
                    onClick={bulkDeleteMode ? () => toggleImageSelection(image.public_id) : undefined}
                    >
                      <img
                        src={image.secure_url}
                        alt={image.public_id}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                      
                      {/* Selection Checkbox */}
                      {bulkDeleteMode && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: selectedImages.includes(image.public_id) ? '#dc3545' : 'rgba(255,255,255,0.8)',
                          border: '2px solid #dc3545',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          color: 'white'
                        }}>
                          {selectedImages.includes(image.public_id) ? '✓' : ''}
                        </div>
                      )}
                    </div>

                    {/* Image Info */}
                    <div style={{ padding: '1rem' }}>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: colors.darkNavy,
                        marginBottom: '0.5rem',
                        wordBreak: 'break-word'
                      }}>
                        {image.public_id}
                      </div>
                      
                      <div style={{
                        fontSize: '0.8rem',
                        color: colors.mediumGray,
                        marginBottom: '0.5rem'
                      }}>
                        {image.width} × {image.height} • {Math.round(image.bytes / 1024)} KB
                      </div>
                      
                      <div style={{
                        fontSize: '0.8rem',
                        color: colors.mediumGray,
                        marginBottom: '1rem'
                      }}>
                        Created: {new Date(image.created_at).toLocaleDateString()}
                      </div>

                      {!bulkDeleteMode && (
                        <button
                          onClick={() => {
                            setImageToDelete(image.public_id);
                            setShowConfirmModal(true);
                          }}
                          disabled={deleting === image.public_id}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: deleting === image.public_id ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            width: '100%',
                            opacity: deleting === image.public_id ? 0.6 : 1
                          }}
                          onMouseOver={(e) => {
                            if (deleting !== image.public_id) {
                              e.target.style.backgroundColor = '#c82333';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (deleting !== image.public_id) {
                              e.target.style.backgroundColor = '#dc3545';
                            }
                          }}
                        >
                          {deleting === image.public_id ? '🗑️ Deleting...' : '🗑️ Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                style={{
                  backgroundColor: (currentPage === 1 || loading) ? '#e9ecef' : '#6f42c1',
                  color: (currentPage === 1 || loading) ? '#6c757d' : 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: (currentPage === 1 || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>

              <span style={{
                color: colors.darkNavy,
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                Page {currentPage} of {totalPages} ({totalImages} total)
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                style={{
                  backgroundColor: (currentPage === totalPages || loading) ? '#e9ecef' : '#6f42c1',
                  color: (currentPage === totalPages || loading) ? '#6c757d' : 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: (currentPage === totalPages || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '15px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ color: colors.darkNavy, marginBottom: '1rem' }}>
              Confirm Deletion
            </h3>
            <p style={{ color: colors.mediumGray, marginBottom: '2rem' }}>
              {imageToDelete 
                ? 'Are you sure you want to permanently delete this image?'
                : `Are you sure you want to permanently delete ${selectedImages.length} selected images?`
              }
              <br />
              <strong>This action cannot be undone!</strong>
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setImageToDelete(null);
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={imageToDelete ? () => handleDeleteImage(imageToDelete) : handleBulkDelete}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageManagement;