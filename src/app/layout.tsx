'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.testSkeletonUI = function() {
              const event = new CustomEvent('demo-skeleton-ui');
              window.dispatchEvent(event);
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <SearchProviderWrapper />
      </body>
    </html>
  );
}