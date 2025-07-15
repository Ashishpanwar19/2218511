import React, { useEffect } from 'react';

const Snackbar = ({ 
  open, 
  message, 
  severity = 'info', 
  onClose, 
  autoHideDuration = 4000 
}) => {
  useEffect(() => {
    if (open && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  return (
    <div className={`snackbar ${severity} ${open ? 'show' : ''}`}>
      {message}
    </div>
  );
};

export default Snackbar;