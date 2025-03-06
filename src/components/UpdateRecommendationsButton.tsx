import React from 'react';

interface UpdateRecommendationsButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
}

const UpdateRecommendationsButton: React.FC<UpdateRecommendationsButtonProps> = ({
  onClick,
  loading = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center justify-center px-4 py-2 bg-white border border-gray-200 
        rounded-lg shadow-sm hover:shadow-md text-blue-600 hover:text-blue-800 
        transition-all duration-300 ${className}`}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      {loading ? 'Updating...' : 'Update Recommendations'}
    </button>
  );
};

export default UpdateRecommendationsButton;