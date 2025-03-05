import React, { ReactNode } from 'react';
import Link from 'next/link';

interface AuthCardProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

const AuthCard: React.FC<AuthCardProps> = ({ 
  title, 
  children, 
  footer,
  maxWidth = 'max-w-md'
}) => {
  return (
    <div className={`w-full ${maxWidth} space-y-8 p-8 bg-white rounded-lg shadow`}>
      <div>
        <Link href="/" className="inline-block mb-6">
          <h1 className="text-2xl font-bold text-blue-600">Stoid</h1>
        </Link>
        <h2 className="text-3xl font-bold text-center text-gray-900">{title}</h2>
      </div>
      
      {children}
      
      {footer && (
        <div className="pt-4 text-sm text-center border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default AuthCard;