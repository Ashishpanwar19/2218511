import React, { useState, useMemo } from 'react';
import { MapPinIcon, GlobeIcon, CalendarIcon, ActivityIcon } from '../components/icons/Icons';
import { useApp } from '../context/AppContext';
import { logEvent } from '../middleware/logEvent';

const AnalyticsPage = () => {
  const { urls } = useApp();
  const [selectedUrl, setSelectedUrl] = useState('all');

  React.useEffect(() => {
    logEvent('frontend', 'info', 'AnalyticsPage', 'Page loaded', {
      totalUrls: urls.length,
      selectedUrl
    });
  }, [urls.length, selectedUrl]);

  // Get clicks data based on selection
  const clicksData = useMemo(() => {
    if (selectedUrl === 'all') {
      return urls.flatMap(url => 
        url.clicks.map(click => ({
          ...click,
          urlShortCode: url.shortCode,
          urlOriginal: url.originalUrl
        }))
      );
    } else {
      const url = urls.find(u => u.id === selectedUrl);
      return url ? url.clicks : [];
    }
  }, [urls, selectedUrl]);

  // Prepare geographic data
  const geoData = useMemo(() => {
    const geoCount = {};
    clicksData.forEach(click => {
      if (click.geolocation) {
        const location = `${click.geolocation.city}, ${click.geolocation.country}`;
        geoCount[location] = (geoCount[location] || 0) + 1;
      }
    });

    return Object.entries(geoCount)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [clicksData]);

  // Prepare referrer data
  const referrerData = useMemo(() => {
    const referrerCount = {};
    clicksData.forEach(click => {
      const referrer = click.referrer || 'Direct';
      referrerCount[referrer] = (referrerCount[referrer] || 0) + 1;
    });

    return Object.entries(referrerCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [clicksData]);

  // Prepare hourly clicks data
  const hourlyData = useMemo(() => {
    const hourlyCount = Array(24).fill(0);
    clicksData.forEach(click => {
      const hour = new Date(click.timestamp).getHours();
      hourlyCount[hour]++;
    });

    return hourlyCount.map((count, hour) => ({
      hour: `${hour}:00`,
      clicks: count
    }));
  }, [clicksData]);

  // Prepare daily clicks data (last 7 days)
  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        clicks: 0
      });
    }

    clicksData.forEach(click => {
      const clickDate = new Date(click.timestamp).toISOString().split('T')[0];
      const dayData = days.find(d => d.date === clickDate);
      if (dayData) {
        dayData.clicks++;
      }
    });

    return days;
  }, [clicksData]);

  const handleUrlChange = (event) => {
    const newSelectedUrl = event.target.value;
    setSelectedUrl(newSelectedUrl);
    logEvent('frontend', 'info', 'AnalyticsPage', 'URL filter changed', {
      from: selectedUrl,
      to: newSelectedUrl
    });
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

  const SimpleBarChart = ({ data, dataKey, color = 'var(--primary-color)' }) => {
    const maxValue = Math.max(...data.map(item => item[dataKey]));
    
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '4px', padding: '20px' }}>
        {data.map((item, index) => (
          <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                height: `${maxValue > 0 ? (item[dataKey] / maxValue) * 150 : 0}px`,
                backgroundColor: color,
                borderRadius: '4px 4px 0 0',
                minHeight: item[dataKey] > 0 ? '4px' : '0px',
                transition: 'height 0.3s ease'
              }}
              title={`${item.hour || item.day || item.location}: ${item[dataKey]} clicks`}
            />
            <small style={{ marginTop: '8px', fontSize: '0.75rem', textAlign: 'center' }}>
              {item.hour || item.day || (item.location && item.location.split(',')[0])}
            </small>
          </div>
        ))}
      </div>
    );
  };

  const SimplePieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ['var(--primary-color)', 'var(--secondary-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--error-color)'];
    
    return (
      <div style={{ padding: '20px' }}>
        {data.slice(0, 5).map((item, index) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: colors[index % colors.length],
                  borderRadius: '50%',
                  marginRight: '12px'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.name}</span>
                  <span>{percentage}%</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '4px', 
                  backgroundColor: 'var(--border-color)', 
                  borderRadius: '2px',
                  marginTop: '4px'
                }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: colors[index % colors.length],
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="card-content">
      <div className="mb-4">
        <h1>Detailed Analytics</h1>
        <p className="text-secondary">
          In-depth analysis of click patterns and user behavior
        </p>
      </div>

      {/* URL Selection */}
      <div className="card mb-4">
        <div className="card-content">
          <div className="form-group" style={{ maxWidth: '400px' }}>
            <label className="form-label">Select URL</label>
            <select
              className="form-select"
              value={selectedUrl}
              onChange={handleUrlChange}
            >
              <option value="all">All URLs</option>
              {urls.map((url) => (
                <option key={url.id} value={url.id}>
                  {url.shortCode} - {url.clicks.length} clicks
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-4 mb-4">
        <StatCard
          title="Total Clicks"
          value={clicksData.length}
          icon={ActivityIcon}
          colorClass="text-primary"
        />
        <StatCard
          title="Unique Locations"
          value={geoData.length}
          icon={MapPinIcon}
          colorClass="text-success"
        />
        <StatCard
          title="Traffic Sources"
          value={referrerData.length}
          icon={GlobeIcon}
          colorClass="text-warning"
        />
        <StatCard
          title="Peak Hour"
          value={hourlyData.reduce((max, curr) => curr.clicks > max.clicks ? curr : max, { clicks: 0, hour: 'N/A' }).hour}
          icon={CalendarIcon}
          colorClass="text-secondary"
        />
      </div>

      {clicksData.length === 0 ? (
        <div className="card">
          <div className="card-content text-center p-5">
            <h3 className="text-secondary">No click data available</h3>
            <p className="text-secondary mt-1">
              {selectedUrl === 'all' 
                ? 'No URLs have been clicked yet.'
                : 'This URL has not been clicked yet.'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid">
          {/* Daily Clicks Chart */}
          <div className="card mb-4">
            <div className="card-header">
              <h3>Daily Clicks (Last 7 Days)</h3>
            </div>
            <SimpleBarChart 
              data={dailyData} 
              dataKey="clicks" 
              color="var(--primary-color)" 
            />
          </div>

          <div className="grid grid-2 mb-4">
            {/* Referrer Sources */}
            <div className="card">
              <div className="card-header">
                <h3>Traffic Sources</h3>
              </div>
              <SimplePieChart data={referrerData} />
            </div>

            {/* Top Locations */}
            <div className="card">
              <div className="card-header">
                <h3>Top Locations</h3>
              </div>
              <SimpleBarChart 
                data={geoData.slice(0, 8)} 
                dataKey="count" 
                color="var(--success-color)" 
              />
            </div>
          </div>

          {/* Hourly Distribution */}
          <div className="card mb-4">
            <div className="card-header">
              <h3>Hourly Click Distribution</h3>
            </div>
            <SimpleBarChart 
              data={hourlyData} 
              dataKey="clicks" 
              color="var(--secondary-color)" 
            />
          </div>

          {/* Recent Clicks Table */}
          <div className="card">
            <div className="card-header">
              <h3>Recent Clicks</h3>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {clicksData
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 10)
                    .map((click, index) => (
                      <tr key={index}>
                        <td>
                          <small>{new Date(click.timestamp).toLocaleTimeString()}</small>
                        </td>
                        <td>
                          {click.geolocation ? 
                            `${click.geolocation.city}, ${click.geolocation.country}` : 
                            'Unknown'
                          }
                        </td>
                        <td>
                          <span className="chip chip-outline">
                            {click.referrer || 'Direct'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;