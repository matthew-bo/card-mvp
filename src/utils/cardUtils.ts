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