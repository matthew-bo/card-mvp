import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// Import the types we need for proper typing
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Development environment setup is commented out
/*
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  Promise.all([
    import('firebase/auth'),
    import('firebase/firestore'),
    import('firebase/storage')
  ]).then(([{ connectAuthEmulator }, { connectFirestoreEmulator }, { connectStorageEmulator }]) => {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  }).catch(console.error);
}
*/

export const FIREBASE_COLLECTIONS = {
  CREDIT_CARDS: 'credit_cards',
  USER_CARDS: 'user_cards',
  USER_PREFERENCES: 'user_preferences',
  EXPENSES: 'expenses',
  USER_PROFILES: 'user_profiles'
};

// Variable to store the storage instance after it's been initialized
// Adding the correct type or null
let storageInstance: FirebaseStorage | null = null;

// Function to safely get Firebase storage
export function getFirebaseStorage(): FirebaseStorage | null {
  if (typeof window === 'undefined') {
    // Running on server, return null
    return null;
  }
  
  // Initialize storage if it hasn't been initialized yet
  if (!storageInstance) {
    storageInstance = getStorage(app);
  }
  
  return storageInstance;
}

export { app, db, auth, googleProvider };