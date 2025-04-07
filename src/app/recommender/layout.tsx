import React from 'react';
import RecommenderNav from '@/components/RecommenderNav';
import ImprovementsButton from '@/components/ImprovementsButton';

export default function RecommenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <RecommenderNav />
      <ImprovementsButton />
      <main>
        {children}
      </main>
    </div>
  );
}