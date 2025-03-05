import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// Import getStorage but don't initialize right away
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug logging for Firebase config
console.log("Firebase Config Check:", {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: !!firebaseConfig.authDomain,
  projectId: !!firebaseConfig.projectId,
  storageBucket: !!firebaseConfig.storageBucket,
  messagingSenderId: !!firebaseConfig.messagingSenderId,
  appId: !!firebaseConfig.appId
});

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Only initialize storage on the client side
const storage = typeof window !== 'undefined' ? getStorage(app) : null;
const googleProvider = new GoogleAuthProvider();

// Error handling for initialization
if (!app) throw new Error('Firebase app initialization failed');
if (!auth) throw new Error('Firebase auth initialization failed');
if (!db) throw new Error('Firebase Firestore initialization failed');
// Only check storage on client side
if (typeof window !== 'undefined' && !storage) throw new Error('Firebase storage initialization failed');

export const FIREBASE_COLLECTIONS = {
  CREDIT_CARDS: 'credit_cards',
  USER_CARDS: 'user_cards',
  USER_PREFERENCES: 'user_preferences',
  EXPENSES: 'expenses',
  USER_PROFILES: 'user_profiles'
};

export { app, db, auth, storage, googleProvider };