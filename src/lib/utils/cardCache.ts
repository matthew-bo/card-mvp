import { CreditCardDetails } from '@/types/cards';

type CardCache = {
  [cardKey: string]: {
    card: CreditCardDetails;
    timestamp: number;
  };
};

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Client-side cache for card details to reduce API calls
 */
class CardCacheManager {
  private cache: CardCache = {};
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.initialized = true;
    }
  }

  /**
   * Get card details from cache if available and not expired
   */
  getCard(cardKey: string): CreditCardDetails | null {
    if (!this.initialized && typeof window !== 'undefined') {
      this.loadFromStorage();
      this.initialized = true;
    }

    const cacheEntry = this.cache[cardKey];
    
    // Return null if not cached or expired
    if (!cacheEntry || Date.now() - cacheEntry.timestamp > CACHE_EXPIRATION) {
      return null;
    }
    
    return cacheEntry.card;
  }

  /**
   * Add or update a card in the cache
   */
  setCard(cardKey: string, card: CreditCardDetails): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.loadFromStorage();
      this.initialized = true;
    }

    this.cache[cardKey] = {
      card,
      timestamp: Date.now()
    };
    
    this.saveToStorage();
  }

  /**
   * Get all cards from cache
   */
  getAllCards(): CreditCardDetails[] | null {
    if (!this.initialized && typeof window !== 'undefined') {
      this.loadFromStorage();
      this.initialized = true;
    }

    const entries = Object.entries(this.cache);
    if (entries.length === 0) return null;

    return entries
      .filter(([, entry]) => Date.now() - entry.timestamp <= CACHE_EXPIRATION)
      .map(([, entry]) => entry.card);
  }

  /**
   * Set all cards in cache
   */
  setAllCards(cards: CreditCardDetails[]): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.loadFromStorage();
      this.initialized = true;
    }

    // Clear existing cache
    this.cache = {};

    // Add all cards to cache
    cards.forEach(card => {
      this.cache[card.id] = {
        card,
        timestamp: Date.now()
      };
    });

    this.saveToStorage();
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      this.cache = {};
      return;
    }
    
    try {
      const stored = localStorage.getItem('card_cache');
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading card cache from storage:', error);
      this.cache = {};
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('card_cache', JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving card cache to storage:', error);
      // If storage fails (e.g. quota exceeded), clear old entries
      this.pruneCache();
      try {
        localStorage.setItem('card_cache', JSON.stringify(this.cache));
      } catch (secondError) {
        console.error('Failed to save cache even after pruning:', secondError);
      }
    }
  }

  /**
   * Remove old or less important entries to reduce cache size
   */
  private pruneCache(): void {
    const entries = Object.entries(this.cache);
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove the oldest 50% of entries
    const entriesToKeep = entries.slice(Math.floor(entries.length / 2));
    
    // Rebuild cache with only the newer entries
    this.cache = entriesToKeep.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as CardCache);
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): {
    size: number;
    newestTimestamp: number;
    oldestTimestamp: number;
    averageAge: number;
  } {
    const entries = Object.entries(this.cache);
    if (entries.length === 0) {
      return {
        size: 0,
        newestTimestamp: 0,
        oldestTimestamp: 0,
        averageAge: 0
      };
    }
    
    let newestTimestamp = 0;
    let oldestTimestamp = Date.now();
    let totalAge = 0;
    
    entries.forEach(([, entry]) => {
      if (entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      totalAge += Date.now() - entry.timestamp;
    });
    
    return {
      size: entries.length,
      newestTimestamp,
      oldestTimestamp,
      averageAge: totalAge / entries.length
    };
  }
}

// Export singleton instance
export const cardCache = new CardCacheManager(); 