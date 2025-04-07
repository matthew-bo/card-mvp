import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
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

// Initialize Firebase only if it hasn't been initialized already
const getFirebaseApp = (): FirebaseApp => {
  if (!getApps().length) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase configuration is missing required fields');
    }
    const app = initializeApp(firebaseConfig);
    Logger.info('Firebase app initialized successfully', { context: 'firebase' });
    return app;
  }
  return getApps()[0];
};

// Initialize services
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app = getFirebaseApp();
  db = getFirestore(app);
  auth = getAuth(app);
  Logger.info('Firebase services initialized successfully', { context: 'firebase' });
} catch (error) {
  Logger.error('Error initializing Firebase', { 
    context: 'firebase',
    data: error 
  });
  throw error; // We need to throw here as the app can't function without Firebase
}

export { app, db, auth };