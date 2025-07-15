import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { logEvent } from '../../middleware/logEvent';

const Layout = () => {
  const location = useLocation();

  React.useEffect(() => {
    logEvent('frontend', 'info', 'Layout', 'Page navigation', { 
      path: location.pathname
    });
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Navbar />
      
      <main className="main-content">
        <div className="container">
          <div className="card">
            <Outlet />
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          URL Shortener © 2025 - Built with React & Vanilla CSS
        </div>
      </footer>
    </div>
  );
};

export default Layout;