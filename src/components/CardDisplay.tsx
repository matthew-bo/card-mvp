'use client';

import React, { useState } from 'react';
import { CreditCardDetails } from '@/types/cards';

interface CardDisplayProps {
  card: CreditCardDetails;
  onDelete?: (cardId: string) => void;
  onNotInterested?: (cardId: string) => void;
  highlight?: boolean;
}

// Get issuer colors function with improved color palette
const getIssuerColors = (issuer: string) => {
  const colors = {
    'Chase': { bg: 'bg-blue-900', text: 'text-blue-900', accent: 'bg-blue-500', gradient: 'from-blue-900 to-blue-800' },
    'American Express': { bg: 'bg-slate-800', text: 'text-slate-800', accent: 'bg-slate-500', gradient: 'from-slate-800 to-slate-700' },
    'Capital One': { bg: 'bg-red-900', text: 'text-red-900', accent: 'bg-red-500', gradient: 'from-red-900 to-red-800' },
    'Discover': { bg: 'bg-orange-600', text: 'text-orange-600', accent: 'bg-orange-400', gradient: 'from-orange-600 to-orange-500' },
    'Citi': { bg: 'bg-blue-600', text: 'text-blue-600', accent: 'bg-blue-400', gradient: 'from-blue-600 to-blue-500' },
    'Wells Fargo': { bg: 'bg-red-700', text: 'text-red-700', accent: 'bg-red-400', gradient: 'from-red-700 to-red-600' },
    'Bank of America': { bg: 'bg-red-800', text: 'text-red-800', accent: 'bg-red-500', gradient: 'from-red-800 to-red-700' },
    'default': { bg: 'bg-gray-800', text: 'text-gray-800', accent: 'bg-gray-500', gradient: 'from-gray-800 to-gray-700' }
  };
  return colors[issuer as keyof typeof colors] || colors.default;
};

// Convert point values to standardized dollar value
const getPointValue = (amount: number, type: "points" | "cashback"): { value: number; display: string } => {
  if (type === "cashback") {
    return { value: amount, display: `$${amount}` };
  }
  
  return { 
    value: amount * 0.015, 
    display: `${amount.toLocaleString()} pts (~$${(amount * 0.015).toFixed(0)})`
  };
};

export const CardDisplay: React.FC<CardDisplayProps> = ({ 
  card, 
  onDelete, 
  onNotInterested,
}) => {

  const [expanded, setExpanded] = useState(false);
  const colors = getIssuerColors(card.issuer);
  
  // Format reward rates for easy display
  const topRewardRates = Object.entries(card.rewardRates)
    .filter(([, rate]) => rate > 0)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 3);

  // Format signup bonus
  const formattedBonus = card.signupBonus 
    ? getPointValue(card.signupBonus.amount, card.signupBonus.type)
    : null;

  // Credit score badge styling
  const creditScoreColor = 
    card.creditScoreRequired === 'excellent' ? 'bg-emerald-100 text-emerald-800' :
    card.creditScoreRequired === 'good' ? 'bg-blue-100 text-blue-800' :
    card.creditScoreRequired === 'fair' ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800';
  
  // Delete handler
  const handleDelete = () => {
    if (onDelete) {
      onDelete(card.id);
    }
  };

  return (
    <div className="relative group h-full">
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
            <div className="group/tooltip">
              <button
                onClick={handleDelete}
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
              <div className="absolute right-0 -bottom-7 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Remove card
              </div>
            </div>
          )}
          
          {onNotInterested && (
            <div className="group/tooltip">
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
              <div className="absolute right-0 -bottom-7 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Not interested
              </div>
            </div>
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
                <div key={category} className="flex items-center text-sm">
                  <div className={`w-2 h-2 rounded-full ${colors.accent} mr-2 flex-shrink-0`}></div>
                  <span className="text-gray-700 capitalize truncate">{category}</span>
                  <span className={`ml-auto font-medium ${colors.text}`}>
                    {rate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="my-3 border-t border-gray-100"></div>
          
          {/* Sign-up Bonus */}
          {card.signupBonus && (
            <div className="mb-3">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Sign-up Bonus</h4>
              <p className={`text-sm font-medium ${colors.text}`}>
                {formattedBonus?.display}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                after ${card.signupBonus.spendRequired.toLocaleString()} spend in {card.signupBonus.timeframe} months
              </p>
            </div>
          )}
          
          {/* Credit Score Badge */}
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full ${creditScoreColor}`}>
              {card.creditScoreRequired.charAt(0).toUpperCase() + card.creditScoreRequired.slice(1)}
            </span>
            
            {/* Expand/Collapse Button */}
            <button 
              className="text-xs text-gray-500 hover:text-gray-700 underline"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Show less" : "Show more"}
            >
              {expanded ? "Less" : "More"}
            </button>
          </div>
          
          {/* Expanded Content */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 animate-fadeIn">
              {/* Foreign Transaction Fee */}
              <div className="flex items-center mt-2 text-sm">
                <span className="text-gray-600">Foreign Transaction Fee:</span>
                <span className="ml-auto font-medium">
                  {card.foreignTransactionFee ? 'Yes' : 'None'}
                </span>
              </div>
              
              {/* Perks List */}
              {card.perks.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Top Perks</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {card.perks.slice(0, 3).map((perk, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-1">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                    {card.perks.length > 3 && (
                      <li className="text-xs text-gray-500">+{card.perks.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};