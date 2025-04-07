import { 
  collection, 
  doc,
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Firestore
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Logger } from '@/lib/utils/logger';
import { FIREBASE_COLLECTIONS } from '@/lib/firebase';

export interface Card {
  id: string;
  name: string;
  issuer: string;
  rewards: {
    categories: Record<string, number>;
    baseRate: number;
  };
  fees: {
    annual: number;
    foreign: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export class FirebaseCardService {
  private db: Firestore;
  private cardsCollection;
  private userCardsCollection;

  constructor() {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    this.db = db;
    this.cardsCollection = collection(this.db, FIREBASE_COLLECTIONS.CREDIT_CARDS);
    this.userCardsCollection = collection(this.db, FIREBASE_COLLECTIONS.USER_CARDS);
  }

  // Read operations
  async getAllCards(): Promise<Card[]> {
    try {
      Logger.info('Fetching all cards', { context: 'FirebaseCardService' });
      const snapshot = await getDocs(this.cardsCollection);
      
      if (snapshot.empty) {
        Logger.warn('No cards found in database', { context: 'FirebaseCardService' });
        return [];
      }

      return this.processCardSnapshot(snapshot);
    } catch (error) {
      Logger.error('Error fetching all cards', { 
        context: 'FirebaseCardService',
        data: error 
      });
      throw error;
    }
  }

  async getUserCards(userId: string): Promise<Card[]> {
    try {
      Logger.info('Fetching user cards', { 
        context: 'FirebaseCardService',
        data: { userId } 
      });
      
      const q = query(
        this.userCardsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        Logger.info('No cards found for user', { 
          context: 'FirebaseCardService',
          data: { userId } 
        });
        return [];
      }

      // Get the card IDs from user cards
      const cardIds = snapshot.docs.map(doc => doc.data().cardId);

      // Fetch the actual card details
      const cardPromises = cardIds.map(cardId => 
        getDoc(doc(this.cardsCollection, cardId))
      );

      const cardDocs = await Promise.all(cardPromises);
      
      return cardDocs
        .filter(doc => doc.exists())
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Card));
    } catch (error) {
      Logger.error('Error fetching user cards', { 
        context: 'FirebaseCardService',
        data: { error, userId } 
      });
      throw error;
    }
  }

  // Write operations
  async addUserCard(userId: string, cardId: string): Promise<void> {
    try {
      // Verify the card exists first
      const cardDoc = await getDoc(doc(this.cardsCollection, cardId));
      if (!cardDoc.exists()) {
        throw new Error(`Card with ID ${cardId} does not exist`);
      }

      Logger.info('Adding card to user', { 
        context: 'FirebaseCardService',
        data: { userId, cardId } 
      });
      
      await addDoc(this.userCardsCollection, {
        userId,
        cardId,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      Logger.error('Error adding user card', { 
        context: 'FirebaseCardService',
        data: { error, userId, cardId } 
      });
      throw error;
    }
  }

  async removeUserCard(userId: string, cardId: string): Promise<void> {
    try {
      Logger.info('Removing card from user', { 
        context: 'FirebaseCardService',
        data: { userId, cardId } 
      });
      
      const q = query(
        this.userCardsCollection,
        where('userId', '==', userId),
        where('cardId', '==', cardId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        Logger.warn('No matching user card found to remove', {
          context: 'FirebaseCardService',
          data: { userId, cardId }
        });
        return;
      }

      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      Logger.error('Error removing user card', { 
        context: 'FirebaseCardService',
        data: { error, userId, cardId } 
      });
      throw error;
    }
  }

  // Real-time listeners
  onUserCardsChange(userId: string, callback: (cards: Card[]) => void): () => void {
    const q = query(
      this.userCardsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, 
      async (snapshot) => {
        try {
          // Get the card IDs from user cards
          const cardIds = snapshot.docs.map(doc => doc.data().cardId);

          // Fetch the actual card details
          const cardPromises = cardIds.map(cardId => 
            getDoc(doc(this.cardsCollection, cardId))
          );

          const cardDocs = await Promise.all(cardPromises);
          
          const cards = cardDocs
            .filter(doc => doc.exists())
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Card));

          callback(cards);
        } catch (error) {
          Logger.error('Error processing user cards update', {
            context: 'FirebaseCardService',
            data: { error, userId }
          });
        }
      },
      (error) => {
        Logger.error('Error in user cards listener', { 
          context: 'FirebaseCardService',
          data: { error, userId } 
        });
      }
    );
  }

  // Helper methods
  private processCardSnapshot(snapshot: QuerySnapshot<DocumentData>): Card[] {
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Card));
  }
}

// Export singleton instance
export const firebaseCardService = new FirebaseCardService(); 