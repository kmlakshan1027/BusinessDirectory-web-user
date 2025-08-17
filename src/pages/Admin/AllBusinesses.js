// pages/AllBusinesses.js 
import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, orderBy, query, doc, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs';
import { colors } from '../../utils/colors';
import BusinessCard from '../../components/BusinessCard';

const AllBusinesses = () => {
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'detailed'
  const [deletingBusinessId, setDeletingBusinessId] = useState(null);

  useEffect(() => {
    fetchAllBusinesses();
  }, []);

  const fetchAllBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting to fetch all businesses...');
      console.log('Firebase db:', db);

      const businessCollection = collection(db, 'BusinessList');
      console.log('Business collection created');

      // Get all businesses without any limits or complex queries first
      let businessSnapshot;
      try {
        console.log('Attempting to get all documents without orderBy...');
        businessSnapshot = await getDocs(businessCollection);
        console.log('Successfully fetched documents without orderBy');
      } catch (simpleQueryError) {
        console.error('Simple query failed:', simpleQueryError);
        throw simpleQueryError;
      }
      
      console.log('Documents found:', businessSnapshot.docs.length);
      console.log('Document IDs:', businessSnapshot.docs.map(doc => doc.id));

      if (businessSnapshot.empty) {
        console.warn('No documents found in BusinessList collection');
        setAllBusinesses([]);
        setCategories([]);
        setDistricts([]);
        return;
      }

      const businesses = businessSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Business data for doc', doc.id, ':', data);
        return {
          id: doc.id,
          ...data
        };
      });

      console.log('Total businesses processed:', businesses.length);

      // Sort manually by creation date, approved date, or alphabetically
      businesses.sort((a, b) => {
        // First try to sort by approvedAt if exists
        if (a.approvedAt && b.approvedAt) {
          const dateA = a.approvedAt?.toDate?.() || new Date(0);
          const dateB = b.approvedAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        }
        // Then try createdAt
        if (a.createdAt && b.createdAt) {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        }
        // Fallback to alphabetical by name
        return (a.name || '').localeCompare(b.name || '');
      });

      setAllBusinesses(businesses);
      
      // Extract unique categories and districts for filters
      const uniqueCategories = [...new Set(businesses.map(b => b.category).filter(Boolean))];
      const uniqueDistricts = [...new Set(businesses.map(b => b.district).filter(Boolean))];
      
      setCategories(uniqueCategories.sort());
      setDistricts(uniqueDistricts.sort());
      
      console.log('Successfully loaded', businesses.length, 'businesses');
      console.log('Categories found:', uniqueCategories);
      console.log('Districts found:', uniqueDistricts);
      
    } catch (error) {
      console.error('Error fetching all businesses:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      setError({
        message: error.message,
        code: error.code,
        details: error.toString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a debug function to test connection
  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
      const businessCollection = collection(db, 'BusinessList');
      
      // Try to get just one document to test connection
      const testQuery = query(businessCollection, limit(1));
      const testSnapshot = await getDocs(testQuery);
      
      console.log('Test connection successful');
      console.log('Test snapshot empty:', testSnapshot.empty);
      console.log('Test snapshot size:', testSnapshot.size);
      
      if (!testSnapshot.empty) {
        const testDoc = testSnapshot.docs[0];
        console.log('Test document ID:', testDoc.id);
        console.log('Test document data:', testDoc.data());
      }
      
      // Now try to get all documents
      const allSnapshot = await getDocs(businessCollection);
      console.log('All documents count:', allSnapshot.size);
      
    } catch (error) {
      console.error('Firebase connection test failed:', error);
    }
  };

  const handleDeleteBusiness = async (business) => {
    // Confirm deletion
    const confirmDeletion = window.confirm(
      `Are you sure you want to permanently delete "${business.name}"?

` +
      `⚠️ WARNING: This action cannot be undone!
` +
      `The business will be permanently removed from the system.`
    );

    if (!confirmDeletion) return;

    // Double confirmation for safety
    const doubleConfirm = window.confirm(
      `FINAL CONFIRMATION:

` +
      `You are about to permanently delete "${business.name}".
` +
      `This action is irreversible and the data cannot be recovered.

` +
      `Click OK to proceed with permanent deletion.`
    );

    if (!doubleConfirm) return;

    try {
      setDeletingBusinessId(business.id);
      console.log('Starting permanent business deletion for:', business.id);

      // Delete directly from BusinessList collection - no backup storage
      const businessDocRef = doc(db, 'BusinessList', business.id);
      await deleteDoc(businessDocRef);
      console.log('Successfully permanently deleted from BusinessList:', business.id);

      // Update local state
      setAllBusinesses(prevBusinesses => 
        prevBusinesses.filter(b => b.id !== business.id)
      );

      // Show success message
      alert(`Business "${business.name}" has been permanently deleted from the system.`);

    } catch (error) {
      console.error('Error deleting business:', error);
      alert(`Error deleting business: ${error.message}

Please try again or contact support if the problem persists.`);
    } finally {
      setDeletingBusinessId(null);
    }
  };

  // Filter businesses based on search and filter criteria
  const filteredBusinesses = allBusinesses.filter(business => {
    const matchesSearch = !searchTerm || 
      (business.name && business.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (business.business_ID && business.business_ID.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (business.category && business.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (business.district && business.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (business.originalTempID && business.originalTempID.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !filterCategory || business.category === filterCategory;
    const matchesDistrict = !filterDistrict || business.district === filterDistrict;
    const matchesStatus = !filterStatus || business.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesDistrict && matchesStatus;
  });

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
          <h2 style={{ color: colors.darkNavy }}>Loading all businesses...</h2>
          <p style={{ color: colors.mediumGray, marginTop: '1rem' }}>
            Please wait while we fetch the data from Firebase...
          </p>
          <button
            onClick={testFirebaseConnection}
            style={{
              backgroundColor: colors.mediumBlue,
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Test Connection (Check Console)
          </button>
        </div>
      </main>
    );
  }

  // Show error state
  if (error) {
    return (
      <main style={{
        flex: 1,
        padding: '3rem',
        backgroundColor: colors.lightGray,
        minHeight: '60vh'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '15px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            border: '2px solid #dc3545'
          }}>
            <h1 style={{ color: '#dc3545', marginBottom: '1rem' }}>
              Error Loading All Businesses
            </h1>
            <p style={{ color: colors.mediumGray, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              We encountered an issue while trying to load all businesses.
            </p>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <h3 style={{ color: colors.darkNavy, marginBottom: '1rem' }}>Error Details:</h3>
              <p style={{ color: colors.mediumGray, marginBottom: '0.5rem' }}>
                <strong>Code:</strong> {error.code || 'Unknown'}
              </p>
              <p style={{ color: colors.mediumGray, marginBottom: '0.5rem' }}>
                <strong>Message:</strong> {error.message || 'Unknown error'}
              </p>
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', color: colors.mediumBlue }}>
                  Show Full Error Details
                </summary>
                <pre style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  overflow: 'auto'
                }}>
                  {error.details}
                </pre>
              </details>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={fetchAllBusinesses}
                style={{
                  backgroundColor: colors.mediumBlue,
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}
              >
                Try Again
              </button>
              <button
                onClick={testFirebaseConnection}
                style={{
                  backgroundColor: colors.mediumGray,
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}
              >
                Test Connection
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .all-businesses-main {
              padding: 1.5rem !important;
            }
            .filters-grid {
              grid-template-columns: 1fr !important;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
        `}
      </style>
      
      <main className="all-businesses-main" style={{
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
              All Businesses - Complete Management
            </h1>
            <p style={{ 
              color: colors.mediumGray, 
              fontSize: '1.1rem',
              marginBottom: '1rem'
            }}>
              Comprehensive view of all businesses in the system with complete data visualization and permanent deletion functionality.
            </p>

            {/* Action Buttons Row */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              {/* View Mode Toggle */}
              <div>
                <button
                  onClick={() => setViewMode('card')}
                  style={{
                    backgroundColor: viewMode === 'card' ? colors.mediumBlue : 'white',
                    color: viewMode === 'card' ? 'white' : colors.mediumBlue,
                    border: `1px solid ${colors.mediumBlue}`,
                    padding: '0.5rem 1rem',
                    borderRadius: '5px 0 0 5px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Card View
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  style={{
                    backgroundColor: viewMode === 'detailed' ? colors.mediumBlue : 'white',
                    color: viewMode === 'detailed' ? 'white' : colors.mediumBlue,
                    border: `1px solid ${colors.mediumBlue}`,
                    borderLeft: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0 5px 5px 0',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Detailed View (All Fields)
                </button>
              </div>

              {/* Stats */}
              <div style={{
                backgroundColor: colors.mediumBlue,
                color: 'white',
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                fontWeight: '500'
              }}>
                Showing: {filteredBusinesses.length} of {allBusinesses.length} businesses
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div className="filters-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: colors.darkNavy
                }}>
                  Search Businesses
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID, category, district, temp ID..."
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    border: `1px solid ${colors.lightBlue}`,
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: colors.darkNavy
                }}>
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    border: `1px solid ${colors.lightBlue}`,
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: colors.darkNavy
                }}>
                  Filter by Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    border: `1px solid ${colors.lightBlue}`,
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: colors.darkNavy
                }}>
                  Filter by District
                </label>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    border: `1px solid ${colors.lightBlue}`,
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">All Districts</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button
                onClick={fetchAllBusinesses}
                style={{
                  backgroundColor: colors.mediumBlue,
                  color: 'white',
                  border: 'none',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>

          {/* Results */}
          {filteredBusinesses.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              padding: '3rem',
              borderRadius: '10px',
              textAlign: 'center',
              color: colors.mediumGray,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: '1rem', color: colors.darkNavy }}>
                {allBusinesses.length === 0 ? 'No Businesses Found' : 'No Results Found'}
              </h3>
              <p>
                {allBusinesses.length === 0 
                  ? 'There are no businesses in the system yet. Expected 10 documents from Firebase.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {(searchTerm || filterCategory || filterDistrict || filterStatus) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterDistrict('');
                    setFilterStatus('');
                  }}
                  style={{
                    backgroundColor: colors.mediumBlue,
                    color: 'white',
                    border: 'none',
                    padding: '0.7rem 1.5rem',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '1rem'
                  }}
                >
                  Clear All Filters
                </button>
              )}
              {allBusinesses.length === 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={testFirebaseConnection}
                    style={{
                      backgroundColor: colors.mediumGray,
                      color: 'white',
                      border: 'none',
                      padding: '0.7rem 1.5rem',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      marginRight: '1rem'
                    }}
                  >
                    Test Firebase Connection
                  </button>
                  <button
                    onClick={fetchAllBusinesses}
                    style={{
                      backgroundColor: colors.mediumBlue,
                      color: 'white',
                      border: 'none',
                      padding: '0.7rem 1.5rem',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Retry Fetch
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredBusinesses.map(business => (
              <BusinessCard
                key={business.id}
                business={business}
                viewMode={viewMode}
                deletingBusinessId={deletingBusinessId}
                handleDeleteBusiness={handleDeleteBusiness}
              />
            ))
          )}
        </div>
      </main>
    </>
  );
};

export default AllBusinesses;
