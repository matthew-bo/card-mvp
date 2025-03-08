'use client';

import React, { useState } from 'react';

interface ReviewFiltersProps {
  cardType: string;
  issuer: string;
  searchTerm: string;
  issuers: string[];
  onFilterChange: (filters: { type?: string; issuer?: string; search?: string }) => void;
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  cardType,
  issuer,
  searchTerm,
  issuers,
  onFilterChange
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: localSearch });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Filter Cards</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Type
          </label>
          <select
            value={cardType}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Cards</option>
            <option value="personal">Personal Cards</option>
            <option value="business">Business Cards</option>
          </select>
        </div>
        
        {/* Issuer Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Issuer
          </label>
          <select
            value={issuer}
            onChange={(e) => onFilterChange({ issuer: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Issuers</option>
            {issuers.map(issuerName => (
              <option key={issuerName} value={issuerName}>
                {issuerName}
              </option>
            ))}
          </select>
        </div>
        
        {/* Search Filter */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Cards
          </label>
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by name, features..."
              className="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Search
            </button>
          </form>
        </div>
      </div>
      
      {/* Active Filters */}
      {(cardType !== 'all' || issuer || searchTerm) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {cardType !== 'all' && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              {cardType === 'personal' ? 'Personal Cards' : 'Business Cards'}
              <button
                onClick={() => onFilterChange({ type: 'all' })}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </div>
          )}
          
          {issuer && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              {issuer}
              <button
                onClick={() => onFilterChange({ issuer: '' })}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </div>
          )}
          
          {searchTerm && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              Search: {searchTerm}
              <button
                onClick={() => {
                  setLocalSearch('');
                  onFilterChange({ search: '' });
                }}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </div>
          )}
          
          <button
            onClick={() => {
              setLocalSearch('');
              onFilterChange({ type: 'all', issuer: '', search: '' });
            }}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewFilters;