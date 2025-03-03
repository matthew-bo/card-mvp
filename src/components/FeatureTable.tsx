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
  const hasData = currentCards.length > 0;

  if (!hasData) {
    return null; // Don't render anything if there's no data
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Comparison</h2>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
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
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Number of Cards
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {currentCards.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  {displayedRecommendedCards.length || "0"}
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Rewards Value
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${currentRewardsValue}/year
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  ${recommendedRewardsValue || 0}/year
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Annual Fees
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${currentAnnualFees}/year
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  ${recommendedAnnualFees || 0}/year
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Net Annual Value
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${currentNetValue}/year
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  ${recommendedNetValue || 0}/year
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Travel Protection
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {hasTravelProtection(currentCards) ? 'Included' : 'Not Available'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  {hasTravelProtection(displayedRecommendedCards) ? 'Included' : 'Not Available'}
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Airport Lounges
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {hasAirportLounges(currentCards) ? 'Available' : 'Not Available'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  {hasAirportLounges(displayedRecommendedCards) ? 'Available' : 'Not Available'}
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Purchase Protection
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {hasPurchaseProtection(currentCards) ? 'Included' : 'Not Available'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  {hasPurchaseProtection(displayedRecommendedCards) ? 'Included' : 'Not Available'}
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Foreign Transaction Fees
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {currentCards.some(card => !card.foreignTransactionFee) ? 'Some cards with no fees' : 'All cards have fees'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  {displayedRecommendedCards.some(card => !card.foreignTransactionFee) ? 'Some cards with no fees' : displayedRecommendedCards.length ? 'All cards have fees' : 'None'}
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Card Networks
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {[...new Set(currentCards.map(card => card.issuer))].join(', ') || 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
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