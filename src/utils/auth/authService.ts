// Create a safe wrapper to handle potential missing Firebase auth
const getSafeAuth = () => {
  try {
    // Try to import auth from firebase lib
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { auth } = require('@/lib/firebase');
    return auth;
  } catch (error) {
    console.warn('Firebase auth is not available:', error);
    return null;
  }
};

// Safe imports for Firebase auth functions
const getFirebaseAuthFunctions = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { 
      signInWithEmailAndPassword,
      signInWithPopup,
      GoogleAuthProvider,
      createUserWithEmailAndPassword,
      signOut
    } = require('firebase/auth');
    return {
      signInWithEmailAndPassword,
      signInWithPopup,
      GoogleAuthProvider,
      createUserWithEmailAndPassword,
      signOut
    };
  } catch (error) {
    console.warn('Firebase auth functions are not available:', error);
    return {
      signInWithEmailAndPassword: async () => { throw new Error('Firebase authentication not available'); },
      signInWithPopup: async () => { throw new Error('Firebase authentication not available'); },
      GoogleAuthProvider: function() { throw new Error('Firebase authentication not available'); },
      createUserWithEmailAndPassword: async () => { throw new Error('Firebase authentication not available'); },
      signOut: async () => { throw new Error('Firebase authentication not available'); }
    };
  }
};

const auth = getSafeAuth();
const {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut: firebaseSignOut
} = getFirebaseAuthFunctions();

export const signIn = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase auth is not initialized');
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase auth is not initialized');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signUp = async (email: string, password: string, displayName?: string) => {
  if (!auth) throw new Error('Firebase auth is not initialized');
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // If displayName was provided, we would update the user profile here
  // But we'll skip that for now since it's not essential for this fix
  return userCredential;
};

export const signOut = async () => {
  if (!auth) throw new Error('Firebase auth is not initialized');
  return firebaseSignOut(auth);
}; 