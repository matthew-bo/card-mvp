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

import { auth } from '@/lib/firebase';
import { updateProfile, updateEmail, updatePassword, sendEmailVerification } from 'firebase/auth';

/**
 * Sends a password reset email to the specified email address
 * @param {string} email - The email address to send the reset link to
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  console.log('Sending password reset email to:', email);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, this would call Firebase or another auth provider
  return Promise.resolve();
}

/**
 * Updates the user's profile information
 * @param {Object} user - The Firebase user object
 * @param {Object} updates - The updates to apply
 * @returns {Promise<void>}
 */
export async function updateUserProfile(user, updates) {
  try {
    await updateProfile(user, updates);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Updates the user's email address
 * @param {Object} user - The Firebase user object
 * @param {string} newEmail - The new email address
 * @returns {Promise<void>}
 */
export async function updateUserEmail(user, newEmail) {
  try {
    await updateEmail(user, newEmail);
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
}

/**
 * Updates the user's password
 * @param {Object} user - The Firebase user object
 * @param {string} newPassword - The new password
 * @returns {Promise<void>}
 */
export async function updateUserPassword(user, newPassword) {
  try {
    await updatePassword(user, newPassword);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

/**
 * Resends the email verification link
 * @param {Object} user - The Firebase user object
 * @returns {Promise<void>}
 */
export async function resendVerificationEmail(user) {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error('Error resending verification email:', error);
    throw error;
  }
}

// Re-export the mock auth functions
export { signIn, signUp, signOut, signInWithGoogle }; 