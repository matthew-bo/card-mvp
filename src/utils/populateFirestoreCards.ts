import { collection, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchAllCards } from '@/services/cardApiService';
import { CreditCardDetails } from '@/types/cards';

const CARDS_COLLECTION = 'credit_cards';

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
    
    // Use batched writes for better performance
    const BATCH_SIZE = 400; // Firestore has a limit of 500 operations per batch
    let cardsAdded = 0;
    
    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const currentBatch = cards.slice(i, i + BATCH_SIZE);
      
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