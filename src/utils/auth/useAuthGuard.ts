import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Create a fallback for useAuth to prevent breaking
const useAuthWithFallback = () => {
  try {
    // Try to import from components first
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuth } = require('@/components/AuthProvider');
    return useAuth();
  } catch (error) {
    try {
      // Try to import from contexts if components fails
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuth } = require('@/contexts/AuthContext');
      return useAuth();
    } catch (innerError) {
      console.warn('Auth providers not available, using fallback', innerError);
      // Return a safe fallback
      return { user: null, loading: false, isEmailVerified: false };
    }
  }
};

interface UseAuthGuardOptions {
  requireAuth?: boolean; 
  requireVerification?: boolean;
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
  redirectAuthenticatedTo?: string;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { 
    requireAuth = false, 
    requireVerification = false,
    redirectTo = '/auth/login',
    redirectIfAuthenticated = false,
    redirectAuthenticatedTo = '/'
  } = options;
  
  // Use our fallback auth hook
  const { user, loading, isEmailVerified } = useAuthWithFallback();
  const router = useRouter();

  useEffect(() => {
    try {
      if (loading) return;

      // If authentication is required but user is not logged in
      if (requireAuth && !user) {
        router.push(redirectTo);
        return;
      }

      // If email verification is required but email is not verified
      if (requireAuth && requireVerification && user && !isEmailVerified) {
        router.push('/auth/verify-email');
        return;
      }

      // If user should be redirected when authenticated 
      if (redirectIfAuthenticated && user) {
        router.push(redirectAuthenticatedTo);
        return;
      }
    } catch (error) {
      console.error('Error in auth guard:', error);
      // In case of errors, don't block the application
    }
  }, [
    user, 
    isEmailVerified, 
    loading, 
    requireAuth, 
    requireVerification, 
    redirectTo, 
    redirectIfAuthenticated, 
    redirectAuthenticatedTo, 
    router
  ]);

  return { user, isEmailVerified, loading };
}