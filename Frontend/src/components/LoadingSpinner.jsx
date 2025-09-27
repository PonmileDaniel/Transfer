import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="loading">
      <div className="loading-content">
        <Loader2 className="loading-spinner" size={24} />
        <span>{text}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;