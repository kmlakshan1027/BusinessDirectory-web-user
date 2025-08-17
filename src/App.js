// App.js 
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/User/Home';
import AddBusiness from './pages/User/Add_Business';
import Admin from './pages/Admin/Admin';
import AddBusinessRequest from './pages/Admin/AddBusinessRequest';
import AllBusinesses from './pages/Admin/AllBusinesses';
import Update_Business from './pages/User/Update_Business'; 
import Remove_Business from './pages/User/Remove_Business';
import UpdateBusinessRequest from './pages/Admin/UpdateBusinessRequest';
import RemoveBusinessRequest from './pages/Admin/RemoveBusinessRequest';
import Backend_Management from './pages/Admin/Backend_Management';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App" style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-business" element={<AddBusiness />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/add-business-requests" element={<AddBusinessRequest />} />
          <Route path="/admin/all-businesses" element={<AllBusinesses />} />
          <Route path="/update-business" element={<Update_Business />} /> 
          <Route path="/admin/update-business-requests" element={<UpdateBusinessRequest />} />
          <Route path="/remove-business" element={<Remove_Business />} /> 
          <Route path="/admin/remove-business-requests" element={<RemoveBusinessRequest />} />
          <Route path="/admin/backend-management" element={<Backend_Management />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;