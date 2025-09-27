import React from 'react';
import { CreditCard, Home, History } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', label: 'Make Payment', icon: CreditCard },
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <CreditCard size={24} />
          <span>PayGateway</span>
        </div>
        
        <div className="navbar-menu">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                className={`navbar-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <IconComponent size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;