import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchAllCards } from '@/services/cardApiService';
import { CreditCardDetails, RewardRates } from '@/types/cards';

const CARDS_COLLECTION = 'credit_cards';

// Default reward rates matching the RewardRates interface
const DEFAULT_REWARD_RATES: RewardRates = {
  dining: 1,
  travel: 1,
  grocery: 1,
  gas: 1,
  entertainment: 1,
  rent: 1,
  other: 1,
  base: 1
};

// Validate and ensure all required properties are present
function validateAndNormalizeCard(card: Partial<CreditCardDetails>): CreditCardDetails | null {
  try {
    if (!card.id || !card.name || !card.issuer) {
      console.warn(`Skipping card ${card.id || 'unknown'}: Missing basic properties`);
      return null;
    }

    // Ensure all required properties have valid values
    const normalizedCard: CreditCardDetails = {
      id: card.id,
      name: card.name,
      issuer: card.issuer,
      rewardRates: card.rewardRates || DEFAULT_REWARD_RATES,
      annualFee: typeof card.annualFee === 'number' ? card.annualFee : 0,
      creditScoreRequired: card.creditScoreRequired || 'good',
      perks: card.perks || [],
      foreignTransactionFee: typeof card.foreignTransactionFee === 'boolean' ? card.foreignTransactionFee : true,
      categories: card.categories || [],
      description: card.description || `${card.name} from ${card.issuer}`,
      cardType: card.cardType || 'personal',
      signupBonus: card.signupBonus || undefined
    };

    return normalizedCard;
  } catch (error) {
    console.error(`Error validating card ${card.id}:`, error);
    return null;
  }
}

export async function populateFirestoreWithCards(): Promise<number> {
  try {
    // Check if cards already exist
    const cardsRef = collection(db, CARDS_COLLECTION);
    const existingCards = await getDocs(cardsRef);
    
    if (!existingCards.empty) {
      console.log(`Found ${existingCards.size} cards already in Firestore.`);
      return existingCards.size;
    }
    
    // Fetch cards from API
    const cards = await fetchAllCards();
    console.log(`Fetched ${cards.length} cards from API.`);
    
    // Validate and normalize cards
    const validCards = cards
      .map(card => validateAndNormalizeCard(card))
      .filter((card): card is CreditCardDetails => card !== null);
    
    console.log(`${validCards.length} cards passed validation out of ${cards.length} total`);
    
    // Use batched writes for better performance
    const BATCH_SIZE = 400; // Firestore has a limit of 500 operations per batch
    let cardsAdded = 0;
    
    for (let i = 0; i < validCards.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const currentBatch = validCards.slice(i, i + BATCH_SIZE);
      
      for (const card of currentBatch) {
        const cardRef = doc(collection(db, CARDS_COLLECTION));
        batch.set(cardRef, {
          ...card,
          updatedAt: new Date()
        });
        cardsAdded++;
      }
      
      await batch.commit();
      console.log(`Committed batch of ${currentBatch.length} cards to Firestore.`);
    }
    
    console.log(`Successfully added ${cardsAdded} cards to Firestore.`);
    return cardsAdded;
  } catch (error) {
    console.error('Error populating Firestore with cards:', error);
    throw error;
  }
}