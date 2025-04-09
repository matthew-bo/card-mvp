'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isAdmin } from '@/utils/adminConfig';
import { User } from 'firebase/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || !isAdmin(user as User)) {
      router.push('/');
    }
  }, [user, router]);

  if (!user || !isAdmin(user as User)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don&apos;t have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-lg font-semibold">Admin Dashboard</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}