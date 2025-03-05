'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/utils/auth/authConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isEmailVerified: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
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
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);