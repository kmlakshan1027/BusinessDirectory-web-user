// pages/AddBusinessRequest.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from './../../configs/FirebaseConfigs';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '../../configs/CloudinaryConfig';
import { colors } from '../../utils/colors';

const AddBusinessRequest = () => {
  const [temporaryBusinesses, setTemporaryBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [uploadingImages, setUploadingImages] = useState(new Set());
  const [businessImages, setBusinessImages] = useState({});

  useEffect(() => {
    fetchTemporaryBusinesses();
  }, []);

  const fetchTemporaryBusinesses = async () => {
    try {
      setLoading(true);
      const tempCollection = collection(db, 'TemporaryBusinessDetails');
      const tempSnapshot = await getDocs(tempCollection);
      
      const tempBusinesses = tempSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTemporaryBusinesses(tempBusinesses);
    } catch (error) {
      console.error('Error fetching temporary businesses:', error);
      alert('Error loading business requests');
    } finally {
      setLoading(false);
    }
  };

  // Parse business ID to get group and sequence numbers
  const parseBusinessId = (businessId) => {
    if (!businessId || typeof businessId !== 'string') return null;
    
    const match = businessId.match(/^BIZ-(\d{2})-(\d{4})$/);
    if (!match) return null;
    
    return {
      group: parseInt(match[1], 10),
      sequence: parseInt(match[2], 10)
    };
  };

  // Generate next business ID in format BIZ-XX-XXXX
  const generateBusinessId = async () => {
    try {
      const businessCollection = collection(db, 'BusinessList');
      const q = query(businessCollection, orderBy('business_ID', 'desc'));
      const snapshot = await getDocs(q);
      
      // If no businesses exist, start with first ID
      if (snapshot.empty) {
        return 'BIZ-01-0001';
      }
      
      // Get the last business ID
      const lastDoc = snapshot.docs[0];
      const lastId = lastDoc.data().business_ID;
      
      console.log('Last business ID:', lastId);
      
      const parsed = parseBusinessId(lastId);
      if (!parsed) {
        console.log('Could not parse last ID, starting fresh');
        return 'BIZ-01-0001';
      }
      
      let { group, sequence } = parsed;
      
      console.log('Current group:', group, 'sequence:', sequence);
      
      // Increment sequence first
      sequence++;
      
      // Check if we need to move to next group (after 9999)
      if (sequence > 9999) {
        group++;
        sequence = 1; // Start from 0001 in new group
      }
      
      // Format: BIZ-XX-XXXX (group with exactly 2 digits, sequence with exactly 4 digits)
      const groupStr = group.toString().padStart(2, '0');
      const sequenceStr = sequence.toString().padStart(4, '0');
      
      const newId = `BIZ-${groupStr}-${sequenceStr}`;
      console.log('Generated new ID:', newId);
      
      return newId;
      
    } catch (error) {
      console.error('Error generating business ID:', error);
      // Fallback to first ID if there's any error
      return 'BIZ-01-0001';
    }
  };

  // Validate image file
  const validateImageFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, JPG, or PNG)';
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }
    
    return null;
  };

  // Handle image upload for a specific business
  const handleImageUpload = async (businessId, file) => {
    if (!file) return;
    
    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }
    
    setUploadingImages(prev => new Set([...prev, businessId]));
    
    try {
      // Upload to Cloudinary using your existing config
      const result = await uploadImageToCloudinary(file, 'admin-business-images');
      
      if (result.success) {
        // Store the uploaded image data
        setBusinessImages(prev => ({
          ...prev,
          [businessId]: {
            id: `admin-${Date.now()}`,
            name: file.name,
            size: file.size,
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
            format: result.format
          }
        }));
        
        alert('Image uploaded successfully!');
      } else {
        console.error('Upload failed:', result.error);
        alert(`Upload failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(businessId);
        return newSet;
      });
    }
  };

  // Remove uploaded image for a business
  const removeUploadedImage = async (businessId) => {
    const imageData = businessImages[businessId];
    if (!imageData) return;

    try {
      // Delete from Cloudinary
      if (imageData.publicId) {
        const deleteResult = await deleteImageFromCloudinary(imageData.publicId);
        if (!deleteResult.success) {
          console.error('Failed to delete from Cloudinary:', deleteResult.error);
          alert('Failed to delete image from cloud storage');
          return;
        }
      }

      // Remove from local state
      setBusinessImages(prev => {
        const newImages = { ...prev };
        delete newImages[businessId];
        return newImages;
      });
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Error removing image');
    }
  };

  const handleAddToPermanent = async (tempBusiness) => {
    if (processingIds.has(tempBusiness.id)) return;
    
    setProcessingIds(prev => new Set([...prev, tempBusiness.id]));
    
    try {
      // Generate new business ID in BIZ-XX-XXXX format
      const businessId = await generateBusinessId();
      
      console.log('Adding business with ID:', businessId);
      
      // Get the uploaded image for this business (if any)
      const uploadedImage = businessImages[tempBusiness.id];
      
      // Prepare permanent business data
      const permanentBusinessData = {
        about: tempBusiness.about || '',
        address: tempBusiness.address || '',
        business_ID: businessId,
        category: tempBusiness.category || '',
        contact: tempBusiness.contact || '',
        district: tempBusiness.district || '',
        email: tempBusiness.email || '',
        facebook: tempBusiness.facebook || '',
        location: tempBusiness.location || '',
        locationUrl: tempBusiness.locationUrl || '',
        name: tempBusiness.name || '',
        website: tempBusiness.website || '',
        whatsapp: tempBusiness.whatsapp || '',
        alwaysOpen: tempBusiness.alwaysOpen || false,
        operatingTimes: tempBusiness.operatingTimes || tempBusiness.operatingHours || null,
        status: 'approved',
        createdAt: new Date(),
        approvedAt: new Date(),
        originalTempId: tempBusiness.id,
        // Add original business images if they exist
        ...(tempBusiness.businessImages && tempBusiness.businessImages.length > 0 && {
          businessImages: tempBusiness.businessImages
        }),
        // Add only the image URL if admin uploaded an image
        ...(uploadedImage && {
          imageUrl: uploadedImage.url,
          adminUploadedImage: {
            url: uploadedImage.url,
            name: uploadedImage.name,
            publicId: uploadedImage.publicId
          }
        })
      };

      // Add to BusinessList collection
      const businessCollection = collection(db, 'BusinessList');
      const docRef = await addDoc(businessCollection, permanentBusinessData);
      
      console.log('Business added to permanent collection with doc ID:', docRef.id);
      
      // Remove from TemporaryBusinessDetails
      await deleteDoc(doc(db, 'TemporaryBusinessDetails', tempBusiness.id));
      
      console.log('Removed from temporary collection');
      
      // Clean up the uploaded image from local state
      setBusinessImages(prev => {
        const newImages = { ...prev };
        delete newImages[tempBusiness.id];
        return newImages;
      });
      
      alert(`Business "${tempBusiness.name}" added successfully with ID: ${businessId}`);
      
      // Refresh data
      await fetchTemporaryBusinesses();
      
    } catch (error) {
      console.error('Error adding business to permanent collection:', error);
      alert('Error adding business. Please try again.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempBusiness.id);
        return newSet;
      });
    }
  };

  const handleRejectTemporary = async (tempBusinessId, businessName) => {
    if (window.confirm(`Are you sure you want to reject "${businessName}"? This will permanently delete the request.`)) {
      setProcessingIds(prev => new Set([...prev, tempBusinessId]));
      
      try {
        // Delete any uploaded admin image first
        if (businessImages[tempBusinessId]) {
          await removeUploadedImage(tempBusinessId);
        }
        
        // Remove from TemporaryBusinessDetails
        await deleteDoc(doc(db, 'TemporaryBusinessDetails', tempBusinessId));
        
        alert('Business request rejected and removed!');
        await fetchTemporaryBusinesses();
      } catch (error) {
        console.error('Error rejecting business:', error);
        alert('Error rejecting business');
      } finally {
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempBusinessId);
          return newSet;
        });
      }
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const downloadImage = async (imageUrl, imageName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageName || 'business-image.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error downloading image');
    }
  };

  const BusinessRequestCard = ({ business }) => {
    const uploadedImage = businessImages[business.id];
    const isUploading = uploadingImages.has(business.id);
    const isProcessing = processingIds.has(business.id);
    
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '1rem',
        border: '2px solid #007bff'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <h3 style={{ color: colors.darkNavy, margin: '0 0 0.5rem 0' }}>
              {business.name}
            </h3>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Category:</strong> {business.category}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>District:</strong> {business.district}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Location:</strong> {business.location}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Contact:</strong> {business.contact}
            </p>
          </div>
          
          <div>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Address:</strong> {business.address}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Email:</strong> {business.email || 'N/A'}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>WhatsApp:</strong> {business.whatsapp || 'N/A'}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Website:</strong> {business.website || 'N/A'}
            </p>
            <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
              <strong>Submitted:</strong> {formatDate(business.createdAt)}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0.25rem 0', color: colors.mediumGray }}>
            <strong>About:</strong> {business.about}
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <strong style={{ color: colors.darkNavy }}>Operating Hours:</strong>
          {business.alwaysOpen ? (
            <span style={{ marginLeft: '0.5rem', color: colors.mediumBlue }}>
              Always Open (24/7)
            </span>
          ) : (
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {Object.entries(business.operatingTimes || business.operatingHours || {}).map(([day, hours]) => (
                <div key={day} style={{ margin: '0.2rem 0' }}>
                  <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>{' '}
                  {hours.isOpen 
                    ? `${hours.openTime} - ${hours.closeTime}` 
                    : 'Closed'
                  }
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Image Upload Section */}
        <div style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          border: '2px dashed #007bff' 
        }}>
          <strong style={{ color: colors.darkNavy, display: 'block', marginBottom: '0.5rem' }}>
            📸 Admin Image Upload (Optional):
          </strong>
          
          {!uploadedImage ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleImageUpload(business.id, file);
                  }
                }}
                disabled={isUploading || isProcessing}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: (isUploading || isProcessing) ? 'not-allowed' : 'pointer'
                }}
              />
              <p style={{ 
                fontSize: '0.8rem', 
                color: colors.mediumGray, 
                margin: '0',
                fontStyle: 'italic' 
              }}>
                Upload one additional image for this business (JPEG, JPG, PNG - Max 5MB)
              </p>
              {isUploading && (
                <div style={{ 
                  color: colors.mediumBlue, 
                  fontStyle: 'italic',
                  fontSize: '0.9rem'
                }}>
                  🔄 Uploading image...
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              padding: '0.5rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '2px solid #28a745'
            }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={uploadedImage.url} 
                  alt="Admin uploaded"
                  style={{ 
                    width: '120px', 
                    height: '80px', 
                    objectFit: 'cover', 
                    borderRadius: '6px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0', color: '#28a745', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  ✓ Image uploaded successfully!
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: colors.mediumGray }}>
                  <strong>{uploadedImage.name}</strong>
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: colors.mediumGray }}>
                  Size: {formatFileSize(uploadedImage.size)} | 
                  {uploadedImage.width} × {uploadedImage.height}px | 
                  {uploadedImage.format?.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => removeUploadedImage(business.id)}
                disabled={isProcessing}
                style={{
                  backgroundColor: isProcessing ? '#cccccc' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem 1rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}
                title="Remove uploaded image"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Original Business Images */}
        {business.businessImages && business.businessImages.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: colors.darkNavy, display: 'block', marginBottom: '0.5rem' }}>
              Original Business Images:
            </strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {business.businessImages.map((image, index) => (
                <div key={index} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                  <img 
                    src={image.url} 
                    alt={`Business ${index + 1}`}
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa' }}>
                    <button
                      onClick={() => downloadImage(image.url, image.name || `business-image-${index + 1}.jpg`)}
                      style={{
                        backgroundColor: colors.mediumBlue,
                        color: 'white',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        width: '100%'
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          marginTop: '1rem'
        }}>
          <button
            onClick={() => handleAddToPermanent(business)}
            disabled={isProcessing || isUploading}
            style={{
              backgroundColor: (isProcessing || isUploading) ? '#cccccc' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.7rem 1.5rem',
              borderRadius: '5px',
              cursor: (isProcessing || isUploading) ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {isProcessing ? 'Adding...' : 'Add to Permanent'}
          </button>
          <button
            onClick={() => handleRejectTemporary(business.id, business.name)}
            disabled={isProcessing || isUploading}
            style={{
              backgroundColor: (isProcessing || isUploading) ? '#cccccc' : '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.7rem 1.5rem',
              borderRadius: '5px',
              cursor: (isProcessing || isUploading) ? 'not-allowed' : 'pointer',
              fontWeight: '500'
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
          <h2 style={{ color: colors.darkNavy }}>Loading business requests...</h2>
        </div>
      </main>
    );
  }

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .add-business-request-main {
              padding: 1.5rem !important;
            }
          }
        `}
      </style>
      
      <main className="add-business-request-main" style={{
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
              Add Business Requests
            </h1>
            <p style={{ 
              color: colors.mediumGray, 
              fontSize: '1.1rem',
              marginBottom: '1rem'
            }}>
              Review and approve new business submissions from the temporary collection.
              You can optionally upload an additional image for each business before approving.
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
                Total Requests: {temporaryBusinesses.length}
              </div>
              <div style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                🆔 ID Format: BIZ-01-0001 → BIZ-01-9999 → BIZ-02-0001
              </div>
            </div>
          </div>

          {temporaryBusinesses.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              padding: '3rem',
              borderRadius: '10px',
              textAlign: 'center',
              color: colors.mediumGray,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: '1rem', color: colors.darkNavy }}>
                No Pending Business Requests
              </h3>
              <p>There are no business requests waiting for approval at the moment.</p>
            </div>
          ) : (
            temporaryBusinesses.map(business => (
              <BusinessRequestCard
                key={business.id}
                business={business}
              />
            ))
          )}
        </div>
      </main>
    </>
  );
};

export default AddBusinessRequest;