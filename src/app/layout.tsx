import React from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import Navigation from '@/components/Navigation';

export default function RecommenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}