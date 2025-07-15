import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ExternalLinkIcon, AlertCircleIcon, ClockIcon } from '../components/icons/Icons';
import { useApp } from '../context/AppContext';
import { logEvent } from '../middleware/logEvent';

const RedirectPage = () => {
  const { shortCode } = useParams();
  const { getUrlByShortCode, recordClick } = useApp();
  const [status, setStatus] = useState('loading'); // loading, found, expired, notfound
  const [url, setUrl] = useState(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    logEvent('frontend', 'info', 'RedirectPage', 'Redirect attempt', { shortCode });

    const foundUrl = getUrlByShortCode(shortCode);
    
    if (!foundUrl) {
      setStatus('notfound');
      logEvent('frontend', 'warning', 'RedirectPage', 'URL not found', { shortCode });
      return;
    }

    const isExpired = new Date() > new Date(foundUrl.expiryDate);
    
    if (isExpired) {
      setStatus('expired');
      setUrl(foundUrl);
      logEvent('frontend', 'warning', 'RedirectPage', 'URL expired', { 
        shortCode,
        expiryDate: foundUrl.expiryDate 
      });
      return;
    }

    // Record the click
    try {
      recordClick(foundUrl.id, document.referrer);
      setUrl(foundUrl);
      setStatus('found');
      
      logEvent('frontend', 'info', 'RedirectPage', 'Successful redirect', {
        shortCode,
        originalUrl: foundUrl.originalUrl,
        clickCount: foundUrl.clicks.length + 1
      });

      // Start countdown for redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = foundUrl.originalUrl;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } catch (error) {
      logEvent('frontend', 'error', 'RedirectPage', 'Failed to record click', {
        error: error.message,
        shortCode
      });
      setStatus('expired');
      setUrl(foundUrl);
    }
  }, [shortCode, getUrlByShortCode, recordClick]);

  const handleManualRedirect = () => {
    if (url) {
      logEvent('frontend', 'info', 'RedirectPage', 'Manual redirect', { 
        shortCode,
        originalUrl: url.originalUrl 
      });
      window.open(url.originalUrl, '_blank');
    }
  };

  if (status === 'loading') {
    return (
      <div className="container container-sm" style={{ paddingTop: '64px' }}>
        <div className="card">
          <div className="card-content text-center p-4">
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <h3>Redirecting...</h3>
            <p className="text-secondary">
              Please wait while we redirect you to your destination.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="container container-sm" style={{ paddingTop: '64px' }}>
        <div className="card">
          <div className="card-content text-center p-4">
            <AlertCircleIcon size={64} color="var(--error-color)" style={{ marginBottom: '16px' }} />
            <h2>URL Not Found</h2>
            <p className="text-secondary mb-3">
              The short URL "{shortCode}" does not exist or has been removed.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/'}
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="container container-sm" style={{ paddingTop: '64px' }}>
        <div className="card">
          <div className="card-content text-center p-4">
            <ClockIcon size={64} color="var(--warning-color)" style={{ marginBottom: '16px' }} />
            <h2>URL Expired</h2>
            <p className="text-secondary mb-2">
              This short URL has expired and is no longer valid.
            </p>
            {url && (
              <>
                <div className="alert alert-info mb-3" style={{ textAlign: 'left' }}>
                  <p>
                    <strong>Original URL:</strong><br />
                    {url.originalUrl}
                  </p>
                  <p style={{ marginTop: '8px' }}>
                    <strong>Expired:</strong> {new Date(url.expiryDate).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-center" style={{ gap: '16px' }}>
                  <button 
                    className="btn btn-outline"
                    onClick={handleManualRedirect}
                  >
                    <ExternalLinkIcon size={16} />
                    Visit Original URL
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/'}
                  >
                    Create New URL
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'found' && url) {
    return (
      <div className="container container-sm" style={{ paddingTop: '64px' }}>
        <div className="card">
          <div className="card-content text-center p-4">
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <h2>Redirecting in {countdown}...</h2>
            <p className="text-secondary mb-2">
              You will be automatically redirected to:
            </p>
            <div className="code mb-3" style={{ wordBreak: 'break-all' }}>
              {url.originalUrl}
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleManualRedirect}
            >
              <ExternalLinkIcon size={16} />
              Go Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Navigate to="/" replace />;
};

export default RedirectPage;