import React from 'react';
import RecommenderNav from '@/components/RecommenderNav';

export default function RecommenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <RecommenderNav />
      <main>
        {children}
      </main>
    </div>
  );
}