import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Development environment setup
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  Promise.all([
    import('firebase/auth'),
    import('firebase/firestore'),
    import('firebase/storage')
  ]).then(([{ connectAuthEmulator }, { connectFirestoreEmulator }, { connectStorageEmulator }]) => {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  }).catch(console.error);
}

// Error handling for initialization
if (!app) throw new Error('Firebase app initialization failed');
if (!auth) throw new Error('Firebase auth initialization failed');
if (!db) throw new Error('Firebase Firestore initialization failed');
if (!storage) throw new Error('Firebase storage initialization failed');

export const FIREBASE_COLLECTIONS = {
  CREDIT_CARDS: 'credit_cards',
  USER_CARDS: 'user_cards',
  USER_PREFERENCES: 'user_preferences',
  EXPENSES: 'expenses'
};


// Monitoring setup
//if (typeof window !== 'undefined') {
//  app.automaticDataCollectionEnabled = true;

  // Monitor authentication state changes
// auth.onAuthStateChanged((user) => {
//    MonitoringService.logEvent({
 //     type: 'auth_state_change',
 //     severity: 'info',
 //     message: user ? 'User signed in' : 'User signed out',
 //     metadata: user ? { userId: user.uid } : undefined
 //   });
 // });
//}


//type DbFunction = (...parameters: unknown[]) => unknown;

//const monitoredDb = new Proxy(db, {
 // get(target, prop: string | symbol) {
 //   const original = target[prop as keyof typeof target];
//    if (typeof original === 'function') {
  //    return function (...parameters: unknown[]) {
    //    const startTime = performance.now();
      //  const result = (original as DbFunction).apply(target, parameters);
        //
        //if (result instanceof Promise) {
          //return result.finally(() => {
            //PerformanceMonitor.trackOperation(`firestore_${String(prop)}`, startTime);
//          });
  //      }
        
    //    PerformanceMonitor.trackOperation(`firestore_${String(prop)}`, startTime);
      //  return result;
  //    };
    //}
   // return original;
  //}
//});

export { app, db, auth, storage };