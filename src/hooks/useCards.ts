import { useState, useEffect, useCallback } from 'react';
import { CreditCardDetails } from '@/types/cards';
import { SimpleMonitor } from '@/utils/monitoring/simpleMonitor';

export function useCards() {
  const [cards, setCards] = useState<CreditCardDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<Date | null>(null);

  const fetchCards = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Always fetch from our API route, which handles caching internally
      const url = forceRefresh 
        ? '/api/cards?refresh=true' 
        : '/api/cards';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch card data');
      }
      
      // Set state with the card data
      setCards(data.data);
      setIsCached(data.cached || false);
      
      if (data.cacheTimestamp) {
        setCacheTimestamp(new Date(data.cacheTimestamp));
      }
      
      // Log event
      SimpleMonitor.logEvent(
        'cards_loaded',
        `Loaded ${data.data.length} cards, cached: ${data.cached || false}`,
        { 
          count: data.data.length, 
          cached: data.cached || false,
          fallback: data.fallback || false
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching cards';
      setError(errorMessage);
      SimpleMonitor.trackError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return { 
    cards, 
    loading, 
    error, 
    refreshCards: fetchCards,
    isCached,
    cacheTimestamp
  };
}