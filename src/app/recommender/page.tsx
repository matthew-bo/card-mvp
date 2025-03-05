'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function RecommenderPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div className="p-4">Loading recommender...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Card Recommender</h1>
      <p>Welcome to the card recommender tool.</p>
      {user ? (
        <p className="mt-4">Logged in as: {user.email}</p>
      ) : (
        <p className="mt-4">Not logged in</p>
      )}
    </div>
  );
}