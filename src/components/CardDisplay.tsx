'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';

// Add CreditCardDetails interface
interface CreditCardDetails {
  id: string;
  name: string;
  issuer: string;
  rewardRates: { 
    dining: number;
    travel: number;
    grocery: number;
    gas: number;
    entertainment: number;
    rent: number;
    other: number;
  };
  annualFee: number;
  creditScoreRequired: "poor" | "fair" | "good" | "excellent";
  perks: string[];
  signupBonus?: {
    amount: number;
    type: "points" | "cashback";
    spendRequired: number;
    timeframe: number;
    description: string;
  };
  foreignTransactionFee: boolean;
  categories: string[];
  description: string;
}

// Add the getIssuerColors function
const getIssuerColors = (issuer: string) => {
  const colors = {
    'Chase': { bg: 'bg-blue-900', text: 'text-blue-900', accent: 'bg-blue-500' },
    'American Express': { bg: 'bg-slate-800', text: 'text-slate-800', accent: 'bg-slate-500' },
    'Capital One': { bg: 'bg-red-900', text: 'text-red-900', accent: 'bg-red-500' },
    'Discover': { bg: 'bg-orange-600', text: 'text-orange-600', accent: 'bg-orange-400' },
    'default': { bg: 'bg-gray-800', text: 'text-gray-800', accent: 'bg-gray-500' }
  };
  return colors[issuer as keyof typeof colors] || colors.default;
};

interface CardDisplayProps {
  card: CreditCardDetails;
  onDelete?: (cardId: string) => void;
  isRecommended?: boolean;
}


const CardDisplay: React.FC<CardDisplayProps> = ({ card, onDelete, isRecommended = false }) => {
    const { user } = useAuth();
    const colors = getIssuerColors(card.issuer);
  
    return (
        <div className="relative group">
        <div className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Card Initials Circle */}
            <div className={`absolute top-4 right-4 w-12 h-12 rounded-full ${colors.bg} bg-opacity-10 flex items-center justify-center z-10`}>
            <span className={`text-xs font-semibold ${colors.text}`}>
                {card.issuer.split(' ').map((word: string) => word[0]).join('')}
            </span>
            </div>

        {/* Delete Button - Enhanced visibility and conditional rendering */}
        {onDelete && user && (
            <button
                onClick={() => onDelete(card.id)}
                className="absolute top-2 left-2 p-2 rounded-full bg-white shadow-sm border border-gray-200 
                        text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 
                        transition-all duration-200 z-20"
                aria-label="Delete card"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                    strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
            </button>
        )}

        {/* Card Content - Fixed overflow issues */}
        <div className="space-y-4 pr-14"> {/* Added right padding to prevent text overlap */}
          {/* Card Name and Annual Fee */}
          <div>
            <h3 className={`text-lg font-semibold ${colors.text} mb-1 truncate`}>{card.name}</h3>
            <p className="text-sm text-gray-700">
              Annual Fee: ${card.annualFee}/year
            </p>
          </div>

          {/* Reward Rates */}
          <div className="space-y-2">
          {Object.entries(card.rewardRates)
            .filter(([, rate]) => rate > 0)
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .slice(0, 3)
            .map(([category, rate]) => (
              <div key={category} className="flex items-center text-sm">
                <div className={`w-1.5 h-1.5 rounded-full ${colors.accent} mr-2 flex-shrink-0`}></div>
                <span className="text-gray-700 capitalize truncate">{category}</span>
                <span className={`ml-auto font-medium ${colors.text} flex-shrink-0`}>
                  {rate}%
                </span>
              </div>
            ))}
        </div>

          {/* Sign-up Bonus */}
          {card.signupBonus && (
            <div className="pt-3 border-t border-gray-100">
              <p className={`text-sm font-medium ${colors.text}`}>
                {card.signupBonus.amount.toLocaleString()} {card.signupBonus.type}
              </p>
              <p className="text-xs text-gray-700 mt-0.5">
                after ${card.signupBonus.spendRequired.toLocaleString()} spend in {card.signupBonus.timeframe} months
              </p>
            </div>
          )}

          {/* Credit Score */}
          <div className="pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-700">Required Score: </span>
            <span className={`text-xs font-medium ${
              card.creditScoreRequired === 'excellent' ? 'text-emerald-600' :
              card.creditScoreRequired === 'good' ? 'text-blue-600' :
              card.creditScoreRequired === 'fair' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {card.creditScoreRequired.charAt(0).toUpperCase() + card.creditScoreRequired.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDisplay;