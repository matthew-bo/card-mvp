'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/utils/auth/authConfig';

// Add a global variable to track if provider is mounted
let isAuthProviderMounted = false;

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
}>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Check for duplicate mounting
  if (typeof window !== 'undefined' && isAuthProviderMounted) {
    console.warn('Warning: AuthProvider is being mounted more than once!');
    // Just render children without a new context to avoid errors
    return <>{children}</>;
  }

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set the mounted flag
    if (typeof window !== 'undefined') {
      isAuthProviderMounted = true;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      // Reset the flag when unmounted
      if (typeof window !== 'undefined') {
        isAuthProviderMounted = false;
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);