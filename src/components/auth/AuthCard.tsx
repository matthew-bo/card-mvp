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
    <div className={`w-full ${maxWidth} space-y-8 p-8 bg-white rounded-lg shadow-lg border border-gray-100`}>
      <div>
        <Link href="/" className="inline-block mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Stoid</h1>
          </div>
        </Link>
        <h2 className="text-3xl font-bold text-center text-gray-900 mt-6">{title}</h2>
      </div>
      
      {children}
      
      {footer && (
        <div className="pt-6 text-base text-center border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default AuthCard;