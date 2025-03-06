'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: number; // in pixels
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  className?: string;
  showLabel?: boolean;
  labelPosition?: 'top' | 'right' | 'inside';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = 'bg-blue-600',
  backgroundColor = 'bg-gray-200',
  animated = true,
  className = '',
  showLabel = false,
  labelPosition = 'right'
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && labelPosition === 'top' && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">{normalizedProgress}%</span>
        </div>
      )}
      
      <div className="relative">
        <div 
          className={`w-full rounded-full ${backgroundColor}`} 
          style={{ height: `${height}px` }}
        >
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={animated ? { width: '0%' } : { width: `${normalizedProgress}%` }}
            animate={{ width: `${normalizedProgress}%` }}
            transition={{ duration: animated ? 1 : 0, ease: 'easeOut' }}
          />
        </div>
        
        {showLabel && labelPosition === 'inside' && normalizedProgress > 15 && (
          <div className="absolute inset-0 flex items-center justify-start px-2">
            <span className="text-xs font-medium text-white">{normalizedProgress}%</span>
          </div>
        )}
      </div>
      
      {showLabel && labelPosition === 'right' && (
        <div className="ml-2 text-xs font-medium text-gray-700">{normalizedProgress}%</div>
      )}
    </div>
  );
};

export default ProgressBar;