'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Only run client-side
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add function to handle navigation with router
  const navigateTo = (href: string) => {
    setIsMobileMenuOpen(false);
    router.push(href);
  };

  // Don't render anything during SSR
  if (!mounted) {
    return <div className="h-16"></div>; // Placeholder with the same height as the nav
  }

  const navLinks = [
    { href: '/', label: 'Home', active: pathname === '/' },
    { href: '/recommender', label: 'Recommender', active: pathname === '/recommender' },
    { href: '/blog', label: 'Blog', active: pathname === '/blog' },
    { href: '/contact', label: 'Contact', active: pathname === '/contact' }
  ];

  // Function to handle sign out
  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <nav className={`sticky top-0 z-50 px-6 py-5 transition-all duration-200 ${isScrolled ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <div 
            onClick={() => navigateTo('/')}
            className="text-2xl font-bold text-gray-900 cursor-pointer"
          >
            Stoid
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.slice(1).map((link) => (
            <div
              key={link.href}
              onClick={() => navigateTo(link.href)}
              className={`${link.active 
                ? 'text-blue-600 font-medium' 
                : 'text-gray-600 hover:text-gray-900'} transition-colors cursor-pointer`}
            >
              {link.label}
            </div>
          ))}
          
          {/* Authentication Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Sign Out
              </div>
            ) : (
              <>
                <div
                  onClick={() => navigateTo('/auth/login')}
                  className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Log in
                </div>
                <div
                  onClick={() => navigateTo('/auth/signup')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Sign up
                </div>
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
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-20">
          <div className="px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <div
                key={link.href}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo(link.href);
                }}
                className={`block py-2 text-lg ${
                  link.active 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-600'
                } cursor-pointer`}
              >
                {link.label}
              </div>
            ))}
            <div className="pt-4 border-t border-gray-100">
              {user ? (
                <div
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block py-2 text-lg text-gray-600 cursor-pointer"
                >
                  Sign Out
                </div>
              ) : (
                <>
                  <div
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('/auth/login');
                    }}
                    className="block py-2 text-lg text-gray-600 cursor-pointer"
                  >
                    Log in
                  </div>
                  <div
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('/auth/signup');
                    }}
                    className="block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-center cursor-pointer"
                  >
                    Sign up
                  </div>
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