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
  // Total Rewards Value calculations (you can adjust these values)
  const currentRewardsValue = currentCards.length > 0 ? 1245 : 0;
  const recommendedRewardsValue = 1875;

  // Annual Fees calculations
  const calculateAnnualFees = (cards: CreditCardDetails[]) => 
    cards.reduce((sum, card) => sum + (card.annualFee || 0), 0);

  const currentAnnualFees = calculateAnnualFees(currentCards);
  const recommendedAnnualFees = calculateAnnualFees(recommendedCards.map(rec => rec.card));

  // Net Value calculations
  const currentNetValue = currentRewardsValue - currentAnnualFees;
  const recommendedNetValue = recommendedRewardsValue - recommendedAnnualFees;

  const hasTravelProtection = (cards: CreditCardDetails[]) => 
    cards.some(card => card.perks?.some(perk => perk.toLowerCase().includes('travel')));

  const hasAirportLounges = (cards: CreditCardDetails[]) =>
    cards.some(card => card.perks?.some(perk => perk.toLowerCase().includes('lounge')));

  const hasPurchaseProtection = (cards: CreditCardDetails[]) =>
    cards.some(card => card.perks?.some(perk => perk.toLowerCase().includes('purchase protection')));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Portfolio Comparison</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Portfolio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Portfolio</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Number of Cards</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{currentCards.length}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{recommendedCards.length}</td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Rewards Value</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${currentRewardsValue}/year</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">${recommendedRewardsValue}/year</td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Annual Fees</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${currentAnnualFees}/year</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">${recommendedAnnualFees}/year</td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Net Annual Value</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${currentNetValue}/year</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">${recommendedNetValue}/year</td>
            </tr>

            {/* Rest of your rows remain the same */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeatureTable;