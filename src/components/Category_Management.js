// components/Category_Management.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../configs/FirebaseConfigs';
import { uploadImageToCloudinary } from '../configs/CloudinaryConfig';
import { colors } from '../utils/colors';

const CategoryManagement = ({ isOpen, onClose }) => {
  // Category Management States
  const [activeTab, setActiveTab] = useState('view');
  const [categoryData, setCategoryData] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState('');
  const [newCategoryImageFile, setNewCategoryImageFile] = useState(null);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [processingCategory, setProcessingCategory] = useState(false);
  
  // Edit form states
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryImageUrl, setEditCategoryImageUrl] = useState('');
  const [editCategoryImageFile, setEditCategoryImageFile] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const categoryCollection = collection(db, 'Category');
      const categorySnapshot = await getDocs(categoryCollection);
      
      const categoriesData = categorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort categories alphabetically by name
      categoriesData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setCategoryData(categoriesData);
      console.log('Categories loaded:', categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Error loading categories: ' + error.message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Category name is required');
      return;
    }

    if (!newCategoryImageUrl.trim() && !newCategoryImageFile) {
      alert('Please provide either an image URL or upload an image file');
      return;
    }

    setProcessingCategory(true);

    try {
      let finalImageUrl = newCategoryImageUrl.trim();

      // If user uploaded a file, upload to Cloudinary
      if (newCategoryImageFile) {
        setUploadingCategoryImage(true);
        const uploadResult = await uploadImageToCloudinary(newCategoryImageFile, 'category-images');
        
        if (uploadResult.success) {
          finalImageUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
      }

      // Add to Category collection with correct field mapping
      const categoryCollection = collection(db, 'Category');
      const docRef = await addDoc(categoryCollection, {
        name: newCategoryName.trim(), // Store category name in 'name' field
        icon: finalImageUrl, // Store image URL in 'icon' field
        createdAt: new Date(),
        createdBy: 'admin'
      });

      console.log('Category added with ID:', docRef.id);
      alert(`Category "${newCategoryName}" added successfully!`);
      
      // Reset form
      setNewCategoryName('');
      setNewCategoryImageUrl('');
      setNewCategoryImageFile(null);
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"][accept*="image"]');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Refresh categories
      await fetchCategories();
      
    } catch (error) {
      console.error('Error adding category:', error);
      alert(`Error adding category: ${error.message}`);
    } finally {
      setProcessingCategory(false);
      setUploadingCategoryImage(false);
    }
  };

  const startEditCategory = (category) => {
    console.log('Starting edit for category:', category);
    setEditingCategory(category.id);
    setEditCategoryName(category.name || 'Unknown Category');
    setEditCategoryImageUrl(category.icon || '');
    setEditCategoryImageFile(null);
  };

  const cancelEditCategory = () => {
    console.log('Cancelling edit');
    setEditingCategory(null);
    setEditCategoryName('');
    setEditCategoryImageUrl('');
    setEditCategoryImageFile(null);
    
    // Clear any file inputs in edit mode
    const editFileInputs = document.querySelectorAll('input[type="file"]');
    editFileInputs.forEach(input => {
      if (input.getAttribute('data-edit-mode') === 'true') {
        input.value = '';
      }
    });
  };

  const saveEditCategory = async (categoryId) => {
    console.log('Saving category:', categoryId);
    
    if (!editCategoryName.trim()) {
      alert('Category name is required');
      return;
    }

    if (!editCategoryImageUrl.trim() && !editCategoryImageFile) {
      alert('Image URL or file is required');
      return;
    }

    setProcessingCategory(true);

    try {
      let finalImageUrl = editCategoryImageUrl.trim();

      // If user uploaded a new file, upload to Cloudinary
      if (editCategoryImageFile) {
        setUploadingCategoryImage(true);
        console.log('Uploading new image file...');
        const uploadResult = await uploadImageToCloudinary(editCategoryImageFile, 'category-images');
        
        if (uploadResult.success) {
          finalImageUrl = uploadResult.url;
          console.log('Image uploaded successfully:', finalImageUrl);
        } else {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
      }

      const categoryDocRef = doc(db, 'Category', categoryId);
      const updateData = {
        name: editCategoryName.trim(), // Store category name in 'name' field
        icon: finalImageUrl, // Store image URL in 'icon' field
        updatedAt: new Date(),
        updatedBy: 'admin'
      };

      console.log('Updating category with data:', updateData);
      await updateDoc(categoryDocRef, updateData);

      console.log('Category updated successfully');
      alert('Category updated successfully!');
      
      cancelEditCategory();
      await fetchCategories();
      
    } catch (error) {
      console.error('Error updating category:', error);
      alert(`Error updating category: ${error.message}`);
    } finally {
      setProcessingCategory(false);
      setUploadingCategoryImage(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    console.log('Attempting to delete category:', categoryId, categoryName);

    const isConfirmed = window.confirm(
      `Are you sure you want to permanently delete the category "${categoryName}"?\n\nThis action cannot be undone.`
    );

    if (!isConfirmed) {
      console.log('Category deletion cancelled by user.');
      return;
    }

    setDeletingCategoryId(categoryId);

    try {
      // Get a reference to the document
      const categoryDocRef = doc(db, 'Category', categoryId);
      
      // Delete the document
      await deleteDoc(categoryDocRef);

      console.log('Successfully deleted category from Firestore:', categoryId);
      alert(`Category "${categoryName}" has been deleted successfully.`);

      // Refresh the list of categories
      await fetchCategories();

    } catch (error) {
      console.error('Error deleting category:', error);
      alert(`Failed to delete category. Error: ${error.message}`);
    } finally {
      // Reset the deleting state
      setDeletingCategoryId(null);
    }
  };

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

  const handleCategoryImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      alert(validationError);
      e.target.value = '';
      return;
    }

    setNewCategoryImageFile(file);
    setNewCategoryImageUrl(''); // Clear URL input when file is selected
  };

  const handleEditCategoryImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      alert(validationError);
      e.target.value = '';
      return;
    }

    console.log('Edit file selected:', file.name);
    setEditCategoryImageFile(file);
    setEditCategoryImageUrl(''); // Clear URL input when file is selected
  };

  const handleClose = () => {
    // Reset all states when closing
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryImageUrl('');
    setNewCategoryImageFile(null);
    setEditCategoryName('');
    setEditCategoryImageUrl('');
    setEditCategoryImageFile(null);
    setActiveTab('view');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          {/* Modal Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '2px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 1
          }}>
            <h2 style={{ color: colors.darkNavy, margin: 0 }}>
              Category Management
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: colors.mediumGray,
                padding: '0.5rem',
                borderRadius: '50%'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e0e0e0',
            position: 'sticky',
            top: '73px',
            backgroundColor: 'white',
            zIndex: 1
          }}>
            <button
              onClick={() => setActiveTab('view')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                backgroundColor: activeTab === 'view' ? colors.lightBlue : 'transparent',
                color: activeTab === 'view' ? colors.darkNavy : colors.mediumGray,
                cursor: 'pointer',
                fontWeight: activeTab === 'view' ? 'bold' : 'normal',
                borderBottom: activeTab === 'view' ? `3px solid ${colors.mediumBlue}` : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              View Categories ({categoryData.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                backgroundColor: activeTab === 'add' ? colors.lightBlue : 'transparent',
                color: activeTab === 'add' ? colors.darkNavy : colors.mediumGray,
                cursor: 'pointer',
                fontWeight: activeTab === 'add' ? 'bold' : 'normal',
                borderBottom: activeTab === 'add' ? `3px solid ${colors.mediumBlue}` : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Add New Category
            </button>
          </div>

          {/* Modal Content */}
          <div style={{ padding: '1.5rem' }}>
            {activeTab === 'view' && (
              <div>
                {loadingCategories ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid #f3f3f3',
                      borderTop: '4px solid ' + colors.mediumBlue,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1rem'
                    }}></div>
                    <p style={{ color: colors.mediumGray }}>Loading categories...</p>
                  </div>
                ) : categoryData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: colors.mediumGray }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                    <h3 style={{ color: colors.darkNavy, marginBottom: '1rem' }}>No Categories Found</h3>
                    <p style={{ marginBottom: '1.5rem' }}>
                      Get started by adding your first category using the "Add New Category" tab.
                    </p>
                    <button
                      onClick={() => setActiveTab('add')}
                      style={{
                        backgroundColor: colors.mediumBlue,
                        color: 'white',
                        border: 'none',
                        padding: '0.8rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}
                    >
                      Add First Category
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {categoryData.map(category => (
                      <div
                        key={category.id}
                        style={{
                          border: '2px solid #e0e0e0',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.5rem',
                          backgroundColor: editingCategory === category.id ? '#f8f9ff' : 'white',
                          transition: 'all 0.2s ease',
                          borderColor: editingCategory === category.id ? colors.mediumBlue : '#e0e0e0'
                        }}
                      >
                        {/* Category Image */}
                        <div style={{ flexShrink: 0 }}>
                          {(editingCategory === category.id ? (editCategoryImageUrl || category.icon) : category.icon) ? (
                            <img
                              src={editingCategory === category.id ? (editCategoryImageUrl || category.icon) : category.icon}
                              alt={category.name || 'Category'}
                              style={{
                                width: '80px',
                                height: '80px',
                                objectFit: 'cover',
                                borderRadius: '10px',
                                border: '3px solid #e0e0e0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div style={{
                            display: (editingCategory === category.id ? (editCategoryImageUrl || category.icon) : category.icon) ? 'none' : 'flex',
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#f8f9fa',
                            border: '3px dashed #dee2e6',
                            borderRadius: '10px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.mediumGray,
                            fontSize: '1.5rem'
                          }}>
                            📷
                          </div>
                        </div>

                        {/* Category Info */}
                        <div style={{ flex: 1 }}>
                          {editingCategory === category.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {/* Edit Category Name */}
                              <div>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '0.5rem',
                                  fontWeight: '600',
                                  color: colors.darkNavy,
                                  fontSize: '0.9rem'
                                }}>
                                  Category Name *
                                </label>
                                <input
                                  type="text"
                                  value={editCategoryName}
                                  onChange={(e) => setEditCategoryName(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    border: '2px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease'
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = colors.mediumBlue}
                                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                  placeholder="Enter category name"
                                />
                              </div>

                              {/* Edit Image Options */}
                              <div>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '0.5rem',
                                  fontWeight: '600',
                                  color: colors.darkNavy,
                                  fontSize: '0.9rem'
                                }}>
                                  Category Image *
                                </label>
                                
                                {/* Image URL Input */}
                                <input
                                  type="url"
                                  value={editCategoryImageUrl}
                                  onChange={(e) => {
                                    setEditCategoryImageUrl(e.target.value);
                                    if (e.target.value) {
                                      setEditCategoryImageFile(null);
                                      // Clear file input
                                      const fileInput = document.querySelector(`input[type="file"][data-category-id="${category.id}"]`);
                                      if (fileInput) {
                                        fileInput.value = '';
                                      }
                                    }
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    border: '2px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    marginBottom: '0.5rem',
                                    outline: 'none',
                                    opacity: editCategoryImageFile ? 0.5 : 1,
                                    transition: 'all 0.2s ease'
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = colors.mediumBlue}
                                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                  placeholder="https://example.com/image.jpg"
                                  disabled={!!editCategoryImageFile}
                                />

                                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: colors.mediumGray, margin: '0.5rem 0' }}>
                                  OR
                                </div>

                                {/* File Upload */}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png"
                                  onChange={handleEditCategoryImageFileChange}
                                  disabled={!!editCategoryImageUrl}
                                  data-category-id={category.id}
                                  data-edit-mode="true"
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '2px dashed #ddd',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    cursor: editCategoryImageUrl ? 'not-allowed' : 'pointer',
                                    opacity: editCategoryImageUrl ? 0.5 : 1,
                                    fontSize: '0.9rem'
                                  }}
                                />

                                {editCategoryImageFile && (
                                  <div style={{
                                    marginTop: '0.5rem',
                                    padding: '0.8rem',
                                    backgroundColor: '#e7f3ff',
                                    borderRadius: '8px',
                                    border: '2px solid #007bff'
                                  }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: colors.darkNavy, fontWeight: '500' }}>
                                      📁 Selected: {editCategoryImageFile.name}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h4 style={{ 
                                margin: '0 0 0.5rem 0', 
                                color: colors.darkNavy,
                                fontSize: '1.3rem',
                                fontWeight: '600'
                              }}>
                                {category.name || 'Unknown Category'}
                              </h4>
                              <p style={{ 
                                margin: '0.3rem 0', 
                                fontSize: '0.85rem', 
                                color: colors.mediumGray,
                                wordBreak: 'break-all',
                                backgroundColor: '#f8f9fa',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px'
                              }}>
                                🔗 {category.icon || 'No image URL'}
                              </p>
                              <p style={{ 
                                margin: '0.3rem 0', 
                                fontSize: '0.8rem', 
                                color: colors.mediumGray,
                                fontFamily: 'monospace',
                                backgroundColor: '#f0f0f0',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                ID: {category.id}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flexShrink: 0 }}>
                          {editingCategory === category.id ? (
                            <>
                              <button
                                onClick={() => saveEditCategory(category.id)}
                                disabled={processingCategory || uploadingCategoryImage || !editCategoryName.trim() || (!editCategoryImageUrl.trim() && !editCategoryImageFile)}
                                style={{
                                  backgroundColor: (processingCategory || uploadingCategoryImage) ? '#cccccc' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.8rem 1.2rem',
                                  borderRadius: '8px',
                                  cursor: (processingCategory || uploadingCategoryImage) ? 'not-allowed' : 'pointer',
                                  fontSize: '0.9rem',
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  minWidth: '120px',
                                  justifyContent: 'center'
                                }}
                              >
                                {processingCategory || uploadingCategoryImage ? (
                                  <>
                                    <div style={{
                                      width: '16px',
                                      height: '16px',
                                      border: '2px solid #ffffff',
                                      borderTop: '2px solid transparent',
                                      borderRadius: '50%',
                                      animation: 'spin 1s linear infinite'
                                    }}></div>
                                    {uploadingCategoryImage ? 'Uploading...' : 'Saving...'}
                                  </>
                                ) : (
                                  <>
                                    ✅ Save
                                  </>
                                )}
                              </button>
                              <button
                                onClick={cancelEditCategory}
                                disabled={processingCategory}
                                style={{
                                  backgroundColor: colors.mediumGray,
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.8rem 1.2rem',
                                  borderRadius: '8px',
                                  cursor: processingCategory ? 'not-allowed' : 'pointer',
                                  fontSize: '0.9rem',
                                  fontWeight: '500',
                                  opacity: processingCategory ? 0.6 : 1,
                                  minWidth: '120px'
                                }}
                              >
                                ❌ Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditCategory(category)}
                                disabled={processingCategory || editingCategory !== null}
                                style={{
                                  backgroundColor: colors.mediumBlue,
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.8rem 1.2rem',
                                  borderRadius: '8px',
                                  cursor: (processingCategory || editingCategory !== null) ? 'not-allowed' : 'pointer',
                                  fontSize: '0.9rem',
                                  fontWeight: '500',
                                  opacity: (processingCategory || editingCategory !== null) ? 0.6 : 1,
                                  minWidth: '120px',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => {
                                  if (!processingCategory && editingCategory === null) {
                                    e.target.style.backgroundColor = '#0056b3';
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (!processingCategory && editingCategory === null) {
                                    e.target.style.backgroundColor = colors.mediumBlue;
                                  }
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id, category.name || 'Unknown')}
                                disabled={processingCategory || deletingCategoryId === category.id || editingCategory !== null}
                                style={{
                                  backgroundColor: (deletingCategoryId === category.id) ? '#6c757d' : '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.8rem 1.2rem',
                                  borderRadius: '8px',
                                  cursor: (processingCategory || deletingCategoryId === category.id || editingCategory !== null) ? 'not-allowed' : 'pointer',
                                  fontSize: '0.9rem',
                                  fontWeight: '500',
                                  opacity: (processingCategory || deletingCategoryId === category.id || editingCategory !== null) ? 0.6 : 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  minWidth: '120px',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => {
                                  if (!processingCategory && deletingCategoryId !== category.id && editingCategory === null) {
                                    e.target.style.backgroundColor = '#c82333';
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (!processingCategory && deletingCategoryId !== category.id && editingCategory === null) {
                                    e.target.style.backgroundColor = '#dc3545';
                                  }
                                }}
                              >
                                {deletingCategoryId === category.id ? (
                                  <>
                                    <div style={{
                                      width: '16px',
                                      height: '16px',
                                      border: '2px solid #ffffff',
                                      borderTop: '2px solid transparent',
                                      borderRadius: '50%',
                                      animation: 'spin 1s linear infinite'
                                    }}></div>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    🗑️ Delete
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'add' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '10px',
                  border: '2px solid #2196f3'
                }}>
                  <div style={{ fontSize: '2rem' }}>➕</div>
                  <div>
                    <h3 style={{ color: colors.darkNavy, margin: '0 0 0.3rem 0' }}>
                      Add New Category
                    </h3>
                    <p style={{ margin: 0, color: colors.mediumGray, fontSize: '0.9rem' }}>
                      Create a new category with a name and image for your business listings.
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Category Name Input */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.8rem',
                      fontWeight: '600',
                      color: colors.darkNavy,
                      fontSize: '1rem'
                    }}>
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name (e.g., Restaurants, Hotels, Services)"
                      style={{
                        width: '100%',
                        padding: '1rem',
                        border: `2px solid ${colors.lightBlue}`,
                        borderRadius: '10px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.mediumBlue}
                      onBlur={(e) => e.target.style.borderColor = colors.lightBlue}
                    />
                  </div>

                  {/* Image Upload Options */}
                  <div style={{
                    border: '3px dashed #007bff',
                    borderRadius: '15px',
                    padding: '2rem',
                    backgroundColor: '#f8f9ff'
                  }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '1.5rem',
                      fontWeight: '600',
                      color: colors.darkNavy,
                      fontSize: '1rem',
                      textAlign: 'center'
                    }}>
                      Category Image * (Choose one option)
                    </label>

                    {/* Image URL Input */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.8rem',
                        fontSize: '0.95rem',
                        color: colors.mediumGray,
                        fontWeight: '500'
                      }}>
                        🔗 Option 1: Image URL
                      </label>
                      <input
                        type="url"
                        value={newCategoryImageUrl}
                        onChange={(e) => {
                          setNewCategoryImageUrl(e.target.value);
                          if (e.target.value) {
                            setNewCategoryImageFile(null);
                            // Clear file input
                            const fileInput = document.querySelector('input[type="file"][data-add-mode="true"]');
                            if (fileInput) {
                              fileInput.value = '';
                            }
                          }
                        }}
                        placeholder="https://example.com/category-image.jpg"
                        disabled={!!newCategoryImageFile}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          border: `2px solid ${colors.lightBlue}`,
                          borderRadius: '10px',
                          fontSize: '0.95rem',
                          opacity: newCategoryImageFile ? 0.5 : 1,
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => !newCategoryImageFile && (e.target.style.borderColor = colors.mediumBlue)}
                        onBlur={(e) => !newCategoryImageFile && (e.target.style.borderColor = colors.lightBlue)}
                      />
                    </div>

                    <div style={{
                      textAlign: 'center',
                      color: colors.mediumGray,
                      fontWeight: 'bold',
                      margin: '1rem 0',
                      fontSize: '1.1rem'
                    }}>
                      OR
                    </div>

                    {/* File Upload */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.8rem',
                        fontSize: '0.95rem',
                        color: colors.mediumGray,
                        fontWeight: '500'
                      }}>
                        📁 Option 2: Upload Image File
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleCategoryImageFileChange}
                          disabled={uploadingCategoryImage || !!newCategoryImageUrl}
                          data-add-mode="true"
                          style={{
                            width: '100%',
                            padding: '1rem',
                            border: '2px dashed #007bff',
                            borderRadius: '10px',
                            backgroundColor: 'white',
                            cursor: (uploadingCategoryImage || newCategoryImageUrl) ? 'not-allowed' : 'pointer',
                            opacity: (uploadingCategoryImage || newCategoryImageUrl) ? 0.5 : 1,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (!uploadingCategoryImage && !newCategoryImageUrl) {
                              e.target.style.backgroundColor = '#f0f8ff';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!uploadingCategoryImage && !newCategoryImageUrl) {
                              e.target.style.backgroundColor = 'white';
                            }
                          }}
                        />
                      </div>
                      <p style={{
                        fontSize: '0.85rem',
                        color: colors.mediumGray,
                        margin: '0.8rem 0 0 0',
                        fontStyle: 'italic',
                        textAlign: 'center'
                      }}>
                        Supported formats: JPEG, JPG, PNG • Maximum size: 5MB
                      </p>
                      
                      {newCategoryImageFile && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '1rem',
                          backgroundColor: '#e7f3ff',
                          borderRadius: '10px',
                          border: '2px solid #007bff'
                        }}>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: colors.darkNavy, fontWeight: '600' }}>
                            📁 Selected File: {newCategoryImageFile.name}
                          </p>
                          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: colors.mediumGray }}>
                            Size: {(newCategoryImageFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview Section */}
                  {(newCategoryImageUrl || newCategoryImageFile) && newCategoryName && (
                    <div style={{
                      border: '2px solid #28a745',
                      borderRadius: '15px',
                      padding: '1.5rem',
                      backgroundColor: '#f8fff9'
                    }}>
                      <h4 style={{ 
                        color: '#28a745', 
                        margin: '0 0 1rem 0',
                        textAlign: 'center',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                      }}>
                        👀 Preview
                      </h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={newCategoryImageFile ? URL.createObjectURL(newCategoryImageFile) : newCategoryImageUrl}
                          alt="Category Preview"
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '10px',
                            border: '2px solid #28a745'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div style={{ display: 'none', color: '#dc3545', fontSize: '0.9rem' }}>
                          ❌ Image failed to load
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', color: colors.darkNavy }}>
                            {newCategoryName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Category Button */}
                  <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                      onClick={handleAddCategory}
                      disabled={processingCategory || uploadingCategoryImage || !newCategoryName.trim() || (!newCategoryImageUrl.trim() && !newCategoryImageFile)}
                      style={{
                        backgroundColor: (processingCategory || uploadingCategoryImage) ? '#cccccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '1.2rem 3rem',
                        borderRadius: '15px',
                        cursor: (processingCategory || uploadingCategoryImage) ? 'not-allowed' : 'pointer',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        margin: '0 auto',
                        minWidth: '200px',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: (processingCategory || uploadingCategoryImage) ? 'none' : '0 4px 12px rgba(40, 167, 69, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        if (!processingCategory && !uploadingCategoryImage) {
                          e.target.style.backgroundColor = '#218838';
                          e.target.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!processingCategory && !uploadingCategoryImage) {
                          e.target.style.backgroundColor = '#28a745';
                          e.target.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {processingCategory ? (
                        <>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            border: '3px solid #ffffff',
                            borderTop: '3px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          {uploadingCategoryImage ? 'Uploading Image...' : 'Adding Category...'}
                        </>
                      ) : (
                        <>
                          ➕ Add Category
                        </>
                      )}
                    </button>
                    
                    {/* Requirements Note */}
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      color: '#856404'
                    }}>
                      <p style={{ margin: 0, fontWeight: '500' }}>
                        📋 Requirements:
                      </p>
                      <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '1rem' }}>
                        <li>Category name is required</li>
                        <li>Either image URL or file upload is required</li>
                        <li>Image files must be JPEG, JPG, or PNG format</li>
                        <li>Maximum file size: 5MB</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryManagement;