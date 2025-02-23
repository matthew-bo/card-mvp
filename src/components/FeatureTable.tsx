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
  // Helper functions for calculations
  const calculateAnnualFees = (cards: CreditCardDetails[]) => 
    cards.reduce((sum, card) => sum + (card.annualFee || 0), 0);

  const currentAnnualFees = calculateAnnualFees(currentCards);
  const recommendedAnnualFees = calculateAnnualFees(recommendedCards.map(rec => rec.card));

  // Total Rewards Value calculations
  const currentRewardsValue = currentCards.length > 0 ? 1245 : 0;
  const recommendedRewardsValue = 1875;

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
                  {recommendedCards.length}
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
                  ${recommendedRewardsValue}/year
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
                  ${recommendedAnnualFees}/year
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
                  ${recommendedNetValue}/year
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
                  {hasTravelProtection(recommendedCards.map(rec => rec.card)) ? 'Included' : 'Not Available'}
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
                  {hasAirportLounges(recommendedCards.map(rec => rec.card)) ? 'Available' : 'Not Available'}
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
                  {hasPurchaseProtection(recommendedCards.map(rec => rec.card)) ? 'Included' : 'Not Available'}
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
                  {recommendedCards.some(rec => !rec.card.foreignTransactionFee) ? 'Some cards with no fees' : 'All cards have fees'}
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
                  {[...new Set(recommendedCards.map(rec => rec.card.issuer))].join(', ')}
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Credit Score Range
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {[...new Set(currentCards.map(card => card.creditScoreRequired))].sort().join(' to ') || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  {[...new Set(recommendedCards.map(rec => rec.card.creditScoreRequired))].sort().join(' to ')}
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