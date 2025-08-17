// components/Location_Management.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../configs/FirebaseConfigs';
import { colors } from '../utils/colors';

const LocationManagement = ({ isOpen, onClose }) => {
  // Location Management States
  const [activeTab, setActiveTab] = useState('view');
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDistrictData, setSelectedDistrictData] = useState(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [processingLocation, setProcessingLocation] = useState(false);
  
  // Edit states
  const [editingLocationKey, setEditingLocationKey] = useState(null);
  const [editLocationName, setEditLocationName] = useState('');
  const [deletingLocationKey, setDeletingLocationKey] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDistricts();
    }
  }, [isOpen]);

  const fetchDistricts = async () => {
    try {
      setLoadingDistricts(true);
      const locationsCollection = collection(db, 'Locations');
      const locationsSnapshot = await getDocs(locationsCollection);
      
      const districtsData = locationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort districts alphabetically by document ID (district name)
      districtsData.sort((a, b) => a.id.localeCompare(b.id));
      
      setDistricts(districtsData);
      console.log('Districts loaded:', districtsData);
    } catch (error) {
      console.error('Error fetching districts:', error);
      alert('Error loading districts: ' + error.message);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchLocationsForDistrict = async (districtId) => {
    if (!districtId) {
      setSelectedDistrictData(null);
      return;
    }

    try {
      setLoadingLocations(true);
      const districtDocRef = doc(db, 'Locations', districtId);
      const districtDoc = await getDoc(districtDocRef);
      
      if (districtDoc.exists()) {
        const data = districtDoc.data();
        console.log('District data:', data);
        setSelectedDistrictData({ id: districtId, ...data });
      } else {
        console.log('District document does not exist');
        setSelectedDistrictData({ id: districtId });
      }
    } catch (error) {
      console.error('Error fetching locations for district:', error);
      alert('Error loading locations: ' + error.message);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleDistrictChange = (districtId) => {
    setSelectedDistrict(districtId);
    fetchLocationsForDistrict(districtId);
    // Reset editing state when changing districts
    setEditingLocationKey(null);
    setEditLocationName('');
  };

  const getLocationsFromDistrictData = (districtData) => {
    if (!districtData) return [];
    
    // Get all name fields (name1, name2, name3, etc.)
    const locations = [];
    Object.keys(districtData).forEach(key => {
      if (key.startsWith('name') && key !== 'name' && districtData[key]) {
        locations.push({
          key: key,
          name: districtData[key],
          number: parseInt(key.replace('name', '')) || 0
        });
      }
    });
    
    // Sort by number
    locations.sort((a, b) => a.number - b.number);
    return locations;
  };

  const getNextNameKey = (districtData) => {
    if (!districtData) return 'name1';
    
    let maxNumber = 0;
    Object.keys(districtData).forEach(key => {
      if (key.startsWith('name') && key !== 'name') {
        const number = parseInt(key.replace('name', ''));
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    
    return `name${maxNumber + 1}`;
  };

  const handleAddLocation = async () => {
    if (!selectedDistrict) {
      alert('Please select a district first');
      return;
    }

    if (!newLocationName.trim()) {
      alert('Location name is required');
      return;
    }

    setProcessingLocation(true);

    try {
      const districtDocRef = doc(db, 'Locations', selectedDistrict);
      const districtDoc = await getDoc(districtDocRef);
      
      let currentData = {};
      if (districtDoc.exists()) {
        currentData = districtDoc.data();
      }

      // Check if location already exists
      const existingLocations = getLocationsFromDistrictData(currentData);
      const locationExists = existingLocations.some(loc => 
        loc.name.toLowerCase().trim() === newLocationName.toLowerCase().trim()
      );

      if (locationExists) {
        alert('This location already exists in the selected district');
        return;
      }

      // Get next available name key
      const nextKey = getNextNameKey(currentData);
      
      // Update document with new location
      const updateData = {
        ...currentData,
        [nextKey]: newLocationName.trim()
      };

      await updateDoc(districtDocRef, updateData);

      console.log('Location added successfully');
      alert(`Location "${newLocationName}" added to ${selectedDistrict} successfully!`);
      
      // Reset form
      setNewLocationName('');
      
      // Refresh locations for current district
      await fetchLocationsForDistrict(selectedDistrict);
      
    } catch (error) {
      console.error('Error adding location:', error);
      alert(`Error adding location: ${error.message}`);
    } finally {
      setProcessingLocation(false);
    }
  };

  const startEditLocation = (locationKey, locationName) => {
    console.log('Starting edit for location:', locationKey, locationName);
    setEditingLocationKey(locationKey);
    setEditLocationName(locationName);
  };

  const cancelEditLocation = () => {
    console.log('Cancelling location edit');
    setEditingLocationKey(null);
    setEditLocationName('');
  };

  const saveEditLocation = async (locationKey) => {
    console.log('Saving location:', locationKey);
    
    if (!editLocationName.trim()) {
      alert('Location name is required');
      return;
    }

    if (!selectedDistrict) {
      alert('No district selected');
      return;
    }

    setProcessingLocation(true);

    try {
      const districtDocRef = doc(db, 'Locations', selectedDistrict);
      const districtDoc = await getDoc(districtDocRef);
      
      if (!districtDoc.exists()) {
        throw new Error('District document not found');
      }

      const currentData = districtDoc.data();
      
      // Check if new name already exists (excluding current location)
      const existingLocations = getLocationsFromDistrictData(currentData);
      const nameExists = existingLocations.some(loc => 
        loc.key !== locationKey && 
        loc.name.toLowerCase().trim() === editLocationName.toLowerCase().trim()
      );

      if (nameExists) {
        alert('This location name already exists in the selected district');
        return;
      }

      // Update the specific location
      const updateData = {
        ...currentData,
        [locationKey]: editLocationName.trim()
      };

      await updateDoc(districtDocRef, updateData);

      console.log('Location updated successfully');
      alert('Location updated successfully!');
      
      cancelEditLocation();
      await fetchLocationsForDistrict(selectedDistrict);
      
    } catch (error) {
      console.error('Error updating location:', error);
      alert(`Error updating location: ${error.message}`);
    } finally {
      setProcessingLocation(false);
    }
  };

  const handleDeleteLocation = async (locationKey, locationName) => {
    console.log('Attempting to delete location:', locationKey, locationName);

    const isConfirmed = window.confirm(
      `Are you sure you want to permanently delete the location "${locationName}" from ${selectedDistrict}?\n\nThis action cannot be undone.`
    );

    if (!isConfirmed) {
      console.log('Location deletion cancelled by user.');
      return;
    }

    setDeletingLocationKey(locationKey);

    try {
      const districtDocRef = doc(db, 'Locations', selectedDistrict);
      const districtDoc = await getDoc(districtDocRef);
      
      if (!districtDoc.exists()) {
        throw new Error('District document not found');
      }

      const currentData = districtDoc.data();
      
      // Remove the location field
      const updateData = { ...currentData };
      delete updateData[locationKey];

      await updateDoc(districtDocRef, updateData);

      console.log('Successfully deleted location from Firestore:', locationKey);
      alert(`Location "${locationName}" has been deleted successfully from ${selectedDistrict}.`);

      // Refresh the locations for current district
      await fetchLocationsForDistrict(selectedDistrict);

    } catch (error) {
      console.error('Error deleting location:', error);
      alert(`Failed to delete location. Error: ${error.message}`);
    } finally {
      setDeletingLocationKey(null);
    }
  };

  const handleClose = () => {
    // Reset all states when closing
    setEditingLocationKey(null);
    setNewLocationName('');
    setEditLocationName('');
    setSelectedDistrict('');
    setSelectedDistrictData(null);
    setActiveTab('view');
    onClose();
  };

  if (!isOpen) return null;

  const currentLocations = getLocationsFromDistrictData(selectedDistrictData);

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
          maxWidth: '1000px',
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
              Location Management
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
              View Locations ({selectedDistrict ? currentLocations.length : 0})
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
              Add New Location
            </button>
          </div>

          {/* Modal Content */}
          <div style={{ padding: '1.5rem' }}>
            {/* District Selection (Common for both tabs) */}
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '2px solid #e9ecef'
            }}>
              <label style={{
                display: 'block',
                marginBottom: '0.8rem',
                fontWeight: '600',
                color: colors.darkNavy,
                fontSize: '1rem'
              }}>
                Select District *
              </label>
              {loadingDistricts ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem',
                  color: colors.mediumGray
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid ' + colors.mediumBlue,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Loading districts...
                </div>
              ) : (
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: `2px solid ${colors.lightBlue}`,
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Select a District --</option>
                  {districts.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.id} ({getLocationsFromDistrictData(district).length} locations)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {activeTab === 'view' && (
              <div>
                {!selectedDistrict ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: colors.mediumGray }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                    <h3 style={{ color: colors.darkNavy, marginBottom: '1rem' }}>Select a District</h3>
                    <p>Please select a district from the dropdown above to view and manage its locations.</p>
                  </div>
                ) : loadingLocations ? (
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
                    <p style={{ color: colors.mediumGray }}>Loading locations for {selectedDistrict}...</p>
                  </div>
                ) : currentLocations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: colors.mediumGray }}>
                    <h3 style={{ color: colors.darkNavy, marginBottom: '1rem' }}>No Locations in {selectedDistrict}</h3>
                    <p style={{ marginBottom: '1.5rem' }}>
                      This district doesn't have any locations yet. Add the first location using the "Add New Location" tab.
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
                      Add First Location
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* District Info Header */}
                    <div style={{
                      marginBottom: '1.3rem',
                      padding: '1rem',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '10px',
                      border: '2px solid #2196f3'
                    }}>
                      <h3 style={{ color: colors.darkNavy, margin: '0 0 0.5rem 0' }}>
                        {selectedDistrict} District
                      </h3>
                      <p style={{ margin: 0, color: colors.mediumGray, fontSize: '0.9rem' }}>
                        Managing {currentLocations.length} location{currentLocations.length !== 1 ? 's' : ''} in this district
                      </p>
                    </div>

                    {/* Locations List */}
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {currentLocations.map(location => (
                        <div
                          key={location.key}
                          style={{
                            border: '2px solid #e0e0e0',
                            borderRadius: '12px',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            backgroundColor: editingLocationKey === location.key ? '#f8f9ff' : 'white',
                            transition: 'all 0.2s ease',
                            borderColor: editingLocationKey === location.key ? colors.mediumBlue : '#e0e0e0'
                          }}
                        >

                          {/* Location Info */}
                          <div style={{ flex: 1 }}>
                            {editingLocationKey === location.key ? (
                              <div>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '0.5rem',
                                  fontWeight: '600',
                                  color: colors.darkNavy,
                                  fontSize: '0.9rem'
                                }}>
                                  Location Name *
                                </label>
                                <input
                                  type="text"
                                  value={editLocationName}
                                  onChange={(e) => setEditLocationName(e.target.value)}
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
                                  placeholder="Enter location name"
                                />
                              </div>
                            ) : (
                              <div>
                                <h4 style={{ 
                                  margin: '0 0 0.5rem 0', 
                                  color: colors.darkNavy,
                                  fontSize: '1.3rem',
                                  fontWeight: '600'
                                }}>
                                  {location.name}
                                </h4>
                                <p style={{ 
                                  margin: '0.3rem 0', 
                                  fontSize: '0.85rem', 
                                  color: colors.mediumGray,
                                  backgroundColor: '#f8f9fa',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  display: 'inline-block'
                                }}>
                                  Field: {location.key}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flexShrink: 0 }}>
                            {editingLocationKey === location.key ? (
                              <>
                                <button
                                  onClick={() => saveEditLocation(location.key)}
                                  disabled={processingLocation || !editLocationName.trim()}
                                  style={{
                                    backgroundColor: processingLocation ? '#cccccc' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.8rem 1.2rem',
                                    borderRadius: '8px',
                                    cursor: processingLocation ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    minWidth: '120px',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {processingLocation ? (
                                    <>
                                      <div style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid #ffffff',
                                        borderTop: '2px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                      }}></div>
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      ✅ Save
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={cancelEditLocation}
                                  disabled={processingLocation}
                                  style={{
                                    backgroundColor: colors.mediumGray,
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.8rem 1.2rem',
                                    borderRadius: '8px',
                                    cursor: processingLocation ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    opacity: processingLocation ? 0.6 : 1,
                                    minWidth: '120px'
                                  }}
                                >
                                  ❌ Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditLocation(location.key, location.name)}
                                  disabled={processingLocation || editingLocationKey !== null}
                                  style={{
                                    backgroundColor: colors.mediumBlue,
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.6rem 0.6rem',
                                    borderRadius: '8px',
                                    justifyContent: 'center',
                                    cursor: (processingLocation || editingLocationKey !== null) ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    opacity: (processingLocation || editingLocationKey !== null) ? 0.6 : 1,
                                    minWidth: '100px',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLocation(location.key, location.name)}
                                  disabled={processingLocation || deletingLocationKey === location.key || editingLocationKey !== null}
                                  style={{
                                    backgroundColor: (deletingLocationKey === location.key) ? '#6c757d' : '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.6rem 0.6rem',
                                    borderRadius: '8px',
                                    cursor: (processingLocation || deletingLocationKey === location.key || editingLocationKey !== null) ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    opacity: (processingLocation || deletingLocationKey === location.key || editingLocationKey !== null) ? 0.6 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    minWidth: '100px',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {deletingLocationKey === location.key ? (
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
                  </div>
                )}
              </div>
            )}

            {activeTab === 'add' && (
              <div>
                {!selectedDistrict ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: colors.mediumGray }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                    <h3 style={{ color: colors.darkNavy, marginBottom: '1rem' }}>Select a District First</h3>
                    <p>Please select a district from the dropdown above before adding a new location.</p>
                  </div>
                ) : (
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
                          Add New Location to {selectedDistrict}
                        </h3>
                        <p style={{ margin: 0, color: colors.mediumGray, fontSize: '0.9rem' }}>
                          Add a new location to {selectedDistrict} district. It will be stored as a new field in the district document.
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Location Name Input */}
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '0.8rem',
                          fontWeight: '600',
                          color: colors.darkNavy,
                          fontSize: '1rem'
                        }}>
                          Location Name *
                        </label>
                        <input
                          type="text"
                          value={newLocationName}
                          onChange={(e) => setNewLocationName(e.target.value)}
                          placeholder="Enter location name..."
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

                      {/* Current Locations in District */}
                      {currentLocations.length > 0 && (
                        <div style={{
                          border: '2px solid #28a745',
                          borderRadius: '15px',
                          padding: '1.5rem',
                          backgroundColor: '#f8fff9'
                        }}>
                          <h4 style={{ 
                            color: '#28a745', 
                            margin: '0 0 1rem 0',
                            fontSize: '1.1rem',
                            fontWeight: '600'
                          }}>
                            Current Locations in {selectedDistrict} ({currentLocations.length})
                          </h4>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.5rem',
                            maxHeight: '150px',
                            overflowY: 'auto'
                          }}>
                            {currentLocations.map(location => (
                              <div key={location.key} style={{
                                padding: '0.5rem',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #28a745',
                                fontSize: '0.9rem',
                                color: colors.darkNavy
                              }}>
                                {location.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Location Button */}
                      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <button
                          onClick={handleAddLocation}
                          disabled={processingLocation || !newLocationName.trim()}
                          style={{
                            backgroundColor: processingLocation ? '#cccccc' : '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '1.2rem 3rem',
                            borderRadius: '15px',
                            cursor: processingLocation ? 'not-allowed' : 'pointer',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            margin: '0 auto',
                            minWidth: '200px',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: processingLocation ? 'none' : '0 4px 12px rgba(40, 167, 69, 0.3)'
                          }}
                          onMouseOver={(e) => {
                            if (!processingLocation) {
                              e.target.style.backgroundColor = '#218838';
                              e.target.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!processingLocation) {
                              e.target.style.backgroundColor = '#28a745';
                              e.target.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          {processingLocation ? (
                            <>
                              <div style={{
                                width: '20px',
                                height: '20px',
                                border: '3px solid #ffffff',
                                borderTop: '3px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}></div>
                              Adding Location...
                            </>
                          ) : (
                            <>
                              Add Location to {selectedDistrict}
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
                            <li>Select a district first</li>
                            <li>Location name is required</li>
                            <li>Location names must be unique within the district</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LocationManagement;