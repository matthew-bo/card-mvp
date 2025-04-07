import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
        <p className="text-gray-600">{message}</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment as we analyze your data.</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 