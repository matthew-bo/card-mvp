'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { usePathname } from 'next/navigation';

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

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
    { href: '/review', label: 'Reviews', active: pathname.startsWith('/review') }, // Add this line
    { href: '/consultation', label: 'Consultation', active: pathname === '/consultation' },
    { href: '/blog', label: 'Blog', active: pathname === '/blog' },
    { href: '/contact', label: 'Contact', active: pathname === '/contact' }
  ];

  // Function to handle sign out
  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[999] px-6 py-5 transition-all duration-200 ${
      isScrolled ? 'bg-white shadow-sm' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">Stoid</Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={`${link.active 
                ? 'text-blue-600 font-medium' 
                : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              {link.label}
            </Link>
          ))}
          
          {/* Authentication Buttons */}
          <div className="flex items-center space-x-4">
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign Out
            </button>
            ) : (
              <>
                <Link 
                  href="/auth/login" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Log in
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle mobile menu"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu - Without framer-motion animations */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[998] bg-white pt-20">
          <div className="px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`block py-2 text-lg ${
                  link.active 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-100">
            {user ? (
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="block py-2 text-lg text-gray-600"
              >
                Sign Out
              </button>
            ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="block py-2 text-lg text-gray-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;