import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 40 }) => {
  return (
    <div className="loading-container">
      <div 
        className="spinner" 
        style={{ 
          width: size, 
          height: size 
        }}
      ></div>
      <p className="text-secondary">{message}</p>
    </div>
  );
};

export default LoadingSpinner;