'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCardDetails } from '@/types/cards';
import Tooltip from './Tooltip';
import { CardSkeleton } from './SkeletonLoaders';

interface CardDisplayProps {
  card: CreditCardDetails & { 
    isLoading?: boolean;
    network?: string; 
  };
  onDelete?: (cardId: string) => void;
  onNotInterested?: (cardId: string) => void;
  highlight?: boolean;
}

// Utility to get appropriate colors for each card issuer
const getIssuerColors = (issuer: string) => {
  const colorMap: Record<string, {gradient: string, accent: string, text: string}> = {
    'Chase': {
      gradient: 'from-blue-600 to-blue-800',
      accent: 'bg-blue-400',
      text: 'text-blue-600'
    },
    'American Express': {
      gradient: 'from-emerald-600 to-emerald-900',
      accent: 'bg-emerald-400',
      text: 'text-emerald-600'
    },
    'Citi': {
      gradient: 'from-blue-400 to-blue-600',
      accent: 'bg-blue-300',
      text: 'text-blue-500'
    },
    'Capital One': {
      gradient: 'from-red-500 to-red-700',
      accent: 'bg-red-400',
      text: 'text-red-600'
    },
    'Discover': {
      gradient: 'from-orange-500 to-orange-700',
      accent: 'bg-orange-400',
      text: 'text-orange-600'
    },
    'Bank of America': {
      gradient: 'from-red-600 to-red-900',
      accent: 'bg-red-500',
      text: 'text-red-700'
    },
    'Wells Fargo': {
      gradient: 'from-yellow-600 to-red-600',
      accent: 'bg-yellow-500',
      text: 'text-yellow-700'
    },
    'US Bank': {
      gradient: 'from-blue-500 to-blue-700',
      accent: 'bg-blue-400',
      text: 'text-blue-600'
    }
  };
  
  return colorMap[issuer] || {
    gradient: 'from-gray-600 to-gray-800',
    accent: 'bg-gray-400',
    text: 'text-gray-700'
  };
};

// Format point/cashback value for display
const getPointValue = (amount: number, type: 'points' | 'cashback' | 'miles') => {
  if (type === 'cashback') {
    return {
      value: amount,
      display: `$${amount}`
    };
  } else {
    const label = type === 'miles' ? 'miles' : 'points';
    return {
      value: amount,
      display: `${amount.toLocaleString()} ${label}`
    };
  }
};

export const CardDisplay: React.FC<CardDisplayProps> = ({ 
  card, 
  onDelete, 
  onNotInterested,
}) => {
  const [expanded, setExpanded] = useState(false);
  const colors = getIssuerColors(card.issuer);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // More robust check for loading state
  const isLoading = Boolean(card.isLoading) || 
                   !card.name || 
                   card.name === 'Loading Card Details...' ||
                   card.issuer === 'Loading...';
  
  // Render skeleton UI while loading
  if (isLoading) {
    return <CardSkeleton />;
  }
  
  // Format reward rates for easy display
  const topRewardRates = Object.entries(card.rewardRates || {})
    .filter(([, rate]) => rate > 1) // Only show rates better than the base rate
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 4); // Show up to 4 top categories

  // Format signup bonus
  const formattedBonus = card.signupBonus 
    ? getPointValue(card.signupBonus.amount, card.signupBonus.type)
    : null;

  // Credit score badge styling
  const creditScoreColor = 
    !card.creditScoreRequired ? 'bg-gray-100 text-gray-800' :
    card.creditScoreRequired === 'excellent' ? 'bg-emerald-100 text-emerald-800' :
    card.creditScoreRequired === 'good' ? 'bg-blue-100 text-blue-800' :
    card.creditScoreRequired === 'fair' ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800';
    
  // Safe function to capitalize credit score
  const formatCreditScore = (score?: string) => {
    if (!score) return 'Unknown';
    return score.charAt(0).toUpperCase() + score.slice(1);
  };
  
  return (
    <motion.div 
      className="relative group h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      ref={cardRef}
    >
      {/* Card container */}
      <div className="h-full border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
        {/* Card Header */}
        <div className={`bg-gradient-to-r ${colors.gradient} p-4 pb-10 text-white relative`}>
          {/* Card Issuer */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider opacity-80">{card.issuer}</span>
          </div>
          
          {/* Card Name */}
          <h3 className="font-semibold text-lg leading-tight pr-4 break-words" title={card.name}>
            {card.name}
          </h3>
        </div>
        
        {/* Action Buttons - Repositioned to the bottom of the header */}
        <div className="absolute top-14 right-4 flex space-x-2">
          {onDelete && (
            <Tooltip content="Remove card" position="top">
              <button
                onClick={() => onDelete(card.id)}
                className="p-1.5 rounded-full bg-white shadow-sm border border-gray-200 text-gray-400 
                  hover:text-red-600 hover:bg-red-50 hover:border-red-200 
                  transition-all duration-200"
                aria-label="Delete card"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                  strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </Tooltip>
          )}
          
          {onNotInterested && (
            <Tooltip content="Not interested in this card" position="top">
              <button
                onClick={() => onNotInterested(card.id)}
                className="p-1.5 rounded-full bg-white shadow-sm border border-gray-200 text-gray-400 
                  hover:text-orange-500 hover:bg-orange-50 hover:border-orange-200 
                  transition-all duration-200"
                aria-label="Not interested in this card"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                  strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
              </button>
            </Tooltip>
          )}
        </div>
        
         {/* Annual Fee Badge */}
         <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-1 rounded-full bg-white bg-opacity-20 ${card.annualFee === 0 ? 'text-green-50' : 'text-white'}`}>
            {card.annualFee === 0 ? 'No Annual Fee' : `$${card.annualFee}/yr`}
          </span>
        </div>
        
        {/* Card Content */}
        <div className="p-4 flex-grow flex flex-col justify-between">
          {/* Reward Rates Section */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Top Rewards</h4>
            <div className="space-y-2">
              {topRewardRates.map(([category, rate]) => (
                <motion.div 
                  key={category} 
                  className="flex items-center text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`w-2 h-2 rounded-full ${colors.accent} mr-2 flex-shrink-0`}></div>
                  <span className="text-gray-700 capitalize truncate">{category}</span>
                  <span className={`ml-auto font-medium ${colors.text}`}>
                    {rate}%
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="my-3 border-t border-gray-100"></div>
          
          {/* Sign-up Bonus */}
          {card.signupBonus && (
            <div className="mb-3">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Sign-up Bonus</h4>
              <Tooltip 
                content={`Spend $${card.signupBonus.spendRequired.toLocaleString()} in ${card.signupBonus.timeframe} months to earn this bonus.`} 
                position="left"
              >
                <p className={`text-sm font-medium ${colors.text}`}>
                  {formattedBonus?.display}
                </p>
              </Tooltip>
              <p className="text-xs text-gray-600 mt-0.5">
                after ${card.signupBonus.spendRequired.toLocaleString()} spend in {card.signupBonus.timeframe} months
              </p>
            </div>
          )}
          
          {/* Credit Score Badge */}
          <div className="flex items-center justify-between">
            <Tooltip content={`This card typically requires a ${card.creditScoreRequired || 'unknown'} credit score.`} position="bottom">
              <span className={`text-xs px-2 py-1 rounded-full ${creditScoreColor}`}>
                {formatCreditScore(card.creditScoreRequired)}
              </span>
            </Tooltip>
            
            {/* Expand/Collapse Button */}
            <button 
              className="text-xs text-gray-500 hover:text-gray-700 underline"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Show less" : "Show more"}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </div>
          
          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div 
                className="mt-4 pt-3 border-t border-gray-100"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Foreign Transaction Fee */}
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Foreign Transaction Fee:</span>
                  <span className="font-medium">
                    {card.foreignTransactionFee !== undefined ? (card.foreignTransactionFee ? 'Yes' : 'None') : 'Unknown'}
                  </span>
                </div>
                
                {/* Card Network */}
                {card.network && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Network:</span>
                    <span className="font-medium capitalize">
                      {card.network}
                    </span>
                  </div>
                )}
                
                {/* Perks */}
                {card.perks && card.perks.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Key Perks</h4>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {card.perks.slice(0, 3).map((perk, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-3 h-3 text-green-500 mr-1 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default CardDisplay;