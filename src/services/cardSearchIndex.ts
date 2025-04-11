import { SearchResultCard } from '@/types/cards';

interface QuickSearchCard {
  cardKey: string;
  cardName: string;
  cardIssuer: string;
}

interface CacheData {
  cards: [string, QuickSearchCard][];
  timestamp: number;
}

interface SearchResult extends QuickSearchCard {
  score: number;
}

/**
 * Lightweight search index for credit cards
 * Optimized for quick search with progressive loading
 */
class CardSearchIndex {
  private static instance: CardSearchIndex;
  private quickSearchIndex: Map<string, QuickSearchCard> = new Map();
  private isInitialized = false;
  private CACHE_DURATION = 20 * 60 * 1000; // 20 minutes

  private constructor() {}

  public static getInstance(): CardSearchIndex {
    if (!CardSearchIndex.instance) {
      CardSearchIndex.instance = new CardSearchIndex();
    }
    return CardSearchIndex.instance;
  }

  /**
   * Initialize the search index with basic card data
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Try to load from sessionStorage first for instant results
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('quickSearchIndex');
        if (cached) {
          const { cards, timestamp }: CacheData = JSON.parse(cached);
          // Only use cache if it's within our session duration
          if (Date.now() - timestamp < this.CACHE_DURATION) {
            this.quickSearchIndex = new Map(cards);
            this.isInitialized = true;
            console.log(`Quick search index loaded from cache (${this.quickSearchIndex.size} cards)`);
            
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
   * Refresh the search index from the API
   */
  private async refreshIndex(): Promise<boolean> {
    try {
      const response = await fetch('/api/cards/search-index');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch search index: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid search index data');
      }

      // Clear previous data
      this.quickSearchIndex.clear();

      // Store only basic card info for quick search
      data.data.forEach((card: SearchResultCard) => {
        this.quickSearchIndex.set(card.cardKey, {
          cardKey: card.cardKey,
          cardName: card.cardName || 'Unknown Card',
          cardIssuer: card.cardIssuer || 'Unknown Issuer'
        });
      });

      // Cache in sessionStorage
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('quickSearchIndex', JSON.stringify({
            cards: Array.from(this.quickSearchIndex.entries()),
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Failed to save to sessionStorage, continuing in-memory only');
        }
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error refreshing search index:', error);
      return false;
    }
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    return track[str2.length][str1.length];
  }

  /**
   * Calculate search score for a card based on query match
   */
  private calculateScore(card: QuickSearchCard, searchTerm: string): number {
    const cardNameLower = card.cardName.toLowerCase();
    const cardIssuerLower = card.cardIssuer.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();

    // Exact matches get highest score
    if (cardNameLower === searchTermLower) return 100;
    if (cardIssuerLower === searchTermLower) return 90;

    // Prefix matches get high score
    if (cardNameLower.startsWith(searchTermLower)) return 80;
    if (cardIssuerLower.startsWith(searchTermLower)) return 70;

    // Contains matches get medium score
    if (cardNameLower.includes(searchTermLower)) return 60;
    if (cardIssuerLower.includes(searchTermLower)) return 50;

    // Fuzzy matches get lower scores based on Levenshtein distance
    const nameDistance = this.levenshteinDistance(cardNameLower, searchTermLower);
    const issuerDistance = this.levenshteinDistance(cardIssuerLower, searchTermLower);
    
    // Only include fuzzy matches if they're reasonably close
    const maxDistance = Math.min(searchTerm.length * 0.4, 3); // Allow more distance for longer queries
    
    if (nameDistance <= maxDistance || issuerDistance <= maxDistance) {
      const nameScore = 40 * (1 - nameDistance / searchTerm.length);
      const issuerScore = 30 * (1 - issuerDistance / searchTerm.length);
      return Math.max(nameScore, issuerScore);
    }

    return 0; // No match
  }

  /**
   * Perform a quick search using basic card info
   */
  public search(query: string): QuickSearchCard[] {
    if (!query || query.length < 3) return [];

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Score all cards
    this.quickSearchIndex.forEach(card => {
      const score = this.calculateScore(card, searchTerm);
      if (score > 0) {
        results.push({ ...card, score });
      }
    });

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Limit to top 10 results
      .map(({ cardKey, cardName, cardIssuer }) => ({ cardKey, cardName, cardIssuer }));
  }

  /**
   * Get basic card info by key
   */
  public getQuickCard(cardKey: string): QuickSearchCard | undefined {
    return this.quickSearchIndex.get(cardKey);
  }

  /**
   * Get all basic card info
   */
  public getAllQuickCards(): QuickSearchCard[] {
    return Array.from(this.quickSearchIndex.values());
  }
}

const cardSearchIndex = CardSearchIndex.getInstance();
export default cardSearchIndex; 