import { 
  auth, 
  db 
} from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateEmail,
  GoogleAuthProvider  // Add this import
} from 'firebase/auth';
import { validatePassword, checkRateLimit } from './authConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FIREBASE_COLLECTIONS } from '@/lib/firebase';
import { UserCredential } from 'firebase/auth';


// Sign up with email and password
export const signUp = async (email: string, password: string, displayName: string) => {
  if (!validatePassword(password)) {
    throw new Error('Password must be at least 8 characters long and include uppercase, lowercase, number and special character');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    await updateProfile(userCredential.user, { displayName });
    
    // Send email verification
    await sendEmailVerification(userCredential.user);
    
    // Create user profile document
    await setDoc(doc(db, FIREBASE_COLLECTIONS.USER_PROFILES, userCredential.user.uid), {
      email,
      displayName,
      createdAt: new Date(),
      isEmailVerified: false,
      photoURL: null
    });
    
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  if (!checkRateLimit(email)) {
    throw new Error('Too many failed attempts. Please try again later.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google sign-in process");
    const provider = new GoogleAuthProvider();
    
    // Important: Force re-authentication
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Use a simple version first to isolate the issue
    return signInWithPopup(auth, provider)
      .then((result) => {
        console.log("Sign-in successful");
        return result.user;
      });
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

// Log out
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// Re-send email verification
export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
    } else {
      throw new Error('No user is signed in');
    }
  } catch (error) {
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (displayName: string, photoURL?: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user is signed in');
    
    const updateData: {displayName: string, photoURL?: string} = {displayName};
    if (photoURL) updateData.photoURL = photoURL;
    
    await updateProfile(user, updateData);
    
    // Update the profile in Firestore as well
    await setDoc(doc(db, FIREBASE_COLLECTIONS.USER_PROFILES, user.uid), 
      { displayName, photoURL },
      { merge: true }
    );
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Update email (requires re-authentication)
export const updateUserEmail = async (currentPassword: string, newEmail: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user is signed in');
    
    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update email
    await updateEmail(user, newEmail);
    
    // Send verification email
    await sendEmailVerification(user);
    
    // Update Firestore profile
    await setDoc(doc(db, FIREBASE_COLLECTIONS.USER_PROFILES, user.uid), 
      { email: newEmail, isEmailVerified: false },
      { merge: true }
    );
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Update password (requires re-authentication)
export const updateUserPassword = async (currentPassword: string, newPassword: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user is signed in');
    
    if (!validatePassword(newPassword)) {
      throw new Error('New password must be at least 8 characters long and include uppercase, lowercase, number and special character');
    }
    
    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (userId: string) => {
  try {
    const profileDoc = await getDoc(doc(db, FIREBASE_COLLECTIONS.USER_PROFILES, userId));
    if (profileDoc.exists()) {
      return profileDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};