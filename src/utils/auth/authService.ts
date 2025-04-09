/**
 * Auth service for handling authentication functions.
 * This is a fallback implementation that redirects to our mock implementation.
 */

import { auth } from '@/lib/firebase';
import { 
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  sendEmailVerification as firebaseSendEmailVerification
} from 'firebase/auth';

/**
 * Sends a password reset email to the specified email address
 */
export const sendPasswordResetEmail = async (email: string) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
};

/**
 * Updates the user's profile information
 */
export const updateUserProfile = async (displayName: string, photoURL?: string) => {
  try {
    if (!auth.currentUser) throw new Error('No user logged in');
    await firebaseUpdateProfile(auth.currentUser, { displayName, photoURL });
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
};

/**
 * Updates the user's email address
 */
export const updateUserEmail = async (newEmail: string) => {
  try {
    if (!auth.currentUser) throw new Error('No user logged in');
    await firebaseUpdateEmail(auth.currentUser, newEmail);
    return { success: true };
  } catch (error) {
    console.error('Error updating email:', error);
    return { success: false, error };
  }
};

/**
 * Updates the user's password
 */
export const updateUserPassword = async (newPassword: string) => {
  try {
    if (!auth.currentUser) throw new Error('No user logged in');
    await firebaseUpdatePassword(auth.currentUser, newPassword);
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, error };
  }
};

/**
 * Resends the verification email
 */
export const resendVerificationEmail = async () => {
  try {
    if (!auth.currentUser) throw new Error('No user logged in');
    await firebaseSendEmailVerification(auth.currentUser);
    return { success: true };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { success: false, error };
  }
}; 