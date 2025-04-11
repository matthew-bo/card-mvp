'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';

export default function RecommenderNavigation() {
  const router = useRouter();
  const { user } = useAuth();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="bg-white shadow-sm py-4 px-6 mb-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button 
          onClick={() => navigateTo('/')}
          className="text-2xl font-bold text-gray-900"
        >
          Stoid
        </button>
        
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => navigateTo('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            Home
          </button>
          <button 
            onClick={() => navigateTo('/contact')}
            className="text-gray-600 hover:text-gray-900"
          >
            Contact
          </button>
          
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigateTo('/auth/login')}
                className="text-gray-600 hover:text-gray-900"
              >
                Log in
              </button>
              <button 
                onClick={() => navigateTo('/auth/signup')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}