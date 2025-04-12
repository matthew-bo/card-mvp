import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Firestore } from 'firebase/firestore';
import { Auth, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, updateProfile, updateEmail, updatePassword, onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import { Logger } from '@/utils/logger';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Define FIREBASE_COLLECTIONS here to avoid circular imports
const FIREBASE_COLLECTIONS = {
  USER_PREFERENCES: 'user_preferences',
  USER_CARDS: 'user_cards',
  EXPENSES: 'expenses'
};

interface FirebaseContextType {
  db: Firestore | null;
  auth: Auth | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
}

interface FirebaseProviderProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

const FirebaseContext = createContext<FirebaseContextType>({
  db: null,
  auth: null,
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  updateUserEmail: async () => {},
  updateUserPassword: async () => {}
});

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ 
  children, 
  onError, 
  onReady 
}) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Move the ref outside of useEffect to the component level
  const prevAuthStateRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const { db: firestore, auth: firebaseAuth } = initializeFirebase();
      setDb(firestore);
      setAuth(firebaseAuth);
      
      // Set up auth state listener
      if (firebaseAuth) {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
          const newState = user ? 'authenticated' : 'unauthenticated';
          const prevState = prevAuthStateRef.current;
          
          // Only log when state actually changes
          if (prevState !== newState) {
            console.log("[DEBUG] Auth state changed:", newState);
            prevAuthStateRef.current = newState;
          }
          
          // Rest of your auth state logic here
          setUser(user);
          setLoading(false);
          if (user) {
            Logger.info('User authenticated', { 
              context: 'firebase',
              data: { uid: user.uid, email: user.email }
            });
            
            // Check and initialize documents for existing users
            // This helps users who created accounts before the initialization logic was added
            ensureUserDocumentsExist(user, firestore);
          }
        });
        
        onReady?.();

        return () => {
          unsubscribe();
        };
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize Firebase');
      setError(error);
      onError?.(error);
      Logger.error('Error initializing Firebase', { 
        context: 'firebase',
        data: error 
      });
    }
  }, [onError, onReady]);

  /**
   * Ensures that all necessary user documents exist in Firebase
   * This helps with accounts created before document initialization was added
   */
  const ensureUserDocumentsExist = async (user: User, firestore: Firestore) => {
    try {
      // Import necessary functions only when needed to avoid circular dependencies
      const { getDoc } = await import('firebase/firestore');
      
      // Check if the user preferences document exists
      const prefsDocRef = doc(firestore, FIREBASE_COLLECTIONS.USER_PREFERENCES, user.uid);
      const prefsDoc = await getDoc(prefsDocRef);
      
      // If preferences document doesn't exist, initialize all user documents
      if (!prefsDoc.exists()) {
        Logger.info('Detected existing user with missing documents, initializing', {
          context: 'firebase',
          data: { uid: user.uid }
        });
        
        await initializeUserDocuments(user);
      }
    } catch (error) {
      Logger.error('Error checking/ensuring user documents', {
        context: 'firebase',
        data: { uid: user.uid, error }
      });
      // Don't throw - we want authentication to succeed even if this fails
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Auth not initialized');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error('Auth not initialized');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Initialize user documents in Firebase
    await initializeUserDocuments(userCredential.user);
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Auth not initialized');
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Initialize user documents in Firebase
    await initializeUserDocuments(userCredential.user);
  };

  /**
   * Initializes necessary documents for a new user in Firebase
   */
  const initializeUserDocuments = async (user: User) => {
    if (!db) {
      Logger.error('Cannot initialize user documents - Firebase not initialized', {
        context: 'firebase',
        data: { uid: user.uid }
      });
      return;
    }
    
    try {
      Logger.info('Initializing user documents', {
        context: 'firebase',
        data: { uid: user.uid }
      });
      
      // Create user preferences document
      await setDoc(doc(db, FIREBASE_COLLECTIONS.USER_PREFERENCES, user.uid), {
        userId: user.uid,
        optimizationPreference: 'points',
        creditScore: 'good',
        zeroAnnualFee: false,
        preferredCardType: 'personal',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // We don't need to create documents in the USER_CARDS or EXPENSES collections
      // since they are designed to be empty initially and populated as needed
      
      Logger.info('User document initialization complete', {
        context: 'firebase',
        data: { uid: user.uid }
      });
    } catch (error) {
      Logger.error('Error initializing user documents', {
        context: 'firebase',
        data: { uid: user.uid, error }
      });
      // Don't throw here, we want auth to succeed even if doc init fails
    }
  };

  const logout = async () => {
    if (!auth) throw new Error('Auth not initialized');
    await signOut(auth);
  };

  const updateUserProfile = async (displayName: string) => {
    if (!auth?.currentUser) throw new Error('No authenticated user');
    await updateProfile(auth.currentUser, { displayName });
  };

  const updateUserEmail = async (newEmail: string) => {
    if (!auth?.currentUser) throw new Error('No authenticated user');
    await updateEmail(auth.currentUser, newEmail);
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!auth?.currentUser) throw new Error('No authenticated user');
    await updatePassword(auth.currentUser, newPassword);
  };

  const value = {
    db,
    auth,
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}; 