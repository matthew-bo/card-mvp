'use client';

import { ErrorBoundary } from 'react-error-boundary';
import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from './NotificationProvider';
import AuthErrorBoundary from './auth/AuthErrorBoundary';
import { FirebaseProvider } from '@/lib/contexts/FirebaseContext';

const fallbackRender = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => {
  return (
    <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="mb-4">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
      >
        Try again
      </button>
    </div>
  );
};

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <AuthErrorBoundary>
        <FirebaseProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </FirebaseProvider>
      </AuthErrorBoundary>
    </ErrorBoundary>
  );
} 