import { CreditCardDetails } from '@/types/cards';

// Keywords that suggest a card is for business use
const BUSINESS_KEYWORDS = [
  'business',
  'biz',
  'entrepreneur',
  'commercial',
  'corporate',
  'enterprise',
  'professional',
  'small business',
  'ink',         // Chase Ink Business
  'spark',       // Capital One Spark Business 
  'plum',        // Amex Plum Card
  'platinum business', // Amex Platinum Business
  'gold business',     // Amex Gold Business
  'delta business',    // Delta Business Cards
  'united business',   // United Business Cards
];

/**
 * Determines if a card is a business card based on name and description
 */
export function isBusinessCard(card: CreditCardDetails): boolean {
  const nameAndDesc = (card.name + ' ' + (card.description || '')).toLowerCase();
  
  // Check if any business keywords are in the name or description
  return BUSINESS_KEYWORDS.some(keyword => 
    nameAndDesc.includes(keyword.toLowerCase())
  );
}

/**
 * Filters an array of cards to only personal cards
 */
export function filterPersonalCards(cards: CreditCardDetails[]): CreditCardDetails[] {
  return cards.filter(card => !isBusinessCard(card));
}

/**
 * Filters an array of cards to only business cards
 */
export function filterBusinessCards(cards: CreditCardDetails[]): CreditCardDetails[] {
  return cards.filter(card => isBusinessCard(card));
}

/**
 * Returns the color scheme for a card issuer
 */
export function getIssuerColorScheme(issuer: string): { bg: string; text: string } {
  const schemes: Record<string, { bg: string; text: string }> = {
    'American Express': { bg: 'bg-teal-600', text: 'text-teal-600' },
    'Chase': { bg: 'bg-blue-600', text: 'text-blue-600' },
    'Capital One': { bg: 'bg-red-600', text: 'text-red-600' },
    'Citi': { bg: 'bg-blue-500', text: 'text-blue-500' },
    'Discover': { bg: 'bg-orange-500', text: 'text-orange-500' },
    'Wells Fargo': { bg: 'bg-yellow-600', text: 'text-yellow-600' },
    'Bank of America': { bg: 'bg-red-700', text: 'text-red-700' },
    // Default for other issuers
    'default': { bg: 'bg-gray-600', text: 'text-gray-600' }
  };

  return schemes[issuer] || schemes['default'];
}

/**
 * Returns the Tailwind CSS class for styling credit score badges
 */
export function getCreditScoreBadgeClass(creditScore: string): string {
  switch (creditScore?.toLowerCase()) {
    case 'excellent':
      return 'bg-green-100 text-green-800';
    case 'good':
      return 'bg-blue-100 text-blue-800';
    case 'fair':
      return 'bg-yellow-100 text-yellow-800';
    case 'poor':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Adds a cardType property (business/personal) to a card object
 */
export function addCardTypeProperty<T extends CreditCardDetails>(card: T): T & { cardType: string } {
  return {
    ...card,
    cardType: isBusinessCard(card) ? 'business' : 'personal'
  };
}

/**
 * Gets the top reward categories by rate for a card
 */
export function getTopRewardCategories(card: CreditCardDetails, limit = 3): [string, number][] {
  // Handle case where card might not have rewardRates
  if (!card.rewardRates) return [];
  
  // Convert reward rates to array of [category, rate] pairs, filter out 0 rates
  return Object.entries(card.rewardRates)
    .filter(([, rate]) => rate > 0)  // Only include non-zero rates
    .sort(([, rateA], [, rateB]) => Number(rateB) - Number(rateA))  // Sort by rate descending
    .slice(0, limit);  // Take only the top N
}

/**
 * Gets a card recommendation by examining spending patterns
 */
export function getCardRecommendation(spending: Record<string, number>, cards: CreditCardDetails[]): CreditCardDetails | null {
  if (!cards || cards.length === 0) return null;

  // Calculate potential rewards for each card
  const cardScores = cards.map(card => {
    let totalRewards = 0;
    
    // Calculate rewards based on spending in each category
    Object.entries(spending).forEach(([category, amount]) => {
      const rate = card.rewardRates[category as keyof typeof card.rewardRates] || card.rewardRates.other || 1;
      totalRewards += amount * (rate / 100);
    });
    
    return {
      card,
      score: totalRewards
    };
  });
  
  // Sort by score (highest first) and return the best card
  cardScores.sort((a, b) => b.score - a.score);
  return cardScores[0]?.card || null;
}

/**
 * Gets a categorized summary of a card's features
 */
export function getCardSummary(card: CreditCardDetails): Record<string, string[]> {
  const summary: Record<string, string[]> = {
    pros: [],
    cons: [],
    bestFor: []
  };
  
  // Determine pros
  if (card.annualFee === 0) {
    summary.pros.push('No annual fee');
  }
  
  if (!card.foreignTransactionFee) {
    summary.pros.push('No foreign transaction fees');
  }
  
  // Find highest reward category
  const topCategory = getTopRewardCategories(card, 1)[0];
  if (topCategory && topCategory[1] > 3) {
    summary.pros.push(`High ${topCategory[1]}% rewards on ${topCategory[0]}`);
  }
  
  // Determine cons
  if (card.annualFee > 200) {
    summary.cons.push(`High annual fee ($${card.annualFee})`);
  }
  
  if (card.foreignTransactionFee) {
    summary.cons.push('Has foreign transaction fees');
  }
  
  if (card.creditScoreRequired === 'excellent') {
    summary.cons.push('Requires excellent credit');
  }
  
  // Determine best use cases
  const highCategories = getTopRewardCategories(card, 2);
  highCategories.forEach(([category, rate]) => {
    if (rate > 2) {
      summary.bestFor.push(category);
    }
  });
  
  if (card.annualFee === 0 && card.creditScoreRequired !== 'excellent') {
    summary.bestFor.push('beginners');
  }
  
  if (card.categories.includes('travel') && !card.foreignTransactionFee) {
    summary.bestFor.push('travelers');
  }
  
  return summary;
}

/**
 * Formats the annual fee for display
 */
export function formatAnnualFee(annualFee: number): string {
  if (annualFee === 0) return 'No Annual Fee';
  return `$${annualFee}/year`;
} 