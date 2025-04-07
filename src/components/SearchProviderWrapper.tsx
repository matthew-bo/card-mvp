'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the search preloader
const SearchIndexPreloader = dynamic(
  () => import('@/components/SearchIndexPreloader')
);

export default function SearchProviderWrapper() {
  return (
    <Suspense fallback={null}>
      <SearchIndexPreloader />
    </Suspense>
  );
} 