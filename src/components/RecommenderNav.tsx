'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Create a fallback auth context to ensure navigation works even if auth fails
const useAuthFallback = () => {
  try {
    // Try to import the real auth context
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuth } = require('@/contexts/AuthContext');
    return useAuth();
  } catch (error) {
    console.warn('Auth context not available, using fallback');
    // Fallback with default values that won't break the navigation
    return { user: null, loading: false };
  }
};

const RecommenderNav: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname() || '';
  const router = useRouter();
  // Use our fallback auth hook
  const { user, loading } = useAuthFallback();

  // Only run client-side
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't render anything during SSR
  if (!mounted) {
    return <div className="h-16"></div>; // Placeholder with the same height as the nav
  }

  const navLinks = [
    { href: '/', label: 'Home', active: pathname === '/' },
    { href: '/recommender', label: 'Recommender', active: pathname === '/recommender' },
    { href: '/review', label: 'Reviews', active: pathname.startsWith('/review') },
    { href: '/consultation', label: 'Consultation', active: pathname === '/consultation' },
    { href: '/blog', label: 'Blog', active: pathname === '/blog' },
    { href: '/contact', label: 'Contact', active: pathname === '/contact' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[999] px-6 py-5 transition-all duration-200 ${
      isScrolled ? 'bg-white shadow-sm' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="bg-blue-600 text-white font-bold text-xl rounded-md w-8 h-8 flex items-center justify-center mr-2">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">STOID</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-base font-medium transition-colors ${
                link.active ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Auth Links */}
          <div className="flex items-center ml-6 space-x-4">
            {!loading && (
              user ? (
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Profile
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-medium transition-colors ${
                  link.active ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Auth Links */}
            {!loading && (
              user ? (
                <Link
                  href="/profile"
                  className="text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default RecommenderNav; 