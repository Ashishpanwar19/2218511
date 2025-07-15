import React, { useState, useMemo } from 'react';
import {
  SearchIcon,
  CopyIcon,
  ExternalLinkIcon,
  BarChartIcon,
  UsersIcon,
  ClockIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from '../components/icons/Icons';
import { useApp } from '../context/AppContext';
import { logEvent } from '../middleware/logEvent';

const StatisticsPage = () => {
  const { urls } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired

  // Calculate overall statistics
  const stats = useMemo(() => {
    const now = new Date();
    const activeUrls = urls.filter(url => new Date(url.expiryDate) > now);
    const expiredUrls = urls.filter(url => new Date(url.expiryDate) <= now);
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks.length, 0);
    const avgClicksPerUrl = urls.length > 0 ? (totalClicks / urls.length).toFixed(1) : 0;

    return {
      totalUrls: urls.length,
      activeUrls: activeUrls.length,
      expiredUrls: expiredUrls.length,
      totalClicks,
      avgClicksPerUrl
    };
  }, [urls]);

  // Filter and search URLs
  const filteredUrls = useMemo(() => {
    let filtered = urls;

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(url => new Date(url.expiryDate) > new Date());
    } else if (filterStatus === 'expired') {
      filtered = filtered.filter(url => new Date(url.expiryDate) <= new Date());
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(url =>
        url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        url.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [urls, searchTerm, filterStatus]);

  React.useEffect(() => {
    logEvent('frontend', 'info', 'StatisticsPage', 'Page loaded', {
      totalUrls: stats.totalUrls,
      activeUrls: stats.activeUrls,
      expiredUrls: stats.expiredUrls
    });
  }, [stats]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      logEvent('frontend', 'info', 'StatisticsPage', 'URL copied', { url: text });
    } catch (err) {
      logEvent('frontend', 'error', 'StatisticsPage', 'Copy failed', { error: err.message });
    }
  };

  const getStatusChip = (url) => {
    const isExpired = new Date(url.expiryDate) <= new Date();
    return (
      <span className={`chip ${isExpired ? 'chip-error' : 'chip-success'}`}>
        {isExpired ? <AlertCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
        {isExpired ? 'Expired' : 'Active'}
      </span>
    );
  };

  const StatCard = ({ title, value, icon: Icon, colorClass = 'text-primary' }) => (
    <div className="card">
      <div className="card-content">
        <div className="flex flex-between">
          <div>
            <p className="text-secondary mb-1">{title}</p>
            <h2 className={colorClass}>{value}</h2>
          </div>
          <Icon size={32} className={colorClass} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="card-content">
      <div className="mb-4">
        <h1>Statistics Overview</h1>
        <p className="text-secondary">
          Comprehensive analytics for all your shortened URLs
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-5 mb-4">
        <StatCard
          title="Total URLs"
          value={stats.totalUrls}
          icon={BarChartIcon}
          colorClass="text-primary"
        />
        <StatCard
          title="Active URLs"
          value={stats.activeUrls}
          icon={CheckCircleIcon}
          colorClass="text-success"
        />
        <StatCard
          title="Expired URLs"
          value={stats.expiredUrls}
          icon={AlertCircleIcon}
          colorClass="text-error"
        />
        <StatCard
          title="Total Clicks"
          value={stats.totalClicks}
          icon={UsersIcon}
          colorClass="text-secondary"
        />
        <StatCard
          title="Avg Clicks"
          value={stats.avgClicksPerUrl}
          icon={TrendingUpIcon}
          colorClass="text-warning"
        />
      </div>

      {/* Filters and Search */}
      <div className="card mb-3">
        <div className="card-content">
          <div className="grid grid-2" style={{ alignItems: 'center' }}>
            <div className="form-group">
              <div style={{ position: 'relative' }}>
                <SearchIcon 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)'
                  }} 
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by URL or shortcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            <div className="flex flex-wrap" style={{ gap: '8px' }}>
              {['all', 'active', 'expired'].map((status) => (
                <button
                  key={status}
                  className={`btn btn-small ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterStatus(status)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* URLs Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Short Code</th>
                <th>Original URL</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Clicks</th>
                <th style={{ textAlign: 'center' }}>Created</th>
                <th style={{ textAlign: 'center' }}>Expires</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUrls.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                    <p className="text-secondary">
                      {urls.length === 0 
                        ? 'No URLs created yet. Start by creating your first short URL!' 
                        : 'No URLs match your search criteria.'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUrls.map((url) => (
                  <tr key={url.id}>
                    <td>
                      <code style={{ fontWeight: '600' }}>
                        {url.shortCode}
                      </code>
                    </td>
                    <td>
                      <div 
                        style={{ 
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={url.originalUrl}
                      >
                        {url.originalUrl}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {getStatusChip(url)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="chip chip-outline">
                        {url.clicks.length}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <small>
                        {new Date(url.createdAt).toLocaleDateString()}
                      </small>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <small>
                        {new Date(url.expiryDate).toLocaleDateString()}
                      </small>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="flex flex-center" style={{ gap: '4px' }}>
                        <button
                          className="btn btn-outline btn-small"
                          onClick={() => copyToClipboard(url.shortUrl)}
                          title="Copy Short URL"
                        >
                          <CopyIcon size={16} />
                        </button>
                        <button
                          className="btn btn-outline btn-small"
                          onClick={() => window.open(url.originalUrl, '_blank')}
                          title="Visit Original URL"
                        >
                          <ExternalLinkIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;