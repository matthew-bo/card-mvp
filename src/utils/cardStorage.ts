import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { Monitor } from './monitoring/monitor';

interface CardData {
  cardId: string;
  lastFour: string;
  type: 'credit' | 'debit';
  dateAdded: Date;
}

/**
 * Stores card data to Firestore or falls back to local storage if unavailable
 */
export async function storeCardData(userId: string, cardData: CardData): Promise<void> {
  try {
    if (!db) throw new Error('Firestore not available');
    
    await addDoc(collection(db, 'user_cards'), {
      userId,
      cardId: cardData.cardId,
      lastFour: cardData.lastFour,
      type: cardData.type,
      dateAdded: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    console.log('Card data saved to Firestore');
  } catch (error) {
    console.warn('Failed to store card in Firestore, falling back to localStorage', error);
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      try {
        const storageKey = `user_cards_${userId}`;
        const existingData = localStorage.getItem(storageKey);
        const cards = existingData ? JSON.parse(existingData) : [];
        
        cards.push({
          ...cardData,
          dateAdded: cardData.dateAdded.toISOString()
        });
        
        localStorage.setItem(storageKey, JSON.stringify(cards));
        console.log('Card data saved to localStorage');
      } catch (storageError) {
        console.error('Failed to store card in localStorage', storageError);
        throw new Error('Could not store card data');
      }
    } else {
      throw new Error('No storage method available');
    }
  }
}