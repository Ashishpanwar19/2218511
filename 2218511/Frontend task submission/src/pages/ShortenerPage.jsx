import React, { useState } from 'react';
import { 
  LinkIcon, 
  CopyIcon, 
  CheckCircleIcon, 
  ExternalLinkIcon, 
  ClockIcon, 
  ZapIcon 
} from '../components/icons/Icons';
import { useApp } from '../context/AppContext';
import { logEvent } from '../middleware/logEvent';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import Snackbar from '../components/common/Snackbar';

const validityOptions = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 180, label: '3 hours' },
  { value: 360, label: '6 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: '24 hours' },
  { value: 4320, label: '3 days' },
  { value: 10080, label: '1 week' }
];

const ShortenerPage = () => {
  const { createShortUrl, loading, error, clearError } = useApp();
  
  const [formData, setFormData] = useState({
    originalUrl: '',
    customCode: '',
    validityMinutes: 30
  });
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    if (error) clearError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    logEvent('frontend', 'info', 'ShortenerPage', 'Form submission started', formData);
    
    try {
      const result = await createShortUrl(
        formData.originalUrl,
        formData.customCode,
        formData.validityMinutes
      );
      
      setGeneratedUrl(result);
      setFormData({
        originalUrl: '',
        customCode: '',
        validityMinutes: 30
      });
      
      logEvent('frontend', 'info', 'ShortenerPage', 'URL created successfully', {
        shortCode: result.shortCode,
        originalUrl: result.originalUrl
      });
      
      setSnackbar({
        open: true,
        message: 'Short URL created successfully!',
        severity: 'success'
      });
    } catch (err) {
      logEvent('frontend', 'error', 'ShortenerPage', 'URL creation failed', {
        error: err.message,
        formData
      });
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({
        open: true,
        message: 'Copied to clipboard!',
        severity: 'success'
      });
      
      logEvent('frontend', 'info', 'ShortenerPage', 'URL copied to clipboard', { url: text });
    } catch (err) {
      logEvent('frontend', 'error', 'ShortenerPage', 'Failed to copy URL', { error: err.message });
      setSnackbar({
        open: true,
        message: 'Failed to copy URL',
        severity: 'error'
      });
    }
  };

  const openInNewTab = (url) => {
    // Ensure the URL has a protocol
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    window.open(fullUrl, '_blank');
    logEvent('frontend', 'info', 'ShortenerPage', 'URL opened in new tab', { url });
  };

  return (
    <div className="card-content">
      <div className="text-center mb-4">
        <h1 style={{ 
          background: 'linear-gradient(45deg, var(--primary-color), var(--primary-light))',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px'
        }}>
          URL Shortener
        </h1>
        <h3 className="text-secondary">
          Transform long URLs into short, shareable links
        </h3>
      </div>

      <div className="card mb-4">
        <div className="card-content">
          <form onSubmit={handleSubmit}>
            <div className="grid">
              <div className="form-group">
                <label className="form-label">
                  <LinkIcon size={16} style={{ marginRight: '8px' }} />
                  Original URL
                </label>
                <input
                  type="url"
                  className={`form-input ${error ? 'error' : ''}`}
                  placeholder="https://example.com/very-long-url..."
                  value={formData.originalUrl}
                  onChange={handleInputChange('originalUrl')}
                  required
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">
                    <ZapIcon size={16} style={{ marginRight: '8px' }} />
                    Custom Shortcode (optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="my-custom-link"
                    value={formData.customCode}
                    onChange={handleInputChange('customCode')}
                  />
                  <div className="form-help">Alphanumeric characters only</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <ClockIcon size={16} style={{ marginRight: '8px' }} />
                    Validity Period
                  </label>
                  <select
                    className="form-select"
                    value={formData.validityMinutes}
                    onChange={handleInputChange('validityMinutes')}
                  >
                    {validityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <button
                  type="submit"
                  className="btn btn-primary btn-large btn-full"
                  disabled={loading || !formData.originalUrl}
                >
                  {loading ? <LoadingSpinner size={24} message="" /> : 'Shorten URL'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="mb-3">
          <ErrorAlert 
            error={error}
            onRetry={clearError}
            title="Failed to create short URL"
          />
        </div>
      )}

      {generatedUrl && (
        <div className="card mb-4">
          <div className="card-content">
            <div className="flex" style={{ alignItems: 'center', marginBottom: '16px' }}>
              <CheckCircleIcon size={24} color="var(--success-color)" style={{ marginRight: '8px' }} />
              <h3 className="text-success">Short URL Created Successfully!</h3>
            </div>

            <div className="grid grid-2" style={{ alignItems: 'center', gap: '16px' }}>
              <div>
                <div className="code">
                  {generatedUrl.shortUrl}
                </div>
              </div>

              <div className="flex" style={{ gap: '8px' }}>
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => copyToClipboard(generatedUrl.shortUrl)}
                >
                  <CopyIcon size={16} />
                  Copy
                </button>
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => window.open(generatedUrl.originalUrl, '_blank')}
                >
                  <ExternalLinkIcon size={16} />
                  Visit
                </button>
              </div>
            </div>

            <div className="flex flex-wrap mt-3" style={{ gap: '8px' }}>
              <span className="chip chip-warning">
                Expires: {new Date(generatedUrl.expiryDate).toLocaleString()}
              </span>
              <span className="chip chip-primary">
                Code: {generatedUrl.shortCode}
              </span>
            </div>
          </div>
        </div>
      )}

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};

export default ShortenerPage;