import { collection, getDocs } from 'firebase/firestore';
import { db, FIREBASE_COLLECTIONS } from '@/lib/firebase';
import { CreditCardDetails, ApiResponse, SearchResultCard, RewardRates, CreditScoreType } from '@/types/cards';

// Add simple isBrowser helper inline to avoid dependency issues
const isBrowser = () => typeof window !== 'undefined';

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
      // Check if browser environment before accessing localStorage
      if (!isBrowser()) {
        return { cards: null, timestamp: null };
      }
      
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

  // Save cache to localStorage with compression to reduce size
  private saveCacheToStorage(cards: CreditCardDetails[]): void {
    try {
      if (!isBrowser()) {
        return;
      }
      
      // Reduce card data to only essential fields before storing
      const essentialCardData = cards.map(card => ({
        id: card.id,
        name: card.name,
        issuer: card.issuer,
        annualFee: card.annualFee,
        rewardRates: card.rewardRates,
        creditScoreRequired: card.creditScoreRequired,
        foreignTransactionFee: card.foreignTransactionFee,
        cardType: card.cardType,
        // Only include perks if they're short
        perks: card.perks?.length > 3 ? card.perks.slice(0, 3) : card.perks,
        // Only include a short description
        description: card.description?.substring(0, 100),
        // Only include basic categories
        categories: card.categories?.slice(0, 5),
        // Include signup bonus if present
        signupBonus: card.signupBonus
      }));
      
      try {
        // First try to clear all previous cache
        this.clearCache();
      } catch (e) {
        console.warn('Error clearing previous cache:', e);
      }
      
      // Use smaller chunk size to avoid quota issues
      const CHUNK_SIZE = 25; // Reduce from 50 to 25 cards per chunk
      const totalChunks = Math.ceil(essentialCardData.length / CHUNK_SIZE);
      
      // Save metadata
      try {
        localStorage.setItem('cardDataCache_meta', JSON.stringify({
          timestamp: Date.now(),
          totalChunks,
          totalCards: essentialCardData.length
        }));
      } catch (e) {
        console.warn('Failed to save cache metadata:', e);
        return; // If we can't save metadata, don't try to save chunks
      }
      
      // Save each chunk with error handling for each chunk
      for (let i = 0; i < totalChunks; i++) {
        try {
          const startIdx = i * CHUNK_SIZE;
          const endIdx = Math.min(startIdx + CHUNK_SIZE, essentialCardData.length);
          const chunk = essentialCardData.slice(startIdx, endIdx);
          
          // Stringify and save this chunk
          const chunkStr = JSON.stringify(chunk);
          localStorage.setItem(`cardDataCache_chunk_${i}`, chunkStr);
        } catch (e) {
          console.warn(`Failed to save chunk ${i}:`, e);
          // Continue with other chunks even if one fails
        }
      }
      
      console.log(`Attempted to save card data cache in ${totalChunks} chunks`);
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

  private validateAndNormalizeCard(card: any): CreditCardDetails | null {
    try {
      if (!card || !card.id || !card.name || !card.issuer) {
        console.warn(`Invalid card data: Missing basic properties`, card);
        return null;
      }

      // Ensure all required properties have valid values
      const normalizedCard: CreditCardDetails = {
        id: card.id,
        name: card.name,
        issuer: card.issuer,
        rewardRates: card.rewardRates || {
          dining: 1,
          travel: 1,
          grocery: 1,
          gas: 1,
          entertainment: 1,
          rent: 1,
          other: 1,
          base: 1
        },
        annualFee: typeof card.annualFee === 'number' ? card.annualFee : 0,
        creditScoreRequired: card.creditScoreRequired || 'good',
        perks: Array.isArray(card.perks) ? card.perks : [],
        foreignTransactionFee: typeof card.foreignTransactionFee === 'boolean' ? card.foreignTransactionFee : true,
        categories: Array.isArray(card.categories) ? card.categories : [],
        description: card.description || `${card.name} from ${card.issuer}`,
        cardType: card.cardType || 'personal'
      };

      return normalizedCard;
    } catch (error) {
      console.error(`Error validating card:`, error);
      return null;
    }
  }

  private mapFirebaseCardToCardDetails(firebaseCard: any): CreditCardDetails | null {
    try {
      if (!firebaseCard || !firebaseCard.cardKey || !firebaseCard.cardName || !firebaseCard.cardIssuer) {
        console.warn(`Invalid card data: Missing basic properties`, firebaseCard);
        return null;
      }

      // Map spend bonus categories to reward rates
      const rewardRates: RewardRates = {
        dining: 1,
        travel: 1,
        grocery: 1,
        gas: 1,
        entertainment: 1,
        rent: 1,
        other: firebaseCard.baseSpendEarnValuation || 1,
        base: firebaseCard.baseSpendEarnValuation || 1
      };

      // Process spend bonus categories
      if (Array.isArray(firebaseCard.spendBonusCategory)) {
        firebaseCard.spendBonusCategory.forEach((bonus: any) => {
          const category = bonus.spendBonusCategoryGroup?.toLowerCase();
          if (category && bonus.earnMultiplier) {
            switch (category) {
              case 'dining':
                rewardRates.dining = bonus.earnMultiplier;
                break;
              case 'travel':
              case 'airlines':
              case 'hotels':
                rewardRates.travel = Math.max(rewardRates.travel, bonus.earnMultiplier);
                break;
              case 'grocery':
              case 'supermarket':
                rewardRates.grocery = bonus.earnMultiplier;
                break;
              case 'auto':
              case 'gas stations':
                rewardRates.gas = bonus.earnMultiplier;
                break;
              case 'entertainment':
                rewardRates.entertainment = bonus.earnMultiplier;
                break;
            }
          }
        });
      }

      // Extract perks from benefits array
      const perks: string[] = [];
      if (Array.isArray(firebaseCard.benefit)) {
        firebaseCard.benefit.forEach((benefit: any) => {
          if (benefit.benefitDesc) {
            perks.push(benefit.benefitDesc);
          }
        });
      }

      // Add special perks based on flags
      if (firebaseCard.isFreeCheckedBag) perks.push('Free Checked Bag');
      if (firebaseCard.isFreeHotelNight) perks.push('Free Hotel Night');
      if (firebaseCard.isLoungeAccess) perks.push('Airport Lounge Access');
      if (firebaseCard.isTrustedTraveler) perks.push('Trusted Traveler Credit');

      // Extract categories
      const categories = new Set<string>();
      if (firebaseCard.categoryType) {
        categories.add(firebaseCard.categoryType.toLowerCase());
      }
      if (Array.isArray(firebaseCard.spendBonusCategory)) {
        firebaseCard.spendBonusCategory.forEach((bonus: any) => {
          if (bonus.spendBonusCategoryGroup) {
            categories.add(bonus.spendBonusCategoryGroup.toLowerCase());
          }
        });
      }

      // Map credit score
      const creditScoreMap: Record<string, CreditScoreType> = {
        'Excellent': 'excellent',
        'Good to Excellent': 'excellent',
        'Good': 'good',
        'Fair to Good': 'good',
        'Fair': 'fair',
        'Poor': 'poor'
      };

      const cardDetails: CreditCardDetails = {
        id: firebaseCard.cardKey,
        name: firebaseCard.cardName,
        issuer: firebaseCard.cardIssuer,
        rewardRates,
        annualFee: firebaseCard.annualFee || 0,
        creditScoreRequired: creditScoreMap[firebaseCard.creditRange] || 'good',
        perks,
        foreignTransactionFee: Boolean(firebaseCard.isFxFee),
        categories: Array.from(categories),
        description: firebaseCard.spendBonusDesc || `${firebaseCard.cardName} from ${firebaseCard.cardIssuer}`,
        cardType: firebaseCard.cardType?.toLowerCase() === 'business' ? 'business' : 'personal'
      };

      // Add signup bonus if present
      if (firebaseCard.isSignupBonus) {
        cardDetails.signupBonus = {
          amount: Number(firebaseCard.signupBonusAmount) || 0,
          type: firebaseCard.signupBonusType?.toLowerCase() || 'cashback',
          spendRequired: firebaseCard.signupBonusSpend || 0,
          timeframe: firebaseCard.signupBonusLength || 3,
          description: firebaseCard.signupBonusDesc || ''
        };
      }

      return cardDetails;
    } catch (error) {
      console.error(`Error mapping Firebase card:`, error);
      return null;
    }
  }

  private mapCreditScore(creditRange: string): CreditScoreType {
    if (!creditRange) return 'good';
    const range = creditRange.toLowerCase();
    if (range.includes('excellent')) return 'excellent';
    if (range.includes('good')) return 'good';
    if (range.includes('fair')) return 'fair';
    return 'poor';
  }

  private extractPerks(card: any): string[] {
    const perks: string[] = [];
    
    // Add benefits
    if (Array.isArray(card.benefit)) {
      card.benefit.forEach((benefit: any) => {
        if (benefit.benefitDesc) {
          perks.push(benefit.benefitDesc);
        }
      });
    }

    // Add other perks based on flags
    if (card.isFreeCheckedBag) perks.push('Free Checked Bag');
    if (card.isFreeHotelNight) perks.push('Free Hotel Night');
    if (card.isLoungeAccess) perks.push('Airport Lounge Access');
    if (card.isTrustedTraveler) perks.push('Trusted Traveler Credit');

    return perks;
  }

  private extractCategories(card: any): string[] {
    const categories = new Set<string>();

    // Add base categories
    if (card.categoryType) {
      categories.add(card.categoryType.toLowerCase());
    }

    // Add categories from spend bonus
    if (Array.isArray(card.spendBonusCategory)) {
      card.spendBonusCategory.forEach((bonus: any) => {
        if (bonus.spendBonusCategoryGroup) {
          categories.add(bonus.spendBonusCategoryGroup.toLowerCase());
        }
      });
    }

    // Add special categories
    if (!card.annualFee) categories.add('no-annual-fee');
    if (card.cardType?.toLowerCase() === 'business') categories.add('business');
    if (!card.isFxFee) categories.add('no-foreign-transaction-fee');

    return Array.from(categories);
  }

  public async getAllCards(): Promise<ApiResponse<CreditCardDetails[]>> {
    try {
      // If we have cached data, return it immediately
      if (this.cardsCache) {
        console.log(`🔍 CardDataService: Using cached data (${this.cardsCache.length} cards)`);
        return { success: true, data: this.cardsCache };
      }
      
      // Check if fetch is already in progress
      if (this.fetchInProgress) {
        console.log('🔍 CardDataService: Fetch already in progress, reusing promise');
        return this.fetchInProgress;
      }
      
      console.log('🔍 CardDataService: Starting getAllCards');
      
      // Try to load from storage first
      const { cards: cachedCards, timestamp } = this.loadCacheFromStorage();
      if (cachedCards) {
        this.cardsCache = cachedCards;
        this.cardDetailsCache = {};
        cachedCards.forEach(card => {
          if (card.id) {
            this.cardDetailsCache[card.id] = card;
          }
        });
        
        return { success: true, data: cachedCards };
      }
      
      // Otherwise fetch from Firestore
      if (!db) {
        console.error('❌ CardDataService: Firestore is not initialized');
        return { success: false, error: 'Firestore is not initialized' };
      }

      this.fetchInProgress = new Promise(async (resolve) => {
        try {
          const cardsRef = collection(db, FIREBASE_COLLECTIONS.CREDIT_CARDS);
          const snapshot = await getDocs(cardsRef);
          
          if (snapshot.empty) {
            resolve({ success: true, data: [] });
            return;
          }

          const rawCards = snapshot.docs.map(doc => ({
            cardKey: doc.id,
            ...doc.data()
          }));

          // Map Firebase cards to our format
          const validCards = rawCards
            .map(card => this.mapFirebaseCardToCardDetails(card))
            .filter((card): card is CreditCardDetails => card !== null);

          console.log(`🔍 CardDataService: Mapped ${validCards.length} cards out of ${rawCards.length} total`);

          // Update cache
          this.cardsCache = validCards;
          this.lastFetchTime = Date.now();
          this.cardDetailsCache = {};
          validCards.forEach(card => {
            this.cardDetailsCache[card.id] = card;
          });
          
          // Save to localStorage
          this.saveCacheToStorage(validCards);

          resolve({ success: true, data: validCards });
        } catch (error) {
          console.error('❌ CardDataService: Error fetching all cards:', error);
          resolve({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch cards'
          });
        } finally {
          this.fetchInProgress = null;
        }
      });
      
      return this.fetchInProgress;
    } catch (error) {
      console.error('❌ CardDataService: Error in getAllCards:', error);
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
    if (isBrowser()) {
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