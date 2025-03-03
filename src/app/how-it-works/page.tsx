'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/PageTransition';
import Link from 'next/link';
import { motion } from 'framer-motion';

const steps = [
  {
    title: "Add Your Expenses",
    description: "Track your monthly spending across different categories like dining, travel, and groceries.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    title: "Add Your Current Cards",
    description: "Tell us which credit cards you already have so we can find complementary options.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
  {
    title: "Set Your Preferences",
    description: "Tell us what you value most: cashback, travel rewards, perks, or building credit.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    )
  },
  {
    title: "Get Personalized Recommendations",
    description: "Our algorithm analyzes your data to recommend the optimal credit card portfolio.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <PageTransition>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">How Stoid Works</h1>
            <p className="text-xl text-gray-600">
              Our intelligent recommendation engine helps you find the perfect credit cards for your spending patterns
            </p>
          </div>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"></div>
            
            {/* Steps */}
            <div className="space-y-16 md:space-y-24 relative">
              {steps.map((step, i) => (
                <motion.div 
                  key={i}
                  className="md:grid md:grid-cols-2 md:gap-16 items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div className={`mb-8 md:mb-0 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
                    <div className="bg-white p-8 rounded-lg shadow-sm relative">
                      {/* Step number */}
                      <div className="absolute top-0 left-1/2 md:left-auto md:right-0 md:top-1/2 transform -translate-y-1/2 -translate-x-1/2 md:translate-x-1/2 md:-right-4 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md z-10">
                        {i + 1}
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mr-4 p-2 rounded-full bg-blue-100 text-blue-600">
                          {step.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                          <p className="text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`hidden md:block ${i % 2 === 1 ? 'md:order-1' : ''}`}>
                    {/* Illustration placeholder */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-64 rounded-lg flex items-center justify-center p-8">
                      <div className="w-full h-full opacity-50 flex items-center justify-center">
                        {i === 0 && (
                          <svg className="w-32 h-32 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-2.7 0-5.8 1.29-6 2v1h12v-1c-.2-.71-3.3-2-6-2z"/>
                            <path d="M21.5 14.5A2.5 2.5 0 0 0 19 12h-2v-2c0-3.25-2.67-6-6-6-3.33 0-6 2.75-6 6v2H3c-1.38 0-2.5 1.12-2.5 2.5v7c0 1.38 1.12 2.5 2.5 2.5h18c1.38 0 2.5-1.12 2.5-2.5v-7zm-5-4.5v-2c0-2.21-1.79-4-4-4s-4 1.79-4 4v2h8zm5 11.5H2.5v-7h19v7z"/>
                          </svg>
                        )}
                        {i === 1 && (
                          <svg className="w-32 h-32 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                          </svg>
                        )}
                        {i === 2 && (
                          <svg className="w-32 h-32 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        )}
                        {i === 3 && (
                          <svg className="w-32 h-32 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 15.5h-1.5V14h-1v3H8v-3H7v4.5H5.5v-5c0-.55.45-1 1-1H11c.55 0 1 .45 1 1v5zm3.5 0H14v-6h3.5c.55 0 1 .45 1 1V16c0 .55-.45 1-1 1h-2v1.5zm-1-4.5H17v1.5h-2.5V14zm8-3h-6.5v1.5H16V17h1.5v-4.5H19V14h1.5v-3c0-.55-.45-1-1-1zm-15 0c-.55 0-1 .45-1 1v5H5v-3.5h3v-1H5V12h5V8.5H3.5z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-xl text-gray-600 mb-8">Ready to find your perfect credit card match?</p>
            <Link 
              href="/recommender" 
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}