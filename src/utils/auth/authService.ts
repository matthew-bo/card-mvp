/**
 * Auth service for handling authentication functions.
 * This is a fallback implementation that redirects to our mock implementation.
 */

// Import our mock auth functions from the components directory
import {
  signIn,
  signUp,
  signOut,
  signInWithGoogle
} from '@/components/auth/authService';

/**
 * Sends a password reset email to the specified email address
 */
export async function resetPassword(email: string): Promise<void> {
  console.log('Sending password reset email to:', email);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, this would call Firebase or another auth provider
  return Promise.resolve();
}

// Re-export the mock auth functions
export { signIn, signUp, signOut, signInWithGoogle }; 