import { SearchResultCard } from '@/types/cards';

/**
 * Lightweight search index for credit cards
 * This avoids loading the full card details when searching
 */
class CardSearchIndex {
  private static instance: CardSearchIndex;
  private searchIndex: Map<string, SearchResultCard[]> = new Map();
  private isInitialized = false;
  private cardsByKey: Map<string, SearchResultCard> = new Map();
  
  private constructor() {}
  
  public static getInstance(): CardSearchIndex {
    if (!CardSearchIndex.instance) {
      CardSearchIndex.instance = new CardSearchIndex();
    }
    return CardSearchIndex.instance;
  }
  
  // Add this constant for chunk size
  private STORAGE_CHUNK_SIZE = 50; // Number of cards per chunk
  
  /**
   * Initialize the search index with card data
   * This should be called once when the app loads
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      // Try to load from localStorage first for instant results
      if (typeof window !== 'undefined') {
        const cachedIndex = this.loadFromLocalStorageChunks('cardSearchIndex');
        if (cachedIndex) {
          const { cardsByKey, timestamp } = cachedIndex;
          // Only use cache if it's less than 24 hours old
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            this.cardsByKey = new Map(Object.entries(cardsByKey));
            this.buildSearchIndexFromCards();
            this.isInitialized = true;
            console.log(`Card search index loaded from cache (${this.cardsByKey.size} cards)`);
            
            // Refresh in background
            this.refreshIndex();
            return true;
          }
        }
      }
      
      return await this.refreshIndex();
    } catch (error) {
      console.error('Failed to initialize search index', error);
      return false;
    }
  }
  
  /**
   * Save data to localStorage in chunks to avoid quota issues
   */
  private saveToLocalStorageInChunks(key: string, data: any): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      // First clear any existing chunks
      for (let i = 0; i < 100; i++) {
        const chunkKey = `${key}_chunk_${i}`;
        if (localStorage.getItem(chunkKey) === null) {
          break;
        }
        localStorage.removeItem(chunkKey);
      }
      
      // Convert cards to array for chunking
      const entries = Array.from(this.cardsByKey.entries());
      const totalChunks = Math.ceil(entries.length / this.STORAGE_CHUNK_SIZE);
      
      // Save metadata
      localStorage.setItem(`${key}_meta`, JSON.stringify({
        totalChunks,
        timestamp: Date.now(),
        totalItems: entries.length
      }));
      
      // Save each chunk
      for (let i = 0; i < totalChunks; i++) {
        const startIndex = i * this.STORAGE_CHUNK_SIZE;
        const endIndex = Math.min(startIndex + this.STORAGE_CHUNK_SIZE, entries.length);
        const chunk = entries.slice(startIndex, endIndex);
        
        const chunkData = Object.fromEntries(chunk);
        localStorage.setItem(`${key}_chunk_${i}`, JSON.stringify(chunkData));
      }
      
      console.log(`Saved ${entries.length} items in ${totalChunks} chunks to localStorage`);
      return true;
    } catch (e) {
      console.warn('Failed to save data to localStorage', e);
      return false;
    }
  }
  
  /**
   * Load data from localStorage chunks
   */
  private loadFromLocalStorageChunks(key: string): { cardsByKey: Record<string, SearchResultCard>, timestamp: number } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      // Get metadata
      const metaStr = localStorage.getItem(`${key}_meta`);
      if (!metaStr) return null;
      
      const meta = JSON.parse(metaStr);
      if (!meta.totalChunks || !meta.timestamp) return null;
      
      // Load chunks
      const allData: Record<string, SearchResultCard> = {};
      for (let i = 0; i < meta.totalChunks; i++) {
        const chunkStr = localStorage.getItem(`${key}_chunk_${i}`);
        if (!chunkStr) {
          console.warn(`Missing chunk ${i} for key ${key}`);
          return null;
        }
        
        const chunk = JSON.parse(chunkStr);
        Object.assign(allData, chunk);
      }
      
      return {
        cardsByKey: allData,
        timestamp: meta.timestamp
      };
    } catch (e) {
      console.warn('Failed to load data from localStorage chunks', e);
      return null;
    }
  }
  
  /**
   * Refresh the search index from the API
   */
  private async refreshIndex(): Promise<boolean> {
    try {
      // Fetch only the search-specific data (not full card details)
      const response = await fetch('/api/cards/search-index');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch search index: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid search index data');
      }
      
      // Clear previous data
      this.cardsByKey.clear();
      
      // Store cards by key for quick lookup
      data.data.forEach((card: SearchResultCard) => {
        this.cardsByKey.set(card.cardKey, card);
      });
      
      // Build the search index
      this.buildSearchIndexFromCards();
      
      // Cache in localStorage
      if (typeof window !== 'undefined') {
        this.saveToLocalStorageInChunks('cardSearchIndex', this.cardsByKey);
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error refreshing search index:', error);
      return false;
    }
  }
  
  /**
   * Build the search index from the cards
   */
  private buildSearchIndexFromCards() {
    this.searchIndex.clear();
    
    // Create trigram index for fuzzy matching
    for (const [cardKey, card] of this.cardsByKey.entries()) {
      const cardName = card.cardName.toLowerCase();
      const cardIssuer = card.cardIssuer.toLowerCase();
      
      // Add direct term matches
      this.addToIndex(cardName, card);
      this.addToIndex(cardIssuer, card);
      
      // Add each word individually
      cardName.split(/\s+/).forEach(word => {
        if (word.length > 2) {
          this.addToIndex(word, card);
        }
      });
      
      // Add card issuer + short name combinations
      // e.g. "chase sapphire" => "chase" + "sapphire"
      const words = cardName.split(/\s+/).filter(w => w.length > 3);
      if (words.length > 1) {
        words.forEach(word => {
          this.addToIndex(`${cardIssuer} ${word}`, card);
        });
      }
    }
  }
  
  /**
   * Add a term to the search index
   */
  private addToIndex(term: string, card: SearchResultCard) {
    if (!term || term.length < 2) return;
    
    term = term.toLowerCase().trim();
    
    if (!this.searchIndex.has(term)) {
      this.searchIndex.set(term, []);
    }
    
    const cards = this.searchIndex.get(term);
    if (!cards!.some(c => c.cardKey === card.cardKey)) {
      cards!.push(card);
    }
  }
  
  /**
   * Search for cards matching the query
   */
  public search(query: string): SearchResultCard[] {
    if (!this.isInitialized) {
      console.warn('Search index not initialized');
      return [];
    }
    
    if (!query || query.length < 2) {
      return [];
    }
    
    query = query.toLowerCase().trim();
    
    // Start with exact matches
    let results = this.searchIndex.get(query) || [];
    
    // If we don't have enough results, try prefix matches
    if (results.length < 10) {
      // Find all keys that start with the query
      for (const [term, cards] of this.searchIndex.entries()) {
        if (term.startsWith(query) && term !== query) {
          cards.forEach(card => {
            if (!results.some(r => r.cardKey === card.cardKey)) {
              results.push(card);
            }
          });
        }
      }
    }
    
    // If still not enough, try word matches
    if (results.length < 10) {
      const words = query.split(/\s+/).filter(w => w.length > 2);
      if (words.length > 1) {
        for (const word of words) {
          const wordResults = this.searchIndex.get(word) || [];
          wordResults.forEach(card => {
            if (!results.some(r => r.cardKey === card.cardKey)) {
              results.push(card);
            }
          });
        }
      }
    }
    
    // Sort results by relevance
    // Exact name matches first, then issuer matches, then others
    results.sort((a, b) => {
      const aNameMatch = a.cardName.toLowerCase().includes(query);
      const bNameMatch = b.cardName.toLowerCase().includes(query);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // If both match or don't match name, sort by issuer
      const aIssuerMatch = a.cardIssuer.toLowerCase().includes(query);
      const bIssuerMatch = b.cardIssuer.toLowerCase().includes(query);
      
      if (aIssuerMatch && !bIssuerMatch) return -1;
      if (!aIssuerMatch && bIssuerMatch) return 1;
      
      // If still tied, sort alphabetically
      return a.cardName.localeCompare(b.cardName);
    });
    
    // Limit to top 20 results
    return results.slice(0, 20);
  }
  
  /**
   * Get card by key from the index
   */
  public getCard(cardKey: string): SearchResultCard | undefined {
    return this.cardsByKey.get(cardKey);
  }
  
  /**
   * Get all cards in the index
   */
  public getAllCards(): SearchResultCard[] {
    return Array.from(this.cardsByKey.values());
  }
}

// Export a singleton instance
const cardSearchIndex = CardSearchIndex.getInstance();
export default cardSearchIndex; 