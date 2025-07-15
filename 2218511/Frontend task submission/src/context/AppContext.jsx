import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { logEvent } from '../../logEvent';

const AppContext = createContext();

// Mock geolocation data
const mockGeoData = [
  { country: 'United States', city: 'New York', lat: 40.7128, lng: -74.0060 },
  { country: 'United Kingdom', city: 'London', lat: 51.5074, lng: -0.1278 },
  { country: 'Canada', city: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { country: 'Australia', city: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { country: 'Germany', city: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { country: 'Japan', city: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { country: 'France', city: 'Paris', lat: 48.8566, lng: 2.3522 },
  { country: 'Brazil', city: 'São Paulo', lat: -23.5505, lng: -46.6333 }
];

const referralSources = [
  'Direct', 'Google', 'Facebook', 'LinkedIn', 
  'Email', 'WhatsApp', 'YouTube', 'Instagram'
];

const initialState = {
  urls: [],
  loading: false,
  error: null
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'ADD_URL':
      return { 
        ...state, 
        urls: [action.payload, ...state.urls],
        loading: false,
        error: null
      };
    
    case 'UPDATE_URL':
      return {
        ...state,
        urls: state.urls.map(url => 
          url.id === action.payload.id ? action.payload : url
        )
      };
    
    case 'LOAD_URLS':
      return { ...state, urls: action.payload };
    
    case 'ADD_CLICK':
      return {
        ...state,
        urls: state.urls.map(url => 
          url.id === action.payload.urlId 
            ? { ...url, clicks: [...url.clicks, action.payload.click] }
            : url
        )
      };
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

 
  useEffect(() => {
    try {
      const savedUrls = localStorage.getItem('shortenerUrls');
      if (savedUrls) {
        const urls = JSON.parse(savedUrls);
        dispatch({ type: 'LOAD_URLS', payload: urls });
        logEvent('frontend', 'info', 'AppContext', 'URLs loaded from localStorage', { count: urls.length });
      }
    } catch (error) {
      logEvent('frontend', 'error', 'AppContext', 'Failed to load URLs from localStorage', { error: error.message });
    }
  }, []);

  // Save URLs to localStorage whenever urls change
  useEffect(() => {
    if (state.urls.length > 0) {
      try {
        localStorage.setItem('shortenerUrls', JSON.stringify(state.urls));
        logEvent('frontend', 'info', 'AppContext', 'URLs saved to localStorage', { count: state.urls.length });
      } catch (error) {
        logEvent('frontend', 'error', 'AppContext', 'Failed to save URLs to localStorage', { error: error.message });
      }
    }
  }, [state.urls]);

  const generateShortCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const createShortUrl = async (originalUrl, customCode = '', validityMinutes = 30) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      logEvent('frontend', 'info', 'AppContext', 'Starting URL creation', { 
        originalUrl, 
        customCode, 
        validityMinutes 
      });

      if (!isValidUrl(originalUrl)) {
        throw new Error('Invalid URL format');
      }

    
      if (customCode && state.urls.some(url => url.shortCode === customCode)) {
        throw new Error('Custom shortcode already exists');
      }

      
      if (customCode && !/^[a-zA-Z0-9]+$/.test(customCode)) {
        throw new Error('Shortcode must be alphanumeric');
      }

   
      await new Promise(resolve => setTimeout(resolve, 500));

      const shortCode = customCode || generateShortCode();
      const expiryDate = new Date(Date.now() + validityMinutes * 60 * 1000);
      
      const newUrl = {
        id: Date.now() + Math.random(),
        originalUrl,
        shortCode,
        shortUrl: `${window.location.origin}/${shortCode}`,
        createdAt: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        clicks: [],
        isActive: true,
        validityMinutes
      };

      dispatch({ type: 'ADD_URL', payload: newUrl });
      
      logEvent('frontend', 'info', 'AppContext', 'URL created successfully', {
        shortCode,
        originalUrl,
        expiryDate: expiryDate.toISOString()
      });

      return newUrl;
    } catch (error) {
      logEvent('frontend', 'error', 'AppContext', 'URL creation failed', { 
        error: error.message,
        originalUrl 
      });
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const recordClick = (urlId, referrer = 'Direct') => {
    try {
      const url = state.urls.find(u => u.id === urlId);
      if (!url) {
        throw new Error('URL not found');
      }

      if (new Date() > new Date(url.expiryDate)) {
        throw new Error('URL has expired');
      }

      const geoData = mockGeoData[Math.floor(Math.random() * mockGeoData.length)];
      const source = referralSources[Math.floor(Math.random() * referralSources.length)];
      
      const click = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        referrer: referrer || source,
        userAgent: navigator.userAgent,
        geolocation: geoData,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
      };

      dispatch({ type: 'ADD_CLICK', payload: { urlId, click } });
      
      logEvent('frontend', 'info', 'AppContext', 'Click recorded', {
        urlId,
        shortCode: url.shortCode,
        referrer: click.referrer,
        location: `${geoData.city}, ${geoData.country}`
      });

      return click;
    } catch (error) {
      logEvent('frontend', 'error', 'AppContext', 'Failed to record click', { 
        error: error.message,
        urlId 
      });
      throw error;
    }
  };

  const getUrlByShortCode = (shortCode) => {
    return state.urls.find(url => url.shortCode === shortCode);
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value = {
    ...state,
    createShortUrl,
    recordClick,
    getUrlByShortCode,
    clearError
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};