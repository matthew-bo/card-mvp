import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Logger } from '@/lib/utils/logger';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      Logger.error('Firebase auth is not initialized', { context: 'FirebaseProvider' });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        console.log('[DEBUG] Auth state changed:', user?.uid);
        setUser(user);
        setLoading(false);
      },
      (error) => {
        Logger.error('Auth state change error', { 
          context: 'FirebaseProvider',
          data: error 
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase auth is not initialized');
    
    try {
      Logger.info('Attempting sign in', { 
        context: 'FirebaseProvider',
        data: { email } 
      });
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Logger.error('Sign in error', { 
        context: 'FirebaseProvider',
        data: error 
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase auth is not initialized');
    
    try {
      Logger.info('Attempting sign up', { 
        context: 'FirebaseProvider',
        data: { email } 
      });
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Logger.error('Sign up error', { 
        context: 'FirebaseProvider',
        data: error 
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase auth is not initialized');
    
    try {
      Logger.info('Attempting Google sign in', { context: 'FirebaseProvider' });
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      Logger.error('Google sign in error', { 
        context: 'FirebaseProvider',
        data: error 
      });
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) throw new Error('Firebase auth is not initialized');
    
    try {
      Logger.info('Attempting logout', { context: 'FirebaseProvider' });
      await signOut(auth);
    } catch (error) {
      Logger.error('Logout error', { 
        context: 'FirebaseProvider',
        data: error 
      });
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string) => {
    if (!auth.currentUser) throw new Error('No user is currently signed in');
    try {
      Logger.info('Attempting to update user profile', { context: 'FirebaseProvider' });
      await updateProfile(auth.currentUser, { displayName });
    } catch (error) {
      Logger.error('Update profile error', { context: 'FirebaseProvider', data: error });
      throw error;
    }
  };

  const updateUserEmail = async (newEmail: string) => {
    if (!auth.currentUser) throw new Error('No user is currently signed in');
    try {
      Logger.info('Attempting to update user email', { context: 'FirebaseProvider' });
      await updateEmail(auth.currentUser, newEmail);
    } catch (error) {
      Logger.error('Update email error', { context: 'FirebaseProvider', data: error });
      throw error;
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('No user is currently signed in');
    try {
      Logger.info('Attempting to update user password', { context: 'FirebaseProvider' });
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      Logger.error('Update password error', { context: 'FirebaseProvider', data: error });
      throw error;
    }
  };

  const value = {
    user,
    loading,
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
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
} 