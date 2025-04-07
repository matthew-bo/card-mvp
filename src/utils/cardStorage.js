import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Stores card data to Firestore or falls back to local storage if unavailable
 * @param {string} userId - The user ID
 * @param {Object} cardData - The card data to store
 * @param {string} cardData.cardId - The card ID
 * @param {string} cardData.lastFour - The last four digits of the card
 * @param {'credit'|'debit'} cardData.type - The type of card
 * @param {Date} cardData.dateAdded - The date the card was added
 * @returns {Promise<void>}
 */
export async function storeCardData(userId, cardData) {
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