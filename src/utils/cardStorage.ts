import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Monitor } from './monitoring/monitor';

export async function storeCardData(userId: string, cardData: { cardId: string }) {
  try {
    // Validate user
    if (!userId) {
      throw new Error('No user ID provided');
    }

    // Check for duplicate card
    const cardsRef = collection(db, 'user_cards');
    const q = query(
      cardsRef, 
      where('userId', '==', userId),
      where('cardId', '==', cardData.cardId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error('Card already exists for user');
    }

    // Store card selection
    const result = await addDoc(collection(db, 'user_cards'), {
      userId,
      cardId: cardData.cardId,
      dateAdded: new Date()
    });

    Monitor.logEvent(
      'card_selection',
      'Card added to user profile',
      'info',
      { userId, cardId: cardData.cardId }
    );

    return result.id;

  } catch (error) {
    Monitor.trackError(error as Error, { 
      operation: 'storeCardData',
      userId 
    });
    throw error;
  }
}