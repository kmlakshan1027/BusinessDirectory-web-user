// components/ProductsUpdateSection.js
import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../configs/FirebaseConfigs';
import { colors } from '../utils/colors';
import { Package, Plus, Trash2, Upload, X, Image as ImageIcon, Loader } from 'lucide-react';

const ProductsUpdateSection = ({ 
  businessData, 
  onProductsChange, 
  validationError 
}) => {
  const [products, setProducts] = useState([]);
  const [uploadingImages, setUploadingImages] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  // Initialize products from businessData
  useEffect(() => {
    if (businessData?.products && Array.isArray(businessData.products)) {
      setProducts(businessData.products.map((product, index) => ({
        ...product,
        id: `existing_${index}`,
        isExisting: true,
        oldPrice: product.oldPrice || '',
        newPrice: product.newPrice || ''
      })));
    }
  }, [businessData]);

  // Notify parent component of changes
  useEffect(() => {
    onProductsChange(products);
  }, [products, onProductsChange]);

  const addNewProduct = () => {
    const newProduct = {
      id: `new_${Date.now()}`,
      name: '',
      itemCode: '',
      discount: '',
      oldPrice: '',
      newPrice: '',
      imageUrl: '',
      inStock: true,
      isExisting: false
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (productId) => {
    setProducts(products.filter(p => p.id !== productId));
    // Clean up any related errors
    const newImageErrors = { ...imageErrors };
    delete newImageErrors[productId];
    setImageErrors(newImageErrors);
  };

  const updateProduct = (productId, field, value) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  const handleImageUpload = async (productId, file) => {
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageErrors({
        ...imageErrors,
        [productId]: 'Please upload a valid image (JPEG, PNG, or WebP)'
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setImageErrors({
        ...imageErrors,
        [productId]: 'Image size must be less than 5MB'
      });
      return;
    }

    setUploadingImages({ ...uploadingImages, [productId]: true });
    setImageErrors({ ...imageErrors, [productId]: '' });

    try {
      // Create unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `product_${timestamp}_${randomString}.${fileExtension}`;
      
      // Upload to Firebase Storage in product-images/permanent folder
      const storageRef = ref(storage, `product-images/permanent/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update product with image URL
      updateProduct(productId, 'imageUrl', downloadURL);
      
      console.log('Product image uploaded successfully:', downloadURL);
    } catch (error) {
      console.error('Error uploading product image:', error);
      setImageErrors({
        ...imageErrors,
        [productId]: `Upload failed: ${error.message}`
      });
    } finally {
      setUploadingImages({ ...uploadingImages, [productId]: false });
    }
  };

  const removeProductImage = (productId) => {
    updateProduct(productId, 'imageUrl', '');
  };

  const handlePriceChange = (productId, field, value) => {
    // Allow only numbers and decimals
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    const formattedValue = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : numericValue;
    
    updateProduct(productId, field, formattedValue);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Package size={24} color={colors.darkNavy} />
          <h3 style={{
            fontSize: '1.3rem',
            fontWeight: '700',
            color: colors.darkNavy,
            margin: 0
          }}>
            Update Products
          </h3>
        </div>
        <button
          type="button"
          onClick={addNewProduct}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: colors.darkNavy,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = colors.mediumBlue}
          onMouseLeave={(e) => e.target.style.backgroundColor = colors.darkNavy}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {validationError && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          color: '#ef4444',
          fontWeight: '500',
          marginBottom: '1rem'
        }}>
          {validationError}
        </div>
      )}

      {products.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #d1d5db'
        }}>
          <Package size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
            No products added yet. Click "Add Product" to start.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {products.map((product, index) => (
            <div
              key={product.id}
              style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                position: 'relative'
              }}
            >
              {/* Product Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: colors.darkNavy,
                  margin: 0
                }}>
                  Product {index + 1}
                  {product.isExisting && (
                    <span style={{
                      marginLeft: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      fontWeight: '400'
                    }}>
                      (Existing)
                    </span>
                  )}
                </h4>
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#fee',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fecaca'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#fee'}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Product Form Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {/* Product Name */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    color: colors.darkNavy,
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={product.name || ''}
                    onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                    placeholder="e.g., LG Sound System"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Item Code */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    color: colors.darkNavy,
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Item Code *
                  </label>
                  <input
                    type="text"
                    value={product.itemCode || ''}
                    onChange={(e) => updateProduct(product.id, 'itemCode', e.target.value)}
                    placeholder="e.g., 654216269CpUop65"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Old Price */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    color: colors.darkNavy,
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Old Price (LKR)
                  </label>
                  <input
                    type="text"
                    value={product.oldPrice || ''}
                    onChange={(e) => handlePriceChange(product.id, 'oldPrice', e.target.value)}
                    placeholder="e.g., 45000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* New Price */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    color: colors.darkNavy,
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    New Price (LKR)
                  </label>
                  <input
                    type="text"
                    value={product.newPrice || ''}
                    onChange={(e) => handlePriceChange(product.id, 'newPrice', e.target.value)}
                    placeholder="e.g., 40000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Discount */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    color: colors.darkNavy,
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={product.discount || ''}
                    onChange={(e) => updateProduct(product.id, 'discount', e.target.value)}
                    placeholder="e.g., 10"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* In Stock Toggle */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.4rem',
                    color: colors.darkNavy,
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Stock Status
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor: product.inStock ? '#f0fdf4' : '#fef2f2',
                    border: `2px solid ${product.inStock ? '#10b981' : '#ef4444'}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={product.inStock}
                      onChange={(e) => updateProduct(product.id, 'inStock', e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        marginRight: '0.5rem',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: product.inStock ? '#10b981' : '#ef4444'
                    }}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Price Calculation Display */}
              {product.oldPrice && product.newPrice && parseFloat(product.oldPrice) > parseFloat(product.newPrice) && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f0fdf4',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontSize: '0.9rem',
                      color: '#065f46',
                      fontWeight: '600'
                    }}>
                      Savings: LKR {(parseFloat(product.oldPrice) - parseFloat(product.newPrice)).toFixed(2)}
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      color: '#065f46',
                      fontWeight: '600'
                    }}>
                      Discount: {(((parseFloat(product.oldPrice) - parseFloat(product.newPrice)) / parseFloat(product.oldPrice)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Product Image Upload */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  color: colors.darkNavy,
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}>
                  Product Image
                </label>

                {product.imageUrl ? (
                  <div style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid #e5e7eb'
                  }}>
                    <img
                      src={product.imageUrl}
                      alt={product.name || 'Product'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeProductImage(product.id)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(product.id, file);
                      }}
                      id={`product-image-${product.id}`}
                      style={{ display: 'none' }}
                      disabled={uploadingImages[product.id]}
                    />
                    <label
                      htmlFor={`product-image-${product.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        backgroundColor: uploadingImages[product.id] ? '#f3f4f6' : '#f9fafb',
                        border: '2px dashed #d1d5db',
                        borderRadius: '8px',
                        cursor: uploadingImages[product.id] ? 'not-allowed' : 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: colors.mediumBlue,
                        transition: 'all 0.2s'
                      }}
                    >
                      {uploadingImages[product.id] ? (
                        <>
                          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Upload Image
                        </>
                      )}
                    </label>
                  </div>
                )}

                {imageErrors[product.id] && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginTop: '0.3rem'
                  }}>
                    {imageErrors[product.id]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProductsUpdateSection;