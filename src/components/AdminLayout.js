'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { isAdmin } from '@/utils/adminConfig';

export const AdminLayout = ({ children }) => {
  const router = useRouter();
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user || !isAdmin(user.email)) {
      router.push('/');
    }
  }, [user, router]);

  if (!user || !isAdmin(user.email)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </div>
    </div>
  );
}; 