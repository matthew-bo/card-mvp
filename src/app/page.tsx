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
            Our algorithm analyzes the user&apos;s spending patterns to recommend the optimal credit cards for maximizing rewards and benefits.
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
              <Link 
                href="/how-it-works" 
                className="block px-8 py-4 border border-gray-300 text-gray-600 text-center rounded-md hover:bg-gray-100 font-medium transition-colors"
              >
                Learn how it works
              </Link>
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
                <Link href="/features" className="block text-sm text-gray-600 hover:text-gray-900">Features</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Company</h4>
              <div className="mt-4 space-y-2">
                <Link href="/about" className="block text-sm text-gray-600 hover:text-gray-900">About</Link>
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