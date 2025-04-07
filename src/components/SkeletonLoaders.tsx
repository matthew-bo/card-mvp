'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Helper for creating animated shimmer effect
const shimmer = {
  hidden: { x: -200, opacity: 0.5 },
  visible: { 
    x: 100, 
    opacity: 0.8,
    transition: {
      repeat: Infinity,
      repeatType: "mirror" as "mirror",
      duration: 1.5,
      ease: "easeInOut"
    }
  }
};

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const CardListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(count).fill(0).map((_, i) => (
        <CardSkeleton key={i} delay={i * 0.1} />
      ))}
    </div>
  );
};

export const CardSkeleton = ({ delay = 0 }: { delay?: number }) => {
  return (
    <motion.div 
      className="relative overflow-hidden rounded-xl border border-gray-200 h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.2 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent z-10"
        variants={shimmer}
        initial="hidden"
        animate="visible"
        style={{ animationDelay: `${delay}s` }}
      />
      <div className="bg-white h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-4 pb-10 relative">
          <div className="flex items-center justify-between mb-1">
            <div className="bg-gray-300/50 h-4 w-16 rounded"></div>
          </div>
          <div className="bg-gray-300/50 h-6 w-40 rounded mt-1"></div>
        </div>
        
        {/* Content */}
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <div className="bg-gray-200 h-3 w-24 rounded mb-3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mr-2"></div>
                  <div className="bg-gray-200 h-4 w-24 rounded"></div>
                  <div className="ml-auto bg-gray-200 h-4 w-10 rounded"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="my-3 border-t border-gray-100"></div>
          
          <div className="flex items-center justify-between">
            <div className="bg-gray-200 h-5 w-16 rounded-full"></div>
            <div className="bg-gray-200 h-4 w-12 rounded"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ExpenseListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-3 w-full">
      {Array(count).fill(0).map((_, i) => (
        <ExpenseItemSkeleton key={i} delay={i * 0.1} />
      ))}
    </div>
  );
};

export const ExpenseItemSkeleton = ({ delay = 0 }: { delay?: number }) => {
  return (
    <motion.div 
      className="relative rounded-lg border border-gray-200 p-3 overflow-hidden"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: delay * 0.15 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent z-10" 
        variants={shimmer}
        initial="hidden"
        animate="visible"
        style={{ animationDelay: `${delay}s` }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-200 h-10 w-10 rounded-full"></div>
          <div>
            <div className="bg-gray-200 h-4 w-32 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 w-20 rounded"></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-200 h-6 w-20 rounded"></div>
          <div className="bg-gray-200 h-8 w-8 rounded-full"></div>
        </div>
      </div>
    </motion.div>
  );
};

export const RecommendationSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="space-y-4 w-full">
      {Array(count).fill(0).map((_, i) => (
        <motion.div 
          key={i} 
          className="relative rounded-lg border border-gray-200 p-4 overflow-hidden"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent z-10"
            variants={shimmer}
            initial="hidden"
            animate="visible"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
          <div className="flex flex-col space-y-2">
            <div className="bg-gray-200 h-5 w-40 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 w-full max-w-md rounded"></div>
            <div className="bg-gray-200 h-3 w-full max-w-sm rounded"></div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="bg-gray-200 h-4 w-16 rounded-full"></div>
              <div className="bg-gray-200 h-4 w-16 rounded-full"></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <motion.div 
      className="space-y-4 w-full bg-white p-5 rounded-lg border border-gray-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-gray-200 h-6 w-40 rounded"></div>
      <div className="bg-gray-200 h-3 w-full max-w-md rounded"></div>
      
      <div className="space-y-4 mt-6">
        <div className="space-y-2">
          <div className="bg-gray-200 h-4 w-20 rounded"></div>
          <div className="bg-gray-200 h-10 w-full rounded"></div>
        </div>
        
        <div className="space-y-2">
          <div className="bg-gray-200 h-4 w-24 rounded"></div>
          <div className="bg-gray-200 h-10 w-full rounded"></div>
        </div>
        
        <div className="pt-4">
          <div className="bg-gray-200 h-10 w-32 rounded"></div>
        </div>
      </div>
    </motion.div>
  );
};

export const SearchResultsSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-3 w-full">
      {Array(count).fill(0).map((_, i) => (
        <motion.div 
          key={i} 
          className="p-3 border border-gray-200 rounded-lg flex items-center space-x-3 relative overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent z-10"
            variants={shimmer}
            initial="hidden"
            animate="visible"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
          <div className="flex-shrink-0 w-12 h-8 bg-gray-200 rounded"></div>
          <div className="flex-grow">
            <div className="bg-gray-200 h-4 w-32 rounded mb-1"></div>
            <div className="bg-gray-200 h-3 w-24 rounded"></div>
          </div>
          <div className="flex-shrink-0 bg-gray-200 h-8 w-8 rounded-full"></div>
        </motion.div>
      ))}
    </div>
  );
};

export const ContentSkeleton = () => {
  return (
    <div className="space-y-6 w-full">
      <CardListSkeleton count={3} />
      <ExpenseListSkeleton count={4} />
      <RecommendationSkeleton count={2} />
    </div>
  );
};

const SkeletonLoaders = {
  CardListSkeleton,
  CardSkeleton,
  ExpenseListSkeleton,
  ExpenseItemSkeleton,
  RecommendationSkeleton,
  FormSkeleton,
  SearchResultsSkeleton,
  ContentSkeleton
};

export default SkeletonLoaders;