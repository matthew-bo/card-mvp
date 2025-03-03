'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/PageTransition';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <PageTransition>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Blog</h1>
          <p className="text-gray-600">Coming soon! Our blog will feature insights on credit card optimization and financial tips.</p>
        </div>
      </PageTransition>
    </div>
  );
}