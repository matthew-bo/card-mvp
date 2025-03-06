'use client';

import React from 'react';
import { CreditCardDetails } from '@/types/cards';

interface RecommendedCard {
  card: CreditCardDetails;
  reason: string;
}

interface FeatureTableProps {
  currentCards: CreditCardDetails[];
  recommendedCards: RecommendedCard[];
}

const FeatureTable: React.FC<FeatureTableProps> = ({ currentCards = [], recommendedCards = [] }) => {
  // Only use the displayed recommended cards (up to 4 cards) for all calculations
  const displayedRecommendedCards = recommendedCards.slice(0, 4).map(rec => rec.card);
  
  // Helper functions for calculations
  const calculateAnnualFees = (cards: CreditCardDetails[]) => 
    cards.reduce((sum, card) => sum + (card.annualFee || 0), 0);

  const currentAnnualFees = calculateAnnualFees(currentCards);
  const recommendedAnnualFees = calculateAnnualFees(displayedRecommendedCards);

  // Calculate realistic rewards value based on category spending and reward rates
  const calculateRewardsValue = (cards: CreditCardDetails[]) => {
    if (cards.length === 0) return 0;
    
    // Simplified annual spend by category
    const annualSpend = {
      dining: 2400, // $200/month
      travel: 3000, // $250/month
      grocery: 6000, // $500/month
      gas: 1800, // $150/month
      entertainment: 1200, // $100/month
      other: 12000, // $1000/month
    };
    
    // Get best reward rate for each category
    const bestRates: Record<string, number> = {};
    
    for (const category of Object.keys(annualSpend)) {
      bestRates[category] = Math.max(
        ...cards.map(card => card.rewardRates[category as keyof typeof card.rewardRates] || 0)
      );
    }
    
    // Calculate rewards
    let totalRewards = 0;
    for (const [category, spend] of Object.entries(annualSpend)) {
      const rate = bestRates[category] || 0;
      totalRewards += spend * (rate / 100);
    }
    
    return Math.round(totalRewards);
  };

  const currentRewardsValue = currentCards.length > 0 ? calculateRewardsValue(currentCards) : 0;
  const recommendedRewardsValue = displayedRecommendedCards.length > 0 ? calculateRewardsValue(displayedRecommendedCards) : 0;

  // Net Value calculations
  const currentNetValue = currentRewardsValue - currentAnnualFees;
  const recommendedNetValue = recommendedRewardsValue - recommendedAnnualFees;

  // Feature check functions
  const hasTravelProtection = (cards: CreditCardDetails[]) => 
    cards.some(card => card.perks?.some(perk => perk.toLowerCase().includes('travel')));

  const hasAirportLounges = (cards: CreditCardDetails[]) =>
    cards.some(card => card.perks?.some(perk => perk.toLowerCase().includes('lounge')));

  const hasPurchaseProtection = (cards: CreditCardDetails[]) =>
    cards.some(card => card.perks?.some(perk => perk.toLowerCase().includes('purchase protection')));

  // Check if we should render the table
  const hasData = currentCards.length > 0 || recommendedCards.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Comparison</h2>
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">Add cards or generate recommendations to see a comparison</p>
        </div>
      </div>
    );
  }

  // Calculate value difference for highlighting improvements
  const rewardsImprovement = recommendedRewardsValue - currentRewardsValue;
  const netValueImprovement = recommendedNetValue - currentNetValue;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Portfolio Comparison</h2>
      
      {/* Key metrics summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm font-medium text-blue-800 mb-1">Annual Rewards Value</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-blue-900">${recommendedRewardsValue}</p>
            {rewardsImprovement > 0 && (
              <span className="ml-2 text-sm font-medium text-green-600">
                +${rewardsImprovement}
              </span>
            )}
          </div>
          <p className="text-xs text-blue-600 mt-1">Based on typical spending</p>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <p className="text-sm font-medium text-indigo-800 mb-1">Annual Fees</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-indigo-900">${recommendedAnnualFees}</p>
            {currentAnnualFees > recommendedAnnualFees && (
              <span className="ml-2 text-sm font-medium text-green-600">
                -${currentAnnualFees - recommendedAnnualFees}
              </span>
            )}
          </div>
          <p className="text-xs text-indigo-600 mt-1">Total yearly fees</p>
        </div>
        
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
          <p className="text-sm font-medium text-emerald-800 mb-1">Net Annual Value</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-emerald-900">${recommendedNetValue}</p>
            {netValueImprovement > 0 && (
              <span className="ml-2 text-sm font-medium text-green-600">
                +${netValueImprovement}
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-600 mt-1">Rewards minus annual fees</p>
        </div>
      </div>
      
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Portfolio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended Portfolio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Number of Cards
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {currentCards.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  {displayedRecommendedCards.length || "0"}
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Rewards Value
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  ${currentRewardsValue}/year
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  ${recommendedRewardsValue || 0}/year
                  {rewardsImprovement > 0 && (
                    <span className="ml-2 text-xs text-green-600">+${rewardsImprovement}</span>
                  )}
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Annual Fees
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  ${currentAnnualFees}/year
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  ${recommendedAnnualFees || 0}/year
                  {currentAnnualFees > recommendedAnnualFees && (
                    <span className="ml-2 text-xs text-green-600">-${currentAnnualFees - recommendedAnnualFees}</span>
                  )}
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Net Annual Value
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  ${currentNetValue}/year
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  ${recommendedNetValue || 0}/year
                  {netValueImprovement > 0 && (
                    <span className="ml-2 text-xs text-green-600">+${netValueImprovement}</span>
                  )}
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Travel Protection
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {hasTravelProtection(currentCards) ? (
                    <span className="inline-flex items-center text-green-700">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Included
                    </span>
                  ) : 'Not Available'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  {hasTravelProtection(displayedRecommendedCards) ? (
                    <span className="inline-flex items-center text-green-700">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Included
                    </span>
                  ) : 'Not Available'}
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Airport Lounges
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {hasAirportLounges(currentCards) ? (
                    <span className="inline-flex items-center text-green-700">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Available
                    </span>
                  ) : 'Not Available'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  {hasAirportLounges(displayedRecommendedCards) ? (
                    <span className="inline-flex items-center text-green-700">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Available
                    </span>
                  ) : 'Not Available'}
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Purchase Protection
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {hasPurchaseProtection(currentCards) ? (
                    <span className="inline-flex items-center text-green-700">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Included
                    </span>
                  ) : 'Not Available'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  {hasPurchaseProtection(displayedRecommendedCards) ? (
                    <span className="inline-flex items-center text-green-700">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Included
                    </span>
                  ) : 'Not Available'}
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Foreign Transaction Fees
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {currentCards.some(card => !card.foreignTransactionFee) ? 'Some cards with no fees' : 'All cards have fees'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  {displayedRecommendedCards.some(card => !card.foreignTransactionFee) ? 'Some cards with no fees' : displayedRecommendedCards.length ? 'All cards have fees' : 'None'}
                </td>
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Card Networks
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {[...new Set(currentCards.map(card => card.issuer))].join(', ') || 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  {displayedRecommendedCards.length ? [...new Set(displayedRecommendedCards.map(card => card.issuer))].join(', ') : 'None'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeatureTable;