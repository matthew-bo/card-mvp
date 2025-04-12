import { CreditCardDetails } from '@/types/cards';

export interface CardCacheManager {
  getCard: (cardId: string) => CreditCardDetails | null;
  setCard: (cardId: string, card: CreditCardDetails) => void;
  getAllCards: () => CreditCardDetails[] | null;
  setAllCards: (cards: CreditCardDetails[]) => void;
  clear: () => void;
} 