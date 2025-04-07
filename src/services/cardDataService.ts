import { collection, getDocs } from 'firebase/firestore';
import { db, FIREBASE_COLLECTIONS } from '@/lib/firebase';
import { CreditCardDetails, ApiResponse, SearchResultCard } from '@/types/cards';

class CardDataService {
  private static instance: CardDataService;
  private cardsCache: CreditCardDetails[] | null = null;
  private searchResultsCache: Record<string, SearchResultCard[]> = {};
  private cardDetailsCache: Record<string, CreditCardDetails> = {};
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL = 1000 * 60 * 60; // Increase to 1 hour
  private fetchInProgress: Promise<ApiResponse<CreditCardDetails[]>> | null = null;

  private constructor() {
    // Try to load cached cards from localStorage in browser environments
    this.loadCacheFromStorage();
  }

  public static getInstance(): CardDataService {
    if (!CardDataService.instance) {
      CardDataService.instance = new CardDataService();
    }
    return CardDataService.instance;
  }

  // Load cache from localStorage if available
  private loadCacheFromStorage(): { cards: CreditCardDetails[] | null, timestamp: number | null } {
    try {
      const metaStr = localStorage.getItem('cardDataCache_meta');
      if (!metaStr) {
        return { cards: null, timestamp: null };
      }
      
      const meta = JSON.parse(metaStr);
      const { timestamp, totalChunks, totalCards } = meta;
      
      // Check if cache is stale (older than 24 hours)
      const now = Date.now();
      const cacheAge = now - timestamp;
      const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge > MAX_CACHE_AGE) {
        console.log('Cache is stale, will refresh from server');
        return { cards: null, timestamp };
      }
      
      // Load and combine all chunks
      let allCards: CreditCardDetails[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkStr = localStorage.getItem(`cardDataCache_chunk_${i}`);
        if (!chunkStr) {
          console.warn(`Missing chunk ${i}, cache may be corrupted`);
          return { cards: null, timestamp: null };
        }
        
        const chunk = JSON.parse(chunkStr) as CreditCardDetails[];
        allCards = [...allCards, ...chunk];
      }
      
      // Verify we have all the cards
      if (allCards.length !== totalCards) {
        console.warn(`Cache integrity check failed: expected ${totalCards} cards but got ${allCards.length}`);
        return { cards: null, timestamp: null };
      }
      
      console.log(`Loaded card data cache (${allCards.length} cards) from ${totalChunks} chunks`);
      return { cards: allCards, timestamp };
    } catch (error) {
      console.error('Error loading cache from localStorage:', error);
      return { cards: null, timestamp: null };
    }
  }

  // Save cache to localStorage
  private saveCacheToStorage(cards: CreditCardDetails[]): void {
    try {
      // Chunk size to avoid localStorage quota issues (approximately 5MB per domain)
      const CHUNK_SIZE = 50; // Store 50 cards per chunk
      const totalChunks = Math.ceil(cards.length / CHUNK_SIZE);
      
      // Clear any existing chunks first
      for (let i = 0; i < 100; i++) { // Assume maximum 100 chunks as safety
        localStorage.removeItem(`cardDataCache_chunk_${i}`);
      }
      
      // Save metadata
      localStorage.setItem('cardDataCache_meta', JSON.stringify({
        timestamp: Date.now(),
        totalChunks,
        totalCards: cards.length
      }));
      
      // Save each chunk
      for (let i = 0; i < totalChunks; i++) {
        const startIdx = i * CHUNK_SIZE;
        const endIdx = Math.min(startIdx + CHUNK_SIZE, cards.length);
        const chunk = cards.slice(startIdx, endIdx);
        
        localStorage.setItem(`cardDataCache_chunk_${i}`, JSON.stringify(chunk));
      }
      
      console.log(`Saved card data cache in ${totalChunks} chunks`);
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  }

  // Check if cache is valid
  private isCacheValid(): boolean {
    return (
      this.cardsCache !== null &&
      this.lastFetchTime > 0 &&
      Date.now() - this.lastFetchTime < this.CACHE_TTL
    );
  }

  public async getAllCards(): Promise<ApiResponse<CreditCardDetails[]>> {
    try {
      // If we have cached data, return it immediately
      if (this.cardsCache) {
        console.log(`🔍 CardDataService: Using cached data (${this.cardsCache.length} cards)`);
        return { success: true, data: this.cardsCache };
      }
      
      // Check if fetch is already in progress, avoid duplicate requests
      if (this.fetchInProgress) {
        console.log('🔍 CardDataService: Fetch already in progress, reusing promise');
        return this.fetchInProgress;
      }
      
      console.log('🔍 CardDataService: Starting getAllCards');
      
      // Try to load from storage first
      const { cards: cachedCards, timestamp } = this.loadCacheFromStorage();
      if (cachedCards) {
        this.cardsCache = cachedCards;
        
        // Index cards by ID for faster lookups
        this.cardDetailsCache = {};
        cachedCards.forEach(card => {
          if (card.id) {
            this.cardDetailsCache[card.id] = card;
          }
        });
        
        console.log(`🔍 CardDataService: Loaded ${cachedCards.length} cards from cache (from ${new Date(timestamp || 0).toLocaleString()})`);
        
        // Still refresh in background if cache is older than 12 hours
        const cacheAge = Date.now() - (timestamp || 0);
        if (cacheAge > 12 * 60 * 60 * 1000) {
          console.log('Cache is older than 12 hours, refreshing in background');
          this.refreshCardsInBackground();
        }
        
        return { success: true, data: cachedCards };
      }
      
      // Otherwise fetch from Firestore
      // Check if Firestore is initialized
      if (!db) {
        console.error('❌ CardDataService: Firestore is not initialized');
        return { success: false, error: 'Firestore is not initialized' };
      }

      console.log('🔍 CardDataService: Firestore is initialized, fetching cards...');
      
      // Create a fetch promise and store it to prevent duplicate fetches
      this.fetchInProgress = new Promise(async (resolve) => {
        try {
          // Fetch from Firestore
          const cardsRef = collection(db, FIREBASE_COLLECTIONS.CREDIT_CARDS);
          const snapshot = await getDocs(cardsRef);
          
          console.log(`🔍 CardDataService: Got snapshot with ${snapshot.size} documents`);
          
          if (snapshot.empty) {
            console.warn('⚠️ CardDataService: No cards found in Firestore');
            resolve({ success: true, data: [] });
            return;
          }

          const cards = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as CreditCardDetails[];

          console.log(`🔍 CardDataService: Mapped ${cards.length} cards`);

          if (cards.length === 0) {
            console.warn('⚠️ CardDataService: No valid cards found after mapping');
            resolve({ success: true, data: [] });
            return;
          }

          // Update cache and indexes
          this.cardsCache = cards;
          this.lastFetchTime = Date.now();
          this.cardDetailsCache = {};
          
          // Index cards by ID for faster lookup
          cards.forEach(card => {
            this.cardDetailsCache[card.id] = card;
          });
          
          // Save to localStorage
          this.saveCacheToStorage(cards);
          
          // Clear search cache when we get new cards
          this.searchResultsCache = {};

          console.log('✅ CardDataService: Successfully fetched cards');
          resolve({ success: true, data: cards });
        } catch (error) {
          console.error('❌ CardDataService: Error fetching all cards:', error);
          resolve({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch cards'
          });
        } finally {
          // Clear the in-progress promise
          this.fetchInProgress = null;
        }
      });
      
      return this.fetchInProgress;
    } catch (error) {
      console.error('❌ CardDataService: Error in getAllCards:', error);
      // Reset the in-progress promise in case of error
      this.fetchInProgress = null;
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch cards'
      };
    }
  }

  public async searchCards(query: string): Promise<ApiResponse<SearchResultCard[]>> {
    console.log('Searching cards with query:', query);
    
    try {
      // Check cache for this exact query
      const cacheKey = query.toLowerCase().trim();
      if (this.searchResultsCache[cacheKey]) {
        console.log(`Using cached search results for "${query}"`);
        return { success: true, data: this.searchResultsCache[cacheKey] };
      }
      
      // Make sure we have cards, either from cache or fresh fetch
      if (!this.isCacheValid() || !this.cardsCache) {
        console.log('No valid cache, fetching cards first');
        const allCardsResponse = await this.getAllCards();
        
        if (!allCardsResponse.success || !allCardsResponse.data) {
          return { success: false, error: 'Failed to fetch cards for search' };
        }
      }
      
      // At this point we should have cards in the cache
      if (!this.cardsCache) {
        return { success: false, error: 'No cards available for search' };
      }
      
      const allCards = this.cardsCache;
      const lowerCaseQuery = query.toLowerCase();
      
      // Use more efficient filtering method
      const filteredCards = [];
      const searchStart = performance.now();
      
      for (let i = 0; i < allCards.length; i++) {
        const card = allCards[i];
        const cardName = card.name?.toLowerCase() || '';
        const cardIssuer = card.issuer?.toLowerCase() || '';
        
        if (cardName.includes(lowerCaseQuery) || cardIssuer.includes(lowerCaseQuery)) {
          filteredCards.push({
            cardKey: card.id || '',
            cardName: card.name || 'Unknown Card',
            cardIssuer: card.issuer || 'Unknown Issuer'
          });
        }
      }
      
      const searchEnd = performance.now();
      console.log(`Search completed in ${Math.round(searchEnd - searchStart)}ms, found ${filteredCards.length} results`);
      
      // Cache the search results
      this.searchResultsCache[cacheKey] = filteredCards;
      
      return { success: true, data: filteredCards };
    } catch (error) {
      console.error('Error searching cards:', error);
      return { success: false, error: 'Failed to search cards' };
    }
  }

  public async fetchCardById(cardId: string): Promise<CreditCardDetails | null> {
    console.log('Fetching card by ID:', cardId);
    
    try {
      // First check the card details cache (fastest lookup)
      if (this.cardDetailsCache[cardId]) {
        console.log(`Using indexed card cache for ID: ${cardId}`);
        return this.cardDetailsCache[cardId];
      }
      
      // If not in details cache but we have cards cache, check there
      if (this.cardsCache) {
        const cachedCard = this.cardsCache.find(card => card.id === cardId);
        if (cachedCard) {
          // Add to details cache for future lookups
          this.cardDetailsCache[cardId] = cachedCard;
          console.log(`Using cards cache for ID: ${cardId}`);
          return cachedCard;
        }
      }
      
      // Not in any cache, need to fetch from API
      const allCardsResponse = await this.getAllCards();
      
      if (!allCardsResponse.success || !allCardsResponse.data) {
        console.error('Failed to get cards for fetchCardById');
        return null;
      }
      
      const allCards = allCardsResponse.data;
      const card = allCards.find(card => card.id === cardId);
      
      if (!card) {
        // If card not found, try to handle fallback - implement a fallback mechanism
        console.warn(`Card with ID ${cardId} not found`);
        
        // Create a fallback card with minimal information
        // This prevents UI errors when a card can't be found
        if (cardId) {
          const fallbackCard: CreditCardDetails = {
            id: cardId,
            name: `Card ${cardId}`,
            issuer: 'Unknown',
            rewardRates: {
              dining: 1,
              travel: 1,
              grocery: 1,
              gas: 1,
              entertainment: 1,
              rent: 1,
              drugstore: 1,
              streaming: 1,
              other: 1
            },
            annualFee: 0,
            creditScoreRequired: 'fair',
            perks: [],
            foreignTransactionFee: false,
            categories: [],
            description: 'Card details unavailable',
            cardType: 'personal'
          };
          
          // Add to cache to prevent future lookups
          this.cardDetailsCache[cardId] = fallbackCard;
          return fallbackCard;
        }
        
        return null;
      }
      
      // Add to details cache for future lookups
      this.cardDetailsCache[cardId] = card;
      
      return card;
    } catch (error) {
      console.error('Error fetching card by ID:', error);
      return null;
    }
  }
  
  public clearCache(): void {
    this.cardsCache = null;
    this.searchResultsCache = {};
    this.cardDetailsCache = {};
    this.lastFetchTime = 0;
    
    // Clear localStorage cache too
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('cardDataCache_meta');
        for (let i = 0; i < 100; i++) {
          localStorage.removeItem(`cardDataCache_chunk_${i}`);
        }
      } catch (error) {
        console.error('Error clearing localStorage cache:', error);
      }
    }
    
    console.log('CardDataService: Cache cleared');
  }

  // Method to refresh cards in background without blocking the UI
  private async refreshCardsInBackground(): Promise<void> {
    try {
      console.log('🔄 CardDataService: Refreshing cards in background...');
      
      // Don't update cache valid flag so we keep using existing cache
      const currentCache = this.cardsCache;
      
      // Fetch from Firestore
      if (!db) {
        console.error('❌ CardDataService: Firestore is not initialized');
        return;
      }
      
      const cardsRef = collection(db, FIREBASE_COLLECTIONS.CREDIT_CARDS);
      const snapshot = await getDocs(cardsRef);
      
      if (snapshot.empty) {
        console.warn('⚠️ CardDataService: No cards found in Firestore during background refresh');
        return;
      }
      
      // Map the documents to card objects
      const cards: CreditCardDetails[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        cards.push({
          id: doc.id,
          ...data
        } as CreditCardDetails);
      });
      
      if (cards.length === 0) {
        console.warn('⚠️ CardDataService: No valid cards found after mapping during background refresh');
        return;
      }
      
      // Update the cache
      this.cardsCache = cards;
      this.lastFetchTime = Date.now();
      
      // Index cards by ID for faster lookups
      this.cardDetailsCache = {};
      cards.forEach(card => {
        if (card.id) {
          this.cardDetailsCache[card.id] = card;
        }
      });
      
      // Save to localStorage
      this.saveCacheToStorage(cards);
      
      console.log(`✅ CardDataService: Successfully refreshed ${cards.length} cards in background`);
    } catch (error) {
      console.error('❌ CardDataService: Error in background refresh:', error);
    }
  }
}

// Create and export the singleton instance
const cardDataService = CardDataService.getInstance();
export default cardDataService; 