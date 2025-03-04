'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Use a global variable outside of React component lifecycle
let isGlobalProviderMounted = false;

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
}>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Check for duplicate mounting in the effect
    if (typeof window !== 'undefined') {
      if (isGlobalProviderMounted) {
        console.warn('Warning: AuthProvider is being mounted more than once!');
        // Return early without setting up duplicate listeners
        return () => {};
      }
      isGlobalProviderMounted = true;
      isMountedRef.current = true;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      // Reset the flag when unmounted
      if (typeof window !== 'undefined' && isMountedRef.current) {
        isGlobalProviderMounted = false;
        isMountedRef.current = false;
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);