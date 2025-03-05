import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

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
  
  const { user, loading, isEmailVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
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