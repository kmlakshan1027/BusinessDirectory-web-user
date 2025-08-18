// App.js 
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/User/Home';
import AddBusiness from './pages/User/Add_Business';
import Update_Business from './pages/User/Update_Business'; 
import Remove_Business from './pages/User/Remove_Business';
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
          <Route path="/update-business" element={<Update_Business />} /> 
          <Route path="/remove-business" element={<Remove_Business />} /> 
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;