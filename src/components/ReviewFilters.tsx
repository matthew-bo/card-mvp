'use client';

import React, { useState } from 'react';

// If you have lucide-react installed, uncomment these lines:
// import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

// Or use simple inline SVGs instead:
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

export interface ReviewFiltersProps {
  cardType: string;
  issuer: string;
  searchTerm: string;
  issuers: string[];
  annualFee: string;
  rewardsFilter: string;
  onFilterChange: (filters: { 
    type?: string; 
    issuer?: string; 
    search?: string; 
    annualFee?: string; 
    rewards?: string;
  }) => void;
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  cardType,
  issuer,
  searchTerm,
  issuers,
  annualFee,
  rewardsFilter,
  onFilterChange
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [showFilters, setShowFilters] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: localSearch });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 mb-2 md:mb-0">Filter Cards</h2>
        <button 
          onClick={toggleFilters}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <FilterIcon />
          <span className="ml-1">
            {showFilters ? (
              <>Hide Filters <ChevronUpIcon /></>
            ) : (
              <>Show Filters <ChevronDownIcon /></>
            )}
          </span>
        </button>
      </div>

      {/* Search Bar - Always visible */}
      <form onSubmit={handleSearch} className="flex mb-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search cards by name, features..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Search
        </button>
      </form>
      
      {/* Filter Controls - Collapsible */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
          
          {/* Annual Fee Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Fee
            </label>
            <select
              value={annualFee}
              onChange={(e) => onFilterChange({ annualFee: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Any Fee</option>
              <option value="no-fee">No Annual Fee</option>
              <option value="low-fee">Low Fee ($1-$100)</option>
              <option value="high-fee">Premium ($100+)</option>
            </select>
          </div>
          
          {/* Rewards Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rewards Type
            </label>
            <select
              value={rewardsFilter}
              onChange={(e) => onFilterChange({ rewards: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Rewards</option>
              <option value="cashback">Cash Back</option>
              <option value="points">Points & Miles</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Active Filters */}
      {(cardType !== 'all' || issuer || searchTerm || annualFee !== 'all' || rewardsFilter !== 'all') && (
        <div className="flex flex-wrap gap-2">
          {cardType !== 'all' && (
            <FilterBadge 
              label={cardType === 'personal' ? 'Personal Cards' : 'Business Cards'} 
              onRemove={() => onFilterChange({ type: 'all' })} 
            />
          )}
          
          {issuer && (
            <FilterBadge 
              label={issuer} 
              onRemove={() => onFilterChange({ issuer: '' })} 
            />
          )}
          
          {searchTerm && (
            <FilterBadge 
              label={`Search: ${searchTerm}`} 
              onRemove={() => {
                setLocalSearch('');
                onFilterChange({ search: '' });
              }} 
            />
          )}
          
          {annualFee !== 'all' && (
            <FilterBadge 
              label={
                annualFee === 'no-fee' ? 'No Annual Fee' : 
                annualFee === 'low-fee' ? 'Low Annual Fee' : 
                'Premium Annual Fee'
              } 
              onRemove={() => onFilterChange({ annualFee: 'all' })} 
            />
          )}
          
          {rewardsFilter !== 'all' && (
            <FilterBadge 
              label={rewardsFilter === 'cashback' ? 'Cash Back' : 'Points & Miles'} 
              onRemove={() => onFilterChange({ rewards: 'all' })} 
            />
          )}
          
          <button
            onClick={() => {
              setLocalSearch('');
              onFilterChange({ 
                type: 'all', 
                issuer: '', 
                search: '', 
                annualFee: 'all', 
                rewards: 'all' 
              });
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

// Helper component for filter badges
const FilterBadge: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => {
  return (
    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
      {label}
      <button
        onClick={onRemove}
        className="ml-2 text-blue-500 hover:text-blue-700"
      >
        <XIcon />
      </button>
    </div>
  );
};

export default ReviewFilters;