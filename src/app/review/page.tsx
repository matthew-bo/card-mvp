// src/app/review/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { CreditCardDetails } from '@/types/cards';
import ReviewCardDisplay from '@/components/ReviewCardDisplay';
import ReviewFilters from '@/components/ReviewFilters';
import Pagination from '@/components/Pagination';

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<CreditCardDetails[]>([]);
  const [filteredCards, setFilteredCards] = useState<CreditCardDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get current page from URL query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const cardsPerPage = 15;
  
  // Get filter values from URL query params
  const cardType = searchParams.get('type') || 'all';
  const issuer = searchParams.get('issuer') || '';
  const searchTerm = searchParams.get('search') || '';
  
  // Fetch cards from API
  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/cards/all');
        if (!response.ok) {
          throw new Error('Failed to fetch cards');
        }
        const data = await response.json();
        setCards(data.data || []);
      } catch (err) {
        console.error('Error fetching cards:', err);
        setError('Failed to load card data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCards();
  }, []);
  
  // Apply filters whenever filter values or cards change
  useEffect(() => {
    if (!cards.length) return;
    
    let result = [...cards];
    
    // Filter by card type (business/personal/all)
    if (cardType !== 'all') {
      const isBusinessCard = cardType === 'business';
      result = result.filter(card => {
        const cardNameLower = card.name.toLowerCase();
        const cardDescLower = card.description?.toLowerCase() || '';
        const businessKeywords = ['business', 'biz', 'entrepreneur', 'commercial', 'corporate'];
        
        const hasBusinessKeyword = businessKeywords.some(keyword => 
          cardNameLower.includes(keyword) || cardDescLower.includes(keyword)
        );
        
        return isBusinessCard ? hasBusinessKeyword : !hasBusinessKeyword;
      });
    }
    
    // Filter by issuer
    if (issuer) {
      result = result.filter(card => card.issuer.toLowerCase() === issuer.toLowerCase());
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(card => 
        card.name.toLowerCase().includes(term) || 
        card.description?.toLowerCase().includes(term) ||
        card.issuer.toLowerCase().includes(term)
      );
    }
    
    setFilteredCards(result);
  }, [cards, cardType, issuer, searchTerm]);
  
  // Get current page cards
  const indexOfLastCard = page * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredCards.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: {
    type?: string;
    issuer?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newFilters.type !== undefined) {
      if (newFilters.type) {
        params.set('type', newFilters.type);
      } else {
        params.delete('type');
      }
    }
    
    if (newFilters.issuer !== undefined) {
      if (newFilters.issuer) {
        params.set('issuer', newFilters.issuer);
      } else {
        params.delete('issuer');
      }
    }
    
    if (newFilters.search !== undefined) {
      if (newFilters.search) {
        params.set('search', newFilters.search);
      } else {
        params.delete('search');
      }
    }
    
    // Reset to page 1 when changing filters
    params.set('page', '1');
    
    router.push(`/review?${params.toString()}`);
  };
  
  // Get unique issuers for filter dropdown
  const uniqueIssuers = Array.from(new Set(cards.map(card => card.issuer))).sort();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Credit Card Reviews</h1>
        
        {/* Filters */}
        <ReviewFilters 
          cardType={cardType}
          issuer={issuer}
          searchTerm={searchTerm}
          issuers={uniqueIssuers}
          onFilterChange={handleFilterChange}
        />
        
        {/* Card listing */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mt-6">
            {error}
          </div>
        ) : currentCards.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mt-6">
            <h2 className="text-xl font-medium text-gray-900 mb-2">No cards found</h2>
            <p className="text-gray-600">
              Try adjusting your filters to see more cards.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {currentCards.map(card => (
              <ReviewCardDisplay 
                key={card.id} 
                card={card} 
              />
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {filteredCards.length > 0 && (
          <div className="mt-8">
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              baseUrl="/review" 
              preserveParams={true}
            />
          </div>
        )}
      </main>
    </div>
  );
}