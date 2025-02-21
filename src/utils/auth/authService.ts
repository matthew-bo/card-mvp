import { auth, validatePassword, checkRateLimit } from './authConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export const signUp = async (email: string, password: string) => {
  if (!validatePassword(password)) {
    throw new Error('Password must be at least 8 characters long and include uppercase, lowercase, number and special character');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  if (!checkRateLimit(email)) {
    throw new Error('Too many failed attempts. Please try again later.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};