import React from 'react';
import { RefreshIcon } from '../icons/Icons';

const ErrorAlert = ({ 
  error, 
  onRetry, 
  title = 'Error' 
}) => {
  return (
    <div className="alert alert-error">
      <h4>{title}</h4>
      <p>{error}</p>
      {onRetry && (
        <button 
          className="btn btn-outline btn-small mt-2"
          onClick={onRetry}
        >
          <RefreshIcon size={16} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;