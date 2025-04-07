'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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