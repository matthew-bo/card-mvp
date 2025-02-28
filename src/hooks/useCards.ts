import { useState, useEffect, useCallback } from 'react';
import { CreditCardDetails } from '@/types/cards';

// Types for the card cache
interface CardCache {
  timestamp: number;
  cards: {
    [cardKey: string]: CreditCardDetails;
  };
}

const CACHE_KEY = 'stoid_card_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useCards(cardKeys: string[] = []) {
  const [cards, setCards] = useState<CreditCardDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async (forceRefresh = false) => {
    if (cardKeys.length === 0) {
      setCards([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to get cards from cache first
      const cachedCards: CreditCardDetails[] = [];
      const cardsToFetch: string[] = [];
      
      if (!forceRefresh) {
        const cacheJson = localStorage.getItem(CACHE_KEY);
        
        if (cacheJson) {
          const cache: CardCache = JSON.parse(cacheJson);
          const now = Date.now();
          
          // Check if cache is still valid
          if (now - cache.timestamp < CACHE_DURATION) {
            // Get cards from cache if available
            for (const cardKey of cardKeys) {
              if (cache.cards[cardKey]) {
                cachedCards.push(cache.cards[cardKey]);
              } else {
                cardsToFetch.push(cardKey);
              }
            }
          } else {
            // Cache expired, fetch all cards
            cardsToFetch.push(...cardKeys);
          }
        } else {
          // No cache, fetch all cards
          cardsToFetch.push(...cardKeys);
        }
      } else {
        // Force refresh, fetch all cards
        cardsToFetch.push(...cardKeys);
      }
      
      // Fetch cards that weren't in cache
      const fetchedCards: CreditCardDetails[] = [];
      
      if (cardsToFetch.length > 0) {
        // Fetch cards in parallel with Promise.all
        const cardPromises = cardsToFetch.map(async (cardKey) => {
          const response = await fetch(`/api/cards/details?cardKey=${cardKey}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch card ${cardKey}: ${response.status}`);
          }
          
          const data = await response.json();
          return data.data as CreditCardDetails;
        });
        
        const results = await Promise.all(cardPromises);
        fetchedCards.push(...results);
        
        // Update the cache with new cards
        let cache: CardCache = { timestamp: Date.now(), cards: {} };
        
        const cacheJson = localStorage.getItem(CACHE_KEY);
        if (cacheJson) {
          cache = JSON.parse(cacheJson);
        }
        
        // Add fetched cards to cache
        for (const card of fetchedCards) {
          cache.cards[card.id] = card;
        }
        
        // Update cache timestamp
        cache.timestamp = Date.now();
        
        // Save updated cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      }
      
      // Combine cached and fetched cards
      setCards([...cachedCards, ...fetchedCards]);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Failed to load card details');
    } finally {
      setLoading(false);
    }
  }, [cardKeys]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return { cards, loading, error, refreshCards: fetchCards };
}