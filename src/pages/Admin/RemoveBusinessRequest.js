// pages/admin/RemoveBusinessRequest.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../configs/FirebaseConfigs.js';
import { colors } from '../../utils/colors.js';

const RemoveBusinessRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRemovalRequests();
  }, []);

  const fetchRemovalRequests = async () => {
    try {
      setLoading(true);
      const requestsCollection = collection(db, 'RemovalBusinessRequest');
      const q = query(requestsCollection, orderBy('requestedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const requestsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRequests(requestsList);
    } catch (error) {
      console.error('Error fetching removal requests:', error);
      alert('Error loading removal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRemoval = async (requestId, businessDocId, businessId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY REMOVE this business? This action cannot be undone!')) {
      return;
    }

    setProcessing(prev => ({ ...prev, [requestId]: 'approving' }));

    try {
      // First, delete the business from BusinessList collection
      if (businessDocId) {
        await deleteDoc(doc(db, 'BusinessList', businessDocId));
      }

      // Delete the removal request from RemovalBusinessRequest collection
      await deleteDoc(doc(db, 'RemovalBusinessRequest', requestId));

      // Refresh the requests list
      await fetchRemovalRequests();
      
      alert(`Business ${businessId} has been permanently removed from the system.`);
    } catch (error) {
      console.error('Error removing business:', error);
      alert('Failed to remove business. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const handleRejectRemoval = async (requestId, businessId) => {
    const reason = window.prompt('Please provide a reason for rejecting this removal request:');
    if (!reason) return;

    setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));

    try {
      await updateDoc(doc(db, 'RemovalBusinessRequest', requestId), {
        status: 'rejected',
        reviewedBy: 'Admin', // You can get actual admin user here
        reviewedAt: new Date(),
        rejectionReason: reason
      });

      // Refresh the requests list
      await fetchRemovalRequests();
      
      alert(`Removal request for ${businessId} has been rejected.`);
    } catch (error) {
      console.error('Error rejecting removal request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (err) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#28a745';
      case 'pending_review':
        return '#ffc107';
      case 'rejected':
        return '#dc3545';
      default:
        return colors.mediumGray;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_review':
        return 'Pending Review';
      case 'approved':
        return 'Approved & Removed';
      case 'rejected':
        return 'Rejected';
      default:
        return status || 'Unknown';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter || 
                         (filter === 'pending' && request.status === 'pending_review');
    const matchesSearch = !searchTerm || 
                         request.businessId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRequestStats = () => {
    const pending = requests.filter(r => r.status === 'pending_review').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    return { pending, approved, rejected, total: requests.length };
  };

  const stats = getRequestStats();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        fontSize: '1.2rem',
        color: colors.mediumBlue
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid ' + colors.mediumBlue,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading removal requests...
        </div>
      </div>
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
            .admin-main {
              padding: 1.5rem !important;
            }
            .controls {
              flex-direction: column !important;
              gap: 1rem !important;
            }
            .filter-tabs {
              flex-wrap: wrap !important;
            }
            .request-card {
              padding: 1rem !important;
            }
            .business-info-grid {
              grid-template-columns: 1fr !important;
            }
            .action-buttons {
              flex-direction: column !important;
              gap: 0.5rem !important;
            }
          }
        `}
      </style>

      <main className="admin-main" style={{
        flex: 1,
        padding: '3rem',
        backgroundColor: '#f8f9fa',
        minHeight: '60vh'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              color: colors.darkNavy,
              fontSize: '2rem',
              fontWeight: 'bold',
              margin: '0 0 0.5rem 0'
            }}>
              🗑️ Business Removal Requests
            </h1>
            <p style={{
              color: colors.mediumBlue,
              fontSize: '1.1rem',
              margin: 0
            }}>
              Review and process business removal requests from business owners
            </p>
          </div>

          {/* Controls */}
          <div className="controls" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            gap: '1rem'
          }}>
            {/* Filter Tabs */}
            <div className="filter-tabs" style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              {[
                { key: 'all', label: 'All', count: stats.total },
                { key: 'pending', label: 'Pending', count: stats.pending },
                { key: 'rejected', label: 'Rejected', count: stats.rejected }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    padding: '0.7rem 1.2rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: filter === tab.key ? colors.darkNavy : 'white',
                    color: filter === tab.key ? 'white' : colors.darkNavy,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by Business ID, Name, or Reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.7rem 1rem',
                border: `2px solid ${colors.lightBlue}`,
                borderRadius: '8px',
                fontSize: '1rem',
                width: '300px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Requests List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredRequests.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                padding: '3rem',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h3 style={{ color: colors.darkNavy, marginBottom: '0.5rem' }}>
                  No removal requests found
                </h3>
                <p style={{ color: colors.mediumBlue }}>
                  {searchTerm ? 'Try adjusting your search criteria' : 'No removal requests match the current filter'}
                </p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <div key={request.id} className="request-card" style={{
                  backgroundColor: 'white',
                  padding: '2rem',
                  borderRadius: '10px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: `3px solid ${getStatusColor(request.status)}`,
                  position: 'relative'
                }}>
                  {/* Status Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: getStatusColor(request.status),
                    color: 'white',
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    {getStatusText(request.status)}
                  </div>

                  {/* Request Header */}
                  <div style={{ marginBottom: '1.5rem', paddingRight: '120px' }}>
                    <h3 style={{
                      color: colors.darkNavy,
                      margin: '0 0 0.5rem 0',
                      fontSize: '1.3rem'
                    }}>
                      🗑️ Removal Request for: {request.businessName || 'Unknown Business'}
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: '2rem',
                      color: colors.mediumBlue,
                      fontSize: '0.9rem'
                    }}>
                      <span><strong>Business ID:</strong> {request.businessId}</span>
                      <span><strong>Requested:</strong> {formatDate(request.requestedAt)}</span>
                      {request.reviewedAt && (
                        <span><strong>Reviewed:</strong> {formatDate(request.reviewedAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Business Information */}
                  {request.businessData && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{
                        color: colors.darkNavy,
                        marginBottom: '1rem',
                        fontSize: '1.1rem'
                      }}>
                        📋 Business Information
                      </h4>
                      <div className="business-info-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1rem',
                        backgroundColor: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '8px'
                      }}>
                        <div>
                          <strong>Category:</strong> {request.businessData.category || 'N/A'}
                        </div>
                        <div>
                          <strong>Location:</strong> {request.businessData.location || 'N/A'}
                        </div>
                        <div>
                          <strong>District:</strong> {request.businessData.district || 'N/A'}
                        </div>
                        <div>
                          <strong>Contact:</strong> {request.businessData.contact || 'N/A'}
                        </div>
                        <div>
                          <strong>Email:</strong> {request.businessData.email || 'N/A'}
                        </div>
                        <div>
                          <strong>Created:</strong> {formatDate(request.businessData.createdAt)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Removal Reason */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{
                      color: colors.darkNavy,
                      marginBottom: '0.5rem',
                      fontSize: '1.1rem'
                    }}>
                      💭 Reason for Removal
                    </h4>
                    <div style={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px',
                      padding: '1rem'
                    }}>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#856404',
                        marginBottom: '0.5rem'
                      }}>
                        Category: {request.reasonCategory || 'Not specified'}
                      </div>
                      <div style={{ color: '#856404' }}>
                        <strong>Reason:</strong> {request.reason || 'No reason provided'}
                      </div>
                      {request.additionalComments && (
                        <div style={{
                          marginTop: '0.5rem',
                          color: '#856404'
                        }}>
                          <strong>Additional Comments:</strong> {request.additionalComments}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection Reason (if applicable) */}
                  {request.status === 'rejected' && request.rejectionReason && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{
                        color: '#dc3545',
                        marginBottom: '0.5rem',
                        fontSize: '1.1rem'
                      }}>
                        ❌ Rejection Reason
                      </h4>
                      <div style={{
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '8px',
                        padding: '1rem',
                        color: '#721c24'
                      }}>
                        {request.rejectionReason}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {request.status === 'pending_review' && (
                    <div className="action-buttons" style={{
                      display: 'flex',
                      gap: '1rem',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => handleRejectRemoval(request.id, request.businessId)}
                        disabled={processing[request.id]}
                        style={{
                          padding: '0.8rem 1.5rem',
                          border: 'none',
                          borderRadius: '8px',
                          backgroundColor: processing[request.id] === 'rejecting' ? colors.mediumGray : '#6c757d',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: processing[request.id] ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {processing[request.id] === 'rejecting' ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            Rejecting...
                          </>
                        ) : (
                          <>❌ Reject Request</>
                        )}
                      </button>

                      <button
                        onClick={() => handleApproveRemoval(request.id, request.businessDocId, request.businessId)}
                        disabled={processing[request.id]}
                        style={{
                          padding: '0.8rem 1.5rem',
                          border: 'none',
                          borderRadius: '8px',
                          backgroundColor: processing[request.id] === 'approving' ? colors.mediumGray : '#dc3545',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: processing[request.id] ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {processing[request.id] === 'approving' ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            Removing...
                          </>
                        ) : (
                          <>🗑️ Approve & Remove Business</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default RemoveBusinessRequest;