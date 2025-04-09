import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse, CreditCardDetails } from '@/types/cards';
import cardDataService from '@/services/cardDataService';

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
  const prevCardKeysRef = useRef<string[]>([]);

  const fetchCards = useCallback(async (forceRefresh = false) => {
    if (!cardKeys || cardKeys.length === 0) {
      setCards([]);
      setLoading(false);
      return;
    }

    // Check if cardKeys have actually changed
    const cardKeysString = JSON.stringify(cardKeys.sort());
    const prevCardKeysString = JSON.stringify(prevCardKeysRef.current.sort());
    if (!forceRefresh && cardKeysString === prevCardKeysString) {
      return;
    }
    prevCardKeysRef.current = cardKeys;
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await Promise.all(
        cardKeys.map(id => cardDataService.fetchCardById(id))
      );
      
      const validCards = results
        .filter((card): card is CreditCardDetails => card !== null)
        .map(card => card as CreditCardDetails);
      
      setCards(prevCards => {
        const newCardsString = JSON.stringify(validCards);
        const prevCardsString = JSON.stringify(prevCards);
        if (newCardsString === prevCardsString) {
          return prevCards;
        }
        return validCards;
      });
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Failed to load card details');
    } finally {
      setLoading(false);
    }
  }, [cardKeys]);

  useEffect(() => {
    if (cardKeys && cardKeys.length > 0) {
      fetchCards();
    } else {
      setCards([]);
      setLoading(false);
    }
  }, [cardKeys, fetchCards]);

  return { cards, loading, error, refresh: fetchCards };
}