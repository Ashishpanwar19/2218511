import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LinkIcon, MenuIcon, CloseIcon, BarChartIcon, ActivityIcon } from '../icons/Icons';
import { logEvent } from '../../middleware/logEvent';

const navigationItems = [
  { label: 'Shortener', path: '/', icon: LinkIcon },
  { label: 'Statistics', path: '/statistics', icon: BarChartIcon },
  { label: 'Analytics', path: '/analytics', icon: ActivityIcon }
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (path, label) => {
    navigate(path);
    setMobileMenuOpen(false);
    logEvent('frontend', 'info', 'Navbar', 'Navigation', { 
      from: location.pathname, 
      to: path,
      label 
    });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    logEvent('frontend', 'info', 'Navbar', 'Mobile menu toggled', { 
      isOpen: !mobileMenuOpen 
    });
  };

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <div 
              className="navbar-brand"
              onClick={() => handleNavigation('/', 'Home')}
            >
              <LinkIcon size={28} />
              URL Shortener
            </div>
            
            <ul className="navbar-nav">
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item.path, item.label);
                    }}
                    className={location.pathname === item.path ? 'active' : ''}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            
            <button 
              className="navbar-toggle"
              onClick={toggleMobileMenu}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      ></div>
      
      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <h3>Menu</h3>
          <button 
            className="btn btn-outline btn-small"
            onClick={() => setMobileMenuOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>
        
        <ul className="mobile-menu-nav">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation(item.path, item.label);
                }}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <item.icon size={20} />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Navbar;