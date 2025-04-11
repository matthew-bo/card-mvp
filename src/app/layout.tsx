'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';
import { useEffect, useState } from 'react';
import { FirebaseProvider } from '@/contexts/FirebaseContext';
import { AuthProvider } from '@/contexts/AuthContext';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

function ErrorDisplay({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-500 text-center">
        <h2 className="text-2xl font-bold mb-4">Error Initializing Firebase</h2>
        <p>{error.message}</p>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);
  const [firebaseError, setFirebaseError] = useState<Error | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFirebaseError = (error: Error) => {
    console.error('Firebase error:', error);
    setFirebaseError(error);
  };

  if (!isClient) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <LoadingSpinner />
        </body>
      </html>
    );
  }

  if (firebaseError) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <ErrorDisplay error={firebaseError} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <FirebaseProvider onError={handleFirebaseError}>
          <AuthProvider>
            <Providers>
              {children}
            </Providers>
          </AuthProvider>
        </FirebaseProvider>
        <SearchProviderWrapper />
      </body>
    </html>
  );
}