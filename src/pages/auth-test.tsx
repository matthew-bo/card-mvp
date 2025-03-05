// src/pages/auth-test.tsx or src/app/auth-test/page.tsx
'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function AuthTest() {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const testGoogleSignIn = async () => {
    try {
      setResult('Starting sign-in...');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, provider);
      setResult(`Sign-in successful: ${userCredential.user.displayName}`);
    } catch (err: unknown) {
      console.error('Error:', err);
      // Handle the unknown type correctly
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError(`Unknown error occurred: ${String(err)}`);
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Auth Test Page</h1>
      <button 
        onClick={testGoogleSignIn}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Test Google Sign-In
      </button>
      
      {result && <p className="mt-4 text-green-600">{result}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
      
      <div className="mt-8">
        <h2 className="text-xl mb-2">Debug Info:</h2>
        <ul className="list-disc ml-6">
          <li>Firebase Auth Initialized: {auth ? 'Yes' : 'No'}</li>
          <li>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}</li>
          <li>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</li>
        </ul>
      </div>
    </div>
  );
}