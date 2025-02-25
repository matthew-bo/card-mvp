'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const CardSkeleton: React.FC = () => (
  <div className="border rounded-xl overflow-hidden bg-white shadow-sm h-full">
    {/* Card header */}
    <div className="bg-gray-100 p-4 relative">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-6 w-48" />
      <div className="absolute top-2 right-2 mt-8">
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
    
    {/* Card content */}
    <div className="p-4">
      <Skeleton className="h-3 w-20 mb-3" />
      
      {/* Reward rates */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center">
          <Skeleton className="w-2 h-2 rounded-full mr-2" />
          <Skeleton className="h-4 w-24 flex-grow" />
          <Skeleton className="h-4 w-8 ml-auto" />
        </div>
        <div className="flex items-center">
          <Skeleton className="w-2 h-2 rounded-full mr-2" />
          <Skeleton className="h-4 w-28 flex-grow" />
          <Skeleton className="h-4 w-8 ml-auto" />
        </div>
        <div className="flex items-center">
          <Skeleton className="w-2 h-2 rounded-full mr-2" />
          <Skeleton className="h-4 w-20 flex-grow" />
          <Skeleton className="h-4 w-8 ml-auto" />
        </div>
      </div>
      
      {/* Divider */}
      <div className="my-3 border-t border-gray-100"></div>
      
      {/* Sign-up bonus */}
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-4 w-36 mb-2" />
      <Skeleton className="h-3 w-48 mb-4" />
      
      {/* Credit score */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
    <Skeleton className="h-7 w-48 mb-6" />
    
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ExpensesSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-16" />
    </div>
    
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="w-6 h-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
    <Skeleton className="h-7 w-48 mb-4" />
    <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
      <Skeleton className="h-64 w-full max-w-xl mx-auto rounded-lg" />
    </div>
  </div>
);

export default {
  Card: CardSkeleton,
  Table: TableSkeleton,
  Expenses: ExpensesSkeleton,
  Chart: ChartSkeleton,
};