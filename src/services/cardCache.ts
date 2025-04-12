import { CreditCardDetails } from '@/types/cards';

class CardCache {
  private static instance: CardCache;
  private cache: Map<string, CreditCardDetails> = new Map();
  private STORAGE_KEY = 'card_cache';
  private MAX_CACHE_SIZE = 50; // Limit number of cards in cache
  
  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): CardCache {
    if (!CardCache.instance) {
      CardCache.instance = new CardCache();
    }
    return CardCache.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, value]) => {
          this.cache.set(key, value as CreditCardDetails);
        });
      }
    } catch (error) {
      console.warn('Failed to load card cache:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // Convert to simple object for storage
      const toStore = Array.from(this.cache.entries()).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, CreditCardDetails>);

      // Limit cache size by removing oldest entries if needed
      const entries = Object.entries(toStore);
      if (entries.length > this.MAX_CACHE_SIZE) {
        const newEntries = entries.slice(-this.MAX_CACHE_SIZE);
        const limitedStore = Object.fromEntries(newEntries);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedStore));
      } else {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
      }
    } catch (error) {
      console.warn('Failed to save card cache:', error);
    }
  }

  public setCard(cardKey: string, card: CreditCardDetails): void {
    this.cache.set(cardKey, card);
    this.saveToStorage();
  }

  public getCard(cardKey: string): CreditCardDetails | null {
    return this.cache.get(cardKey) || null;
  }

  public setAllCards(cards: CreditCardDetails[]): void {
    // Clear existing cache
    this.cache.clear();
    
    // Add new cards up to the limit
    cards.slice(0, this.MAX_CACHE_SIZE).forEach(card => {
      if (card.id) {
        this.cache.set(card.id, card);
      }
    });
    
    this.saveToStorage();
  }

  public getAllCards(): CreditCardDetails[] {
    return Array.from(this.cache.values());
  }

  public clear(): void {
    this.cache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export default CardCache.getInstance(); 