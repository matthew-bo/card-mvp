// src/app/recommender/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function RecommenderPage() {
  const { user } = useAuth();
  
  // Simple loading state to prevent any issues during hydration
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Card Recommender</h1>
      {/* Your recommender UI components */}
    </div>
  );
}