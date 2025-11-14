// ProductManager.js - Enhanced UI
import React, { useState } from 'react';
import { colors } from '../../src/utils/colors.js';
import { X, Plus, Image as ImageIcon, AlertCircle, Package, Tag, DollarSign, Percent, CheckCircle, XCircle } from 'lucide-react';

const MAX_PRODUCTS = 20;

const ProductManager = ({ products, setProducts, validationErrors, setValidationErrors }) => {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    image: null,
    imagePreview: null,
    name: '',
    itemCode: '',
    newPrice: '',
    oldPrice: '',
    discount: '',
    inStock: true
  });
  const [productErrors, setProductErrors] = useState({});

  // Calculate discount automatically
  const calculateDiscount = (newPrice, oldPrice) => {
    if (!newPrice || !oldPrice || parseFloat(oldPrice) <= 0) return '';
    const discount = ((parseFloat(oldPrice) - parseFloat(newPrice)) / parseFloat(oldPrice) * 100);
    return discount > 0 ? Math.round(discount) : '';
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProductErrors(prev => ({
        ...prev,
        image: 'Please select a valid image file'
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProductErrors(prev => ({
        ...prev,
        image: 'Image size must be less than 5MB'
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCurrentProduct(prev => ({
        ...prev,
        image: file,
        imagePreview: e.target.result
      }));
      setProductErrors(prev => ({ ...prev, image: undefined }));
    };
    reader.readAsDataURL(file);
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setCurrentProduct(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'newPrice' || field === 'oldPrice') {
        const discount = calculateDiscount(
          field === 'newPrice' ? value : updated.newPrice,
          field === 'oldPrice' ? value : updated.oldPrice
        );
        updated.discount = discount;
      }
      
      return updated;
    });
    
    if (productErrors[field]) {
      setProductErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate product
  const validateProduct = () => {
    const errors = {};
    
    if (!currentProduct.image) {
      errors.image = 'Product image is required';
    }
    
    if (!currentProduct.name.trim()) {
      errors.name = 'Product name is required';
    } else if (currentProduct.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters';
    } else if (currentProduct.name.trim().length > 100) {
      errors.name = 'Product name must not exceed 100 characters';
    }
    
    if (currentProduct.newPrice) {
      const newPrice = parseFloat(currentProduct.newPrice);
      if (isNaN(newPrice) || newPrice < 0) {
        errors.newPrice = 'Please enter a valid price';
      }
    }
    
    if (currentProduct.oldPrice) {
      const oldPrice = parseFloat(currentProduct.oldPrice);
      if (isNaN(oldPrice) || oldPrice < 0) {
        errors.oldPrice = 'Please enter a valid price';
      } else if (currentProduct.newPrice && oldPrice <= parseFloat(currentProduct.newPrice)) {
        errors.oldPrice = 'Old price must be greater than new price';
      }
    }
    
    setProductErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add product
  const handleAddProduct = () => {
    if (!validateProduct()) return;
    
    if (products.length >= MAX_PRODUCTS) {
      setProductErrors({ general: `Maximum ${MAX_PRODUCTS} products allowed` });
      return;
    }
    
    const newProduct = {
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      image: currentProduct.image,
      imagePreview: currentProduct.imagePreview,
      name: currentProduct.name.trim(),
      itemCode: currentProduct.itemCode.trim(),
      newPrice: currentProduct.newPrice,
      oldPrice: currentProduct.oldPrice,
      discount: currentProduct.discount,
      inStock: currentProduct.inStock
    };
    
    setProducts(prev => [...prev, newProduct]);
    
    setCurrentProduct({
      image: null,
      imagePreview: null,
      name: '',
      itemCode: '',
      newPrice: '',
      oldPrice: '',
      discount: '',
      inStock: true
    });
    setProductErrors({});
    setIsAddingProduct(false);
  };

  // Remove product
  const handleRemoveProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Cancel adding product
  const handleCancel = () => {
    setCurrentProduct({
      image: null,
      imagePreview: null,
      name: '',
      itemCode: '',
      newPrice: '',
      oldPrice: '',
      discount: '',
      inStock: true
    });
    setProductErrors({});
    setIsAddingProduct(false);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0F4C75 0%, #3282B8 100%)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(50, 130, 184, 0.25)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <Package size={28} color="white" />
              <h3 style={{
                color: 'white',
                fontSize: '1.75rem',
                fontWeight: '700',
                margin: 0
              }}>
                Product Showcase
              </h3>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1rem',
              margin: 0
            }}>
              Highlight your best offerings • Up to {MAX_PRODUCTS} products
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(187, 225, 250, 0.25)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            border: '2px solid rgba(187, 225, 250, 0.4)'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'white',
              lineHeight: '1'
            }}>
              {products.length}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.9)',
              marginTop: '0.25rem'
            }}>
              of {MAX_PRODUCTS} products
            </div>
          </div>
        </div>
      </div>

      {/* Added Products Grid */}
      {products.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: 'white',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                border: '1px solid #e5e7eb'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
              }}
            >
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveProduct(product.id)}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.95)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  zIndex: 2,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.95)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={18} />
              </button>
              
              {/* Stock Status Badge */}
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                backgroundColor: product.inStock ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                zIndex: 2,
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}>
                {product.inStock ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {product.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
              </div>
              
              {/* Product Image */}
              {product.imagePreview && (
                <div style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#f3f4f6',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <img
                    src={product.imagePreview}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: product.inStock ? 1 : 0.6
                    }}
                  />
                  {!product.inStock && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(2px)'
                    }} />
                  )}
                </div>
              )}
              
              {/* Product Details */}
              <div style={{ padding: '1.25rem' }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: colors.darkNavy,
                  margin: '0 0 0.75rem 0',
                  wordBreak: 'break-word',
                  lineHeight: '1.4'
                }}>
                  {product.name}
                </h4>
                
                {product.itemCode && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    padding: '0.5rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px'
                  }}>
                    <Tag size={14} color={colors.mediumBlue} />
                    <span style={{
                      fontSize: '0.85rem',
                      color: colors.mediumBlue,
                      fontWeight: '600'
                    }}>
                      {product.itemCode}
                    </span>
                  </div>
                )}
                
                {/* Price Section */}
                <div style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '1rem',
                  marginTop: '1rem'
                }}>
                  {product.newPrice && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <DollarSign size={18} color={colors.darkNavy} />
                      <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: colors.darkNavy
                      }}>
                        Rs. {parseFloat(product.newPrice).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {product.oldPrice && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        fontSize: '1rem',
                        textDecoration: 'line-through',
                        color: '#9ca3af'
                      }}>
                        Rs. {parseFloat(product.oldPrice).toLocaleString()}
                      </span>
                      {product.discount && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          padding: '0.3rem 0.7rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '700'
                        }}>
                          <Percent size={14} />
                          {product.discount}% OFF
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Button */}
      {!isAddingProduct && products.length < MAX_PRODUCTS && (
        <button
          type="button"
          onClick={() => setIsAddingProduct(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #0F4C75 0%, #3282B8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: '700',
            transition: 'all 0.3s',
            boxShadow: '0 4px 20px rgba(50, 130, 184, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(50, 130, 184, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(50, 130, 184, 0.3)';
          }}
        >
          <Plus size={24} />
          Add New Product
        </button>
      )}

      {/* Add Product Form */}
      {isAddingProduct && (
        <div style={{
          border: '2px solid #e5e7eb',
          borderRadius: '20px',
          padding: '2.5rem',
          backgroundColor: 'white',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Form Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0F4C75 0%, #3282B8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={26} color="white" />
            </div>
            <div>
              <h4 style={{
                color: colors.darkNavy,
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0 0 0.25rem 0'
              }}>
                Add New Product
              </h4>
              <p style={{
                color: colors.mediumBlue,
                fontSize: '0.95rem',
                margin: 0
              }}>
                Fill in the product details below
              </p>
            </div>
          </div>

          {productErrors.general && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <AlertCircle size={20} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: '600' }}>
                {productErrors.general}
              </span>
            </div>
          )}

          {/* Image Upload Section */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              color: colors.darkNavy,
              fontWeight: '700',
              fontSize: '1.05rem'
            }}>
              <ImageIcon size={20} />
              Product Image <span style={{ color: '#ef4444' }}>*</span>
            </label>
            
            <div
              style={{
                border: `3px dashed ${productErrors.image ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '16px',
                padding: currentProduct.imagePreview ? '0' : '3rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: currentProduct.imagePreview ? 'transparent' : '#f9fafb',
                transition: 'all 0.3s',
                overflow: 'hidden'
              }}
              onClick={() => document.getElementById('product-image-input').click()}
              onMouseEnter={(e) => {
                if (!currentProduct.imagePreview) {
                  e.currentTarget.style.borderColor = colors.mediumBlue;
                  e.currentTarget.style.backgroundColor = '#f0f4ff';
                }
              }}
              onMouseLeave={(e) => {
                if (!currentProduct.imagePreview) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
            >
              {currentProduct.imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={currentProduct.imagePreview}
                    alt="Product preview"
                    style={{
                      width: '100%',
                      maxHeight: '350px',
                      objectFit: 'contain',
                      borderRadius: '12px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentProduct(prev => ({
                        ...prev,
                        image: null,
                        imagePreview: null
                      }));
                    }}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 1.5rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0F4C75 0%, #3282B8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ImageIcon size={40} color="white" />
                  </div>
                  <p style={{
                    color: colors.darkNavy,
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    Click to upload product image
                  </p>
                  <p style={{
                    color: colors.mediumBlue,
                    fontSize: '0.9rem',
                    margin: 0
                  }}>
                    Maximum 5MB • JPG, PNG supported
                  </p>
                </>
              )}
            </div>
            <input
              id="product-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            {productErrors.image && (
              <div style={{
                color: '#ef4444',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                {productErrors.image}
              </div>
            )}
          </div>

          {/* Product Name */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              color: colors.darkNavy,
              fontWeight: '700',
              fontSize: '1.05rem'
            }}>
              <Package size={18} />
              Product Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={currentProduct.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="e.g., Premium Wireless Headphones"
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: `2px solid ${productErrors.name ? '#ef4444' : '#e5e7eb'}`,
                borderRadius: '12px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.mediumBlue;
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = productErrors.name ? '#ef4444' : '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
            {productErrors.name && (
              <div style={{
                color: '#ef4444',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                {productErrors.name}
              </div>
            )}
          </div>

          {/* Item Code */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              color: colors.darkNavy,
              fontWeight: '700',
              fontSize: '1.05rem'
            }}>
              <Tag size={18} />
              Item Code <span style={{ color: colors.mediumBlue, fontSize: '0.9rem', fontWeight: '400' }}>(Optional)</span>
            </label>
            <input
              type="text"
              value={currentProduct.itemCode}
              onChange={(e) => handleFieldChange('itemCode', e.target.value)}
              placeholder="e.g., WHD-2024-001"
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.mediumBlue;
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Stock Availability */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: `3px solid ${currentProduct.inStock ? '#22c55e' : '#ef4444'}`,
            borderRadius: '16px',
            backgroundColor: currentProduct.inStock ? '#f0fdf4' : '#fef2f2',
            transition: 'all 0.3s'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '1.05rem',
              fontWeight: '700',
              color: colors.darkNavy
            }}>
              <input
                type="checkbox"
                checked={currentProduct.inStock}
                onChange={(e) => handleFieldChange('inStock', e.target.checked)}
                style={{
                  marginRight: '1rem',
                  transform: 'scale(1.4)',
                  cursor: 'pointer',
                  accentColor: currentProduct.inStock ? '#22c55e' : '#ef4444'
                }}
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {currentProduct.inStock ? <CheckCircle size={20} color="#22c55e" /> : <XCircle size={20} color="#ef4444" />}
                Product is {currentProduct.inStock ? 'In Stock' : 'Out of Stock'}
              </div>
            </label>
            <p style={{
              margin: '0.75rem 0 0 0',
              fontSize: '0.95rem',
              color: colors.mediumBlue,
              paddingLeft: '2.5rem'
            }}>
              {currentProduct.inStock 
                ? '✓ Product is currently available for purchase' 
                : '✗ Product is currently unavailable'}
            </p>
          </div>

          {/* Pricing Section */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h5 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: colors.darkNavy,
              fontSize: '1.2rem',
              fontWeight: '700',
              margin: '0 0 1.5rem 0'
            }}>
              <DollarSign size={22} />
              Pricing Details
            </h5>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* New Price */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: colors.darkNavy,
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Current Price (Rs.)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.mediumBlue,
                    fontWeight: '600',
                    fontSize: '1.1rem'
                  }}>
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentProduct.newPrice}
                    onChange={(e) => handleFieldChange('newPrice', e.target.value)}
                    placeholder="40374"
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3.5rem',
                      border: `2px solid ${productErrors.newPrice ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      backgroundColor: 'white',
                      transition: 'all 0.3s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.mediumBlue;
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = productErrors.newPrice ? '#ef4444' : '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {productErrors.newPrice && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertCircle size={14} />
                    {productErrors.newPrice}
                  </div>
                )}
              </div>

              {/* Old Price */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: colors.darkNavy,
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Original Price (Rs.)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.mediumBlue,
                    fontWeight: '600',
                    fontSize: '1.1rem'
                  }}>
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentProduct.oldPrice}
                    onChange={(e) => handleFieldChange('oldPrice', e.target.value)}
                    placeholder="42499"
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3.5rem',
                      border: `2px solid ${productErrors.oldPrice ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      backgroundColor: 'white',
                      transition: 'all 0.3s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.mediumBlue;
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = productErrors.oldPrice ? '#ef4444' : '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {productErrors.oldPrice && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertCircle size={14} />
                    {productErrors.oldPrice}
                  </div>
                )}
              </div>

              {/* Discount (Auto-calculated) */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  color: colors.darkNavy,
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Discount
                </label>
                <div style={{ position: 'relative' }}>
                  <Percent size={18} style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: currentProduct.discount ? '#22c55e' : colors.mediumBlue
                  }} />
                  <input
                    type="text"
                    value={currentProduct.discount ? `${currentProduct.discount}%` : ''}
                    readOnly
                    placeholder="Auto-calculated"
                    style={{
                      width: '100%',
                      padding: '1rem 3rem 1rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      backgroundColor: currentProduct.discount ? '#f0fdf4' : '#f3f4f6',
                      color: currentProduct.discount ? '#22c55e' : colors.mediumBlue,
                      fontWeight: currentProduct.discount ? '700' : '400',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: colors.mediumBlue,
                  marginTop: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  ✓ Calculated automatically
                </div>
              </div>
            </div>

            {/* Pricing Preview */}
            {(currentProduct.newPrice || currentProduct.oldPrice) && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  color: colors.mediumBlue,
                  fontWeight: '600',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Price Preview
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  {currentProduct.newPrice && (
                    <span style={{
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      color: colors.darkNavy
                    }}>
                      Rs. {parseFloat(currentProduct.newPrice).toLocaleString()}
                    </span>
                  )}
                  {currentProduct.oldPrice && (
                    <span style={{
                      fontSize: '1.25rem',
                      textDecoration: 'line-through',
                      color: '#9ca3af'
                    }}>
                      Rs. {parseFloat(currentProduct.oldPrice).toLocaleString()}
                    </span>
                  )}
                  {currentProduct.discount && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '700'
                    }}>
                      <Percent size={16} />
                      {currentProduct.discount}% OFF
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '1.25rem',
                backgroundColor: 'white',
                color: colors.darkNavy,
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '700',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = colors.mediumBlue;
                e.currentTarget.style.color = colors.mediumBlue;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = colors.darkNavy;
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddProduct}
              style={{
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #0F4C75 0%, #3282B8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '700',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
              }}
            >
              <Plus size={20} />
              Add Product
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;