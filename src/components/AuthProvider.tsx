'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  isEmailVerified: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    if (!app) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsEmailVerified(user?.emailVerified || false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // When user signs in via email provider, check for email verification
  useEffect(() => {
    if (user && user.providerData[0]?.providerId === 'password') {
      // If using email/password auth, check email verification
      const checkVerification = async () => {
        try {
          // Force refresh the token to ensure we have the latest verification status
          await user.reload();
          setIsEmailVerified(user.emailVerified);
        } catch (error) {
          console.error('Error refreshing user:', error);
        }
      };
      
      checkVerification();
    } else if (user && user.providerData[0]?.providerId.includes('google')) {
      // Google accounts are always verified
      setIsEmailVerified(true);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);