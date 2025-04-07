'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signIn, signUp, signOut, signInWithGoogle } from '@/components/auth/authService';
import { Logger } from '@/utils/logger';

// Define a User type to match what our mock service returns
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
  providerData?: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, displayName: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for stored user on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('stoid_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      Logger.error('Error retrieving stored user', { 
        context: 'AuthProvider',
        data: error 
      });
    }
    setLoading(false);
  }, []);

  // Authentication methods
  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      Logger.info('Attempting sign in', { 
        context: 'AuthProvider',
        data: { email } 
      });
      
      const result = await signIn(email, password);
      // Ensure user has all required fields before setting state
      const userData: User = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL || null,
        emailVerified: result.user.emailVerified,
        providerData: result.user.providerData
      };
      setUser(userData);
      
      // Store user in localStorage
      localStorage.setItem('stoid_user', JSON.stringify(userData));
      
      return result;
    } catch (error) {
      Logger.error('Sign in error', { 
        context: 'AuthProvider',
        data: error 
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      Logger.info('Attempting sign up', { 
        context: 'AuthProvider',
        data: { email } 
      });
      
      const result = await signUp(email, password, displayName);
      // Ensure user has all required fields before setting state
      const userData: User = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL || null,
        emailVerified: result.user.emailVerified,
        providerData: result.user.providerData
      };
      setUser(userData);
      
      // Store user in localStorage
      localStorage.setItem('stoid_user', JSON.stringify(userData));
      
      return result;
    } catch (error) {
      Logger.error('Sign up error', { 
        context: 'AuthProvider',
        data: error 
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      setLoading(true);
      Logger.info('Attempting Google sign in', { context: 'AuthProvider' });
      
      const result = await signInWithGoogle();
      // Ensure user has all required fields before setting state
      const userData: User = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL || null,
        emailVerified: result.user.emailVerified,
        providerData: result.user.providerData
      };
      setUser(userData);
      
      // Store user in localStorage
      localStorage.setItem('stoid_user', JSON.stringify(userData));
      
      return result;
    } catch (error) {
      Logger.error('Google sign in error', { 
        context: 'AuthProvider',
        data: error 
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      Logger.info('Attempting logout', { context: 'AuthProvider' });
      
      await signOut();
      setUser(null);
      
      // Remove user from localStorage
      localStorage.removeItem('stoid_user');
    } catch (error) {
      Logger.error('Logout error', { 
        context: 'AuthProvider',
        data: error 
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleSignInWithGoogle,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
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