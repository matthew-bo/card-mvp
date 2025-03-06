'use client';

import React from 'react';

interface CardTypeToggleProps {
  value: 'personal' | 'business' | 'both';
  onChange: (value: 'personal' | 'business' | 'both') => void;
  className?: string;
}

const CardTypeToggle: React.FC<CardTypeToggleProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`}>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
          value === 'personal' 
            ? 'bg-blue-50 text-blue-700 border-blue-300' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => onChange('personal')}
      >
        Personal
      </button>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium border-t border-b ${
          value === 'both' 
            ? 'bg-blue-50 text-blue-700 border-blue-300' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => onChange('both')}
      >
        Both
      </button>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
          value === 'business' 
            ? 'bg-blue-50 text-blue-700 border-blue-300' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => onChange('business')}
      >
        Business
      </button>
    </div>
  );
};

export default CardTypeToggle;