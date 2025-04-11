'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useFirebase } from '@/contexts/FirebaseContext';

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { 
    user, 
    loading, 
    signIn, 
    signUp, 
    signInWithGoogle, 
    logout, 
    updateUserProfile, 
    updateUserEmail, 
    updateUserPassword 
  } = useFirebase();

  console.log('[DEBUG] AuthProvider state:', { user, loading });

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signInWithGoogle, 
      logout, 
      updateUserProfile, 
      updateUserEmail, 
      updateUserPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 