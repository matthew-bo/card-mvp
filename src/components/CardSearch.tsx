'use client';

import React, { useState, useEffect, useRef } from 'react';
import cardSearchIndex from '@/services/cardSearchIndex';
import { SearchResultCard } from '@/types/cards';

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
  const [loadingCards, setLoadingCards] = useState<Set<string>>(new Set());
  const [debug, setDebug] = useState(false);
  
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Initialize search index on component mount
    cardSearchIndex.initialize().catch(console.error);
  }, []);
  
  useEffect(() => {
    if (searchTerm.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    // Debounce search to avoid excessive processing
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First try local search index
        const localResults = cardSearchIndex.search(searchTerm);
        
        if (localResults.length > 0) {
          // Filter out excluded cards
          const filteredResults = localResults.filter(
            card => !excludeCardKeys.includes(card.cardKey)
          );
          
          setResults(filteredResults);
          setIsOpen(filteredResults.length > 0);
          setLoading(false);
          return;
        }
        
        // Fall back to API search if no local results
        const response = await fetch(`/api/cards/search?q=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // Filter out excluded cards
          const filteredResults = data.data.filter(
            (card: SearchResult) => !excludeCardKeys.includes(card.cardKey)
          );
          
          // Remove duplicates
          const uniqueResults = Array.from(
            new Map(filteredResults.map((card: SearchResult) => [card.cardKey, card])).values()
          ) as SearchResult[];
          
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
  
  const handleSelectCard = async (card: SearchResult) => {
    try {
      setLoadingCards(prev => new Set(prev).add(card.cardKey));
      onCardSelect(card.cardKey, card.cardName, card.cardIssuer);
      setSearchTerm('');
      setResults([]);
      setIsOpen(false);
    } finally {
      setLoadingCards(prev => {
        const next = new Set(prev);
        next.delete(card.cardKey);
        return next;
      });
    }
  };
  
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Search for credit cards"
      />
      
      {loading && (
        <div className="absolute right-3 top-2.5">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {results.map((card) => (
            <button
              key={card.cardKey}
              onClick={() => handleSelectCard(card)}
              disabled={loadingCards.has(card.cardKey)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{card.cardName}</div>
                  <div className="text-sm text-gray-600">{card.cardIssuer}</div>
                </div>
                {loadingCards.has(card.cardKey) && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
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