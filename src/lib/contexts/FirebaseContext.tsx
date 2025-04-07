import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Logger } from '@/lib/utils/logger';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout
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