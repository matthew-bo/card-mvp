'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CardSearchProps {
  onCardSelect: (cardKey: string, cardName: string, cardIssuer: string) => void;
  placeholder?: string;
  excludeCardKeys?: string[];
}

interface SearchResult {
  cardKey: string;
  cardName: string;
  cardIssuer: string;
}

export default function CardSearch({ 
  onCardSelect, 
  placeholder = "Search for your credit card...", 
  excludeCardKeys = [] 
}: CardSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [debug, setDebug] = useState(false);
  
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (searchTerm.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    // Debounce search to avoid excessive API calls
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/cards/search?q=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // Filter out cards that are in the exclude list
          const filteredResults = data.data.filter(
            (card: SearchResult) => !excludeCardKeys.includes(card.cardKey)
          );
          
          // Remove any duplicates - with explicit type assertion
          const uniqueResults = Array.from(
            new Map(filteredResults.map((card: SearchResult) => [card.cardKey, card])).values()
          ) as SearchResult[]; // Add type assertion here
          
          setResults(uniqueResults);
          setIsOpen(uniqueResults.length > 0);
        } else {
          setResults([]);
          setIsOpen(false);
        }
      } catch (err) {
        console.error('Error searching cards:', err);
        setError('Failed to search for cards');
        setResults([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchTerm, excludeCardKeys]);
   
  const handleSelectCard = (card: SearchResult) => {
    onCardSelect(card.cardKey, card.cardName, card.cardIssuer);
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
  };
  
  return (
    <div className="relative" style={{zIndex: 50}}>
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            // Show results dropdown when input is focused if there are results
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            // Delay hiding the dropdown to allow for clicking on results
            setTimeout(() => setIsOpen(false), 200);
          }}
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div 
          className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto" 
          style={{display: isOpen ? 'block' : 'none'}}
        >
          {results.map((card) => (
            <div
              key={card.cardKey}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelectCard(card)}
            >
              <div className="font-medium">{card.cardName}</div>
              <div className="text-sm text-gray-500">{card.cardIssuer}</div>
            </div>
          ))}
        </div>
      )}
      
      {searchTerm.length >= 3 && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
          No cards found matching &quot;{searchTerm}&quot;
        </div>
      )}
      
      {searchTerm.length >= 3 && (
        <div className="mt-2 text-xs">
          <button 
            onClick={() => setDebug(!debug)} 
            className="text-gray-500 underline"
          >
            {debug ? 'Hide Debug' : 'Show Debug'}
          </button>
          
          {debug && (
            <div className="mt-1 bg-gray-50 p-2 rounded border text-gray-600">
              <p>Term: &quot;{searchTerm}&quot;</p>
              <p>Results: {results.length}</p>
              <p>Status: {loading ? 'Loading' : isOpen ? 'Open' : 'Closed'}</p>
              {error && <p className="text-red-500">Error: {error}</p>}
              {results.length > 0 && (
                <pre className="mt-1 text-xs overflow-auto max-h-24">
                  {JSON.stringify(results[0], null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}