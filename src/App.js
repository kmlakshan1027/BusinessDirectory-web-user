// App.js 
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/User/Home';
import AddBusiness from './pages/User/Add_Business';
import Update_Business from './pages/User/Update_Business'; 
import Remove_Business from './pages/User/Remove_Business';
import Login from './pages/User/Login'; // Import the Login component
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Login page as the default route */}
        <Route path="/home" element={
          <div className="App" style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
          }}>
            <Header />
            <Home />
            <Footer />
          </div>
        } />
        {/* Routes that should include Header and Footer */}
        <Route path="/add-business" element={
          <div className="App" style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
          }}>
            <Header />
            <AddBusiness />
            <Footer />
          </div>
        } />
        <Route path="/update-business" element={
          <div className="App" style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
          }}>
            <Header />
            <Update_Business />
            <Footer />
          </div>
        } /> 
        <Route path="/remove-business" element={
          <div className="App" style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
          }}>
            <Header />
            <Remove_Business />
            <Footer />
          </div>
        } /> 
      </Routes>
    </Router>
  );
}

export default App;