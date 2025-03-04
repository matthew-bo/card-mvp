import React from 'react';
import Navigation from '@/components/Navigation';

export default function RecommenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>
        {children}
      </main>
    </div>
  );
}