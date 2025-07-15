import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import ShortenerPage from './pages/ShortenerPage';
import StatisticsPage from './pages/StatisticsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RedirectPage from './pages/RedirectPage';
import { logEvent } from './middleware/logEvent';
import './styles/global.css';

function App() {
  React.useEffect(() => {
    logEvent('frontend', 'info', 'App', 'Application started', {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }, []);

  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Redirect route - outside of Layout to avoid navbar */}
          <Route path="/:shortCode" element={<RedirectPage />} />
          
          {/* Main application routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<ShortenerPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;