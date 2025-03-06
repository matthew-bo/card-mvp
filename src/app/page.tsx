'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CardBackground from '@/components/CardBackground';
import Navigation from '@/components/Navigation';

export default function LandingPage() {
  // Steps from how-it-works page
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <div className="relative px-6 py-24 md:py-32 max-w-7xl mx-auto">
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
          <p className="mt-6 text-xl text-gray-600">
            <p>Our algorithm analyzes the user&apos;s spending patterns to recommend the optimal credit cards for maximizing rewards and benefits.</p>
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                href="/recommender" 
                className="block px-8 py-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 font-medium transition-colors"
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
                className="block px-8 py-4 border border-gray-300 text-gray-600 text-center rounded-md hover:bg-gray-100 font-medium transition-colors"
              >
                Learn how it works
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Company Background Section */}
      <motion.div 
        className="px-6 py-16 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900">About Stoid</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-gray-600">
                Stoid was founded with a simple mission: to help people maximize the value of their credit cards. 
                Our proprietary algorithm analyzes spending patterns and preferences to recommend the perfect card 
                combination for each individual.
              </p>
              <p className="mt-4 text-gray-600">
                Unlike other comparison sites, we don&apos;t just show you the highest commission cards. We focus on 
                finding the right cards for your unique situation, optimizing for long-term value and complementary benefits.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <motion.div 
                className="w-full max-w-md h-64 bg-gradient-to-br from-blue-50 to-gray-100 rounded-lg flex items-center justify-center p-8 shadow-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-full h-full text-blue-600 opacity-30" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                </svg>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="px-6 py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Why Choose Stoid</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Personalized Recommendations",
                description: "Get card recommendations based on your unique spending patterns and preferences.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                )
              },
              {
                title: "Portfolio Optimization",
                description: "Maximize rewards by finding the perfect combination of complementary cards.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )
              },
              {
                title: "Long-Term Value",
                description: "Focus on sustained benefits beyond signup bonuses for lasting rewards.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="bg-white p-6 rounded-lg shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + (i * 0.1) }}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section - Now positioned after the Features Section */}
      <div id="how-it-works" className="bg-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Stoid Works</h2>
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
      </div>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Stoid</h3>
            <p className="mt-2 text-sm text-gray-600">Optimize your credit card rewards</p>
          </div>
          <div className="mt-8 md:mt-0 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Product</h4>
              <div className="mt-4 space-y-2">
                <Link href="/recommender" className="block text-sm text-gray-600 hover:text-gray-900">Recommender</Link>
                <a href="#how-it-works" className="block text-sm text-gray-600 hover:text-gray-900">Features</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Company</h4>
              <div className="mt-4 space-y-2">
                <Link href="#" className="block text-sm text-gray-600 hover:text-gray-900">About</Link>
                <Link href="/blog" className="block text-sm text-gray-600 hover:text-gray-900">Blog</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
              <div className="mt-4 space-y-2">
                <Link href="/privacy" className="block text-sm text-gray-600 hover:text-gray-900">Privacy</Link>
                <Link href="/terms" className="block text-sm text-gray-600 hover:text-gray-900">Terms</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 max-w-7xl mx-auto border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} Stoid. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}