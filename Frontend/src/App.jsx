// src/App.jsx
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import PaymentForm from './components/PaymentForm';
import PaymentHistory from './components/PaymentHistory';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import './styles/globals.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  // Check if we're on a payment result page
  const currentPath = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  
  if (currentPath.includes('/payment/success') || urlParams.get('reference')) {
    return <PaymentSuccess />;
  }
  
  if (currentPath.includes('/payment/failed') || urlParams.get('error')) {
    return <PaymentFailed />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <PaymentForm />;
      case 'history':
        return <PaymentHistory />;
      default:
        return <PaymentForm />;
    }
  };

  return (
    <div className="app">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
          {renderContent()}
        </div>
      </main>
      
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 PayGateway. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;