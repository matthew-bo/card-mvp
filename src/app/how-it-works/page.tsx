'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CardBackground from '@/components/CardBackground';
import Navigation from '@/components/Navigation';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <div className="relative px-8 py-28 md:py-40 max-w-7xl mx-auto">
        {/* Background Credit Card */}
        <CardBackground />
        
        {/* Main Content */}
        <motion.div 
          className="max-w-3xl relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Find your perfect credit card match
          </h1>
          <p className="mt-8 text-xl text-gray-600 leading-relaxed">
            Our algorithm analyzes your spending patterns to recommend the optimal credit cards for maximizing rewards and benefits.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-5">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                href="/recommender" 
                className="block px-8 py-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 text-lg font-medium transition-colors"
              >
                Start optimizing
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <a 
                href="#how-it-works" 
                className="block px-8 py-4 border border-gray-300 text-gray-600 text-center rounded-md hover:bg-gray-100 text-lg font-medium transition-colors"
              >
                Learn how it works
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* How It Works Section (Integrated from how-it-works page) */}
      <div id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">How Stoid Works</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Our intelligent recommendation engine helps you find the perfect credit cards for your spending patterns
            </p>
          </div>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"></div>
            
            {/* Steps */}
            <div className="space-y-20 md:space-y-28 relative">
              {steps.map((step, i) => (
                <motion.div 
                  key={i}
                  className="md:grid md:grid-cols-2 md:gap-16 items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div className={`mb-10 md:mb-0 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
                    <div className="bg-white p-8 rounded-lg shadow-sm relative">
                      {/* Step number */}
                      <div className="absolute top-0 left-1/2 md:left-auto md:right-0 md:top-1/2 transform -translate-y-1/2 -translate-x-1/2 md:translate-x-1/2 md:-right-4 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md z-10">
                        {i + 1}
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mr-5 p-3 rounded-full bg-blue-100 text-blue-600">
                          {step.icon}
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                          <p className="text-lg text-gray-600 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`hidden md:block ${i % 2 === 1 ? 'md:order-1' : ''}`}>
                    {/* Illustrations for each step */}
                    <div className="bg-gray-50 rounded-lg border border-gray-100 shadow-sm flex items-center justify-center p-10 h-80">
                      {getIllustration(i)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <p className="text-xl text-gray-600 mb-8">Ready to find your perfect credit card match?</p>
            <Link 
              href="/recommender" 
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg font-medium transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </div>

      {/* Company Background Section */}
      <motion.div 
        className="px-8 py-20 bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About Stoid</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Stoid was founded with a simple mission: to help people maximize the value of their credit cards. 
                Our proprietary algorithm analyzes spending patterns and preferences to recommend the perfect card 
                combination for each individual.
              </p>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Unlike other comparison sites, we don&apos;t just show you the highest commission cards. We focus on 
                finding the right cards for your unique situation, optimizing for long-term value and complementary benefits.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <motion.div 
                className="w-full max-w-md h-72 bg-white rounded-lg flex items-center justify-center p-8 shadow-sm border border-gray-100"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                transition={{ duration: 0.2 }}
              >
                <img 
                  src="/company-illustration.svg" 
                  alt="Company mission" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback if image is missing
                    e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6" /><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="%236b7280">Our Mission</text></svg>`;
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="px-8 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Why Choose Stoid</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Personalized Recommendations",
                description: "Get card recommendations based on your unique spending patterns and preferences.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                )
              },
              {
                title: "Portfolio Optimization",
                description: "Maximize rewards by finding the perfect combination of complementary cards.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )
              },
              {
                title: "Long-Term Value",
                description: "Focus on sustained benefits beyond signup bonuses for lasting rewards.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="bg-white p-7 rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + (i * 0.1) }}
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Stoid</h3>
            <p className="mt-2 text-base text-gray-300">Optimize your credit card rewards</p>
          </div>
          <div className="mt-10 md:mt-0 grid grid-cols-2 md:grid-cols-3 gap-10">
            <div>
              <h4 className="text-base font-semibold mb-4">Product</h4>
              <div className="mt-4 space-y-3">
                <Link href="/recommender" className="block text-base text-gray-300 hover:text-white">Recommender</Link>
                <Link href="#how-it-works" className="block text-base text-gray-300 hover:text-white">How It Works</Link>
              </div>
            </div>
            <div>
              <h4 className="text-base font-semibold mb-4">Company</h4>
              <div className="mt-4 space-y-3">
                <Link href="/about" className="block text-base text-gray-300 hover:text-white">About</Link>
                <Link href="/blog" className="block text-base text-gray-300 hover:text-white">Blog</Link>
              </div>
            </div>
            <div>
              <h4 className="text-base font-semibold mb-4">Legal</h4>
              <div className="mt-4 space-y-3">
                <Link href="/privacy" className="block text-base text-gray-300 hover:text-white">Privacy</Link>
                <Link href="/terms" className="block text-base text-gray-300 hover:text-white">Terms</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 max-w-7xl mx-auto border-t border-gray-800 pt-8">
          <p className="text-base text-gray-400">© {new Date().getFullYear()} Stoid. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Steps data
const steps = [
  {
    title: "Add Your Expenses",
    description: "Track your monthly spending across different categories like dining, travel, and groceries.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    title: "Add Your Current Cards",
    description: "Tell us which credit cards you already have so we can find complementary options.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
  {
    title: "Set Your Preferences",
    description: "Tell us what you value most: cashback, travel rewards, perks, or building credit.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    )
  },
  {
    title: "Get Personalized Recommendations",
    description: "Our algorithm analyzes your data to recommend the optimal credit card portfolio.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

// Function to render illustrations
function getIllustration(stepIndex: number) {
  // Replace these with actual illustrations or better placeholders
  const illustrations = [
    // Step 1: Expense Tracking
    <svg key="expense" className="w-full h-full text-blue-600 opacity-50" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 5v2h-4V5h4M9 5v6H5V5h4m10 8v6h-4v-6h4M9 17v2H5v-2h4M21 3h-8v6h8V3zM11 3H3v10h8V3zm10 8h-8v10h8V11zm-10 4H3v6h8v-6z"/>
    </svg>,
    
    // Step 2: Card Addition
    <svg key="cards" className="w-full h-full text-blue-600 opacity-50" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
    </svg>,
    
    // Step 3: Preferences
    <svg key="preferences" className="w-full h-full text-blue-600 opacity-50" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>,
    
    // Step 4: Recommendations
    <svg key="recommendations" className="w-full h-full text-blue-600 opacity-50" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 15.5h-1.5V14h-1v3H8v-3H7v4.5H5.5v-5c0-.55.45-1 1-1H11c.55 0 1 .45 1 1v5zm3.5 0H14v-6h3.5c.55 0 1 .45 1 1V16c0 .55-.45 1-1 1h-2v1.5zm-1-4.5H17v1.5h-2.5V14zm8-3h-6.5v1.5H16V17h1.5v-4.5H19V14h1.5v-3c0-.55-.45-1-1-1zm-15 0c-.55 0-1 .45-1 1v5H5v-3.5h3v-1H5V12h5V8.5H3.5z"/>
    </svg>
  ];
  
  return illustrations[stepIndex] || null;
}