'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function CardBackground() {
  return (
    <div className="absolute right-0 top-0 w-full h-full overflow-hidden pointer-events-none">
      <motion.div 
        className="absolute right-10 md:right-20 top-40 w-72 md:w-96 h-44 md:h-56 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
        initial={{ opacity: 0, y: 20, rotate: 12 }}
        animate={{ opacity: 0.25, y: 0, rotate: 12 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Card network logo */}
        <div className="absolute right-6 top-6 h-10 w-14 rounded-full bg-white opacity-60 flex items-center justify-center">
          <div className="h-6 w-8 rounded-full bg-yellow-400 opacity-80"></div>
        </div>
        
        {/* Card chip */}
        <div className="absolute left-6 top-8 w-12 h-8 bg-yellow-300 rounded-md opacity-60 flex items-center justify-center">
          <div className="w-10 h-6 border border-yellow-500 rounded-sm opacity-80 flex items-center justify-center">
            <div className="w-6 h-3 border border-yellow-500 rounded-sm"></div>
          </div>
        </div>
        
        {/* Card number */}
        <div className="absolute left-6 top-20 flex space-x-3">
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
        </div>
        
        {/* Card holder */}
        <div className="absolute left-6 bottom-12 h-3 w-32 bg-white opacity-60 rounded"></div>
        
        {/* Expiry date */}
        <div className="absolute right-6 bottom-12 h-3 w-10 bg-white opacity-60 rounded"></div>
      </motion.div>
      
      <motion.div 
        className="absolute right-48 md:right-60 top-60 md:top-80 w-64 md:w-80 h-40 md:h-48 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg"
        initial={{ opacity: 0, y: 20, rotate: -5 }}
        animate={{ opacity: 0.2, y: 0, rotate: -5 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        {/* Card chip */}
        <div className="absolute left-6 top-8 w-12 h-8 bg-yellow-300 rounded-md opacity-60 flex items-center justify-center">
          <div className="w-10 h-6 border border-yellow-500 rounded-sm opacity-80 flex items-center justify-center">
            <div className="w-6 h-3 border border-yellow-500 rounded-sm"></div>
          </div>
        </div>
        
        {/* Card number */}
        <div className="absolute left-6 top-20 flex space-x-3">
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
        </div>
        
        {/* Card holder */}
        <div className="absolute left-6 bottom-8 h-3 w-32 bg-white opacity-60 rounded"></div>
        
        {/* Network logo */}
        <div className="absolute right-6 top-6 h-8 w-12 rounded-full bg-white opacity-60 flex items-center justify-center">
          <div className="h-5 w-7 rounded-full bg-red-500 opacity-80"></div>
        </div>
      </motion.div>
      
      {/* Third card in background */}
      <motion.div 
        className="absolute right-20 md:right-32 top-80 md:top-96 w-56 md:w-72 h-36 md:h-44 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg"
        initial={{ opacity: 0, y: 20, rotate: 8 }}
        animate={{ opacity: 0.15, y: 0, rotate: 8 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      >
        {/* Card elements for third card */}
        <div className="absolute right-6 top-6 h-8 w-12 rounded-full bg-white opacity-60 flex items-center justify-center">
          <div className="h-5 w-7 rounded-full bg-blue-500 opacity-80"></div>
        </div>
        
        <div className="absolute left-6 top-8 w-12 h-8 bg-yellow-300 rounded-md opacity-60"></div>
        
        <div className="absolute left-6 top-20 flex space-x-3">
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
          <div className="h-3 w-8 bg-white opacity-60 rounded"></div>
        </div>
      </motion.div>
    </div>
  );
}