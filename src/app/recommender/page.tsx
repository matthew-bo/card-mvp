'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecommenderPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/recommender/simple');
  }, [router]);

  return null;
}