import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { Logger } from '@/utils/logger';

export const FIREBASE_COLLECTIONS = {
  CREDIT_CARDS: 'credit_cards',
  USER_CARDS: 'user_cards',
  USERS: 'users',
  USER_PREFERENCES: 'user_preferences',
  EXPENSES: 'expenses'
} as const;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Singleton instance
let firebaseApp: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let firebaseAuth: Auth | null = null;

export const initializeFirebase = (): { app: FirebaseApp; db: Firestore; auth: Auth } => {
  try {
    if (!firebaseApp) {
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        const error = new Error('Firebase configuration is missing required fields');
        Logger.error('Firebase initialization failed', { error, context: 'firebase' });
        throw error;
      }

      // Check if Firebase is already initialized
      const existingApps = getApps();
      if (existingApps.length > 0) {
        firebaseApp = existingApps[0];
        Logger.info('Using existing Firebase app instance', { context: 'firebase' });
      } else {
        firebaseApp = initializeApp(firebaseConfig);
        Logger.info('Firebase app initialized successfully', { context: 'firebase' });
      }
    }

    if (!firestore) {
      firestore = getFirestore(firebaseApp);
      
      // Enable offline persistence
      if (typeof window !== 'undefined') {
        enableIndexedDbPersistence(firestore).catch((err) => {
          if (err.code === 'failed-precondition') {
            Logger.warn('Multiple tabs open, persistence can only be enabled in one tab at a time', { context: 'firebase' });
          } else if (err.code === 'unimplemented') {
            Logger.warn('The current browser does not support persistence', { context: 'firebase' });
          }
        });
      }
    }

    if (!firebaseAuth) {
      firebaseAuth = getAuth(firebaseApp);
    }

    Logger.info('Firebase services initialized successfully', { context: 'firebase' });

    return {
      app: firebaseApp,
      db: firestore,
      auth: firebaseAuth
    };
  } catch (error) {
    Logger.error('Failed to initialize Firebase', { error, context: 'firebase' });
    throw error;
  }
};

// Export initialized instances
export const { app, db, auth } = initializeFirebase();

// Type guard for Firestore
export const isFirestore = (db: any): db is Firestore => {
  return db && typeof db === 'object' && 'collection' in db;
};

// Helper function to check if Firebase is properly initialized
export const isFirebaseInitialized = (): boolean => {
  return !!(firebaseApp && firestore && firebaseAuth);
};