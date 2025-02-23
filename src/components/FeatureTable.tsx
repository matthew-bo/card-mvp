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
  // Update helper functions to use CreditCardDetails
  const calculateSignupBonus = (cards: CreditCardDetails[]) => 
    cards.reduce((sum, card) => sum + (card.signupBonus?.amount || 0), 0);

  const calculateAnnualFees = (cards: CreditCardDetails[]) => 
    cards.reduce((sum, card) => sum + (card.annualFee || 0), 0);

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
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sign-up Bonus Value</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${calculateSignupBonus(currentCards)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                ${calculateSignupBonus(recommendedCards.map(rec => rec.card))}
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Number of Cards</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{currentCards.length}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{recommendedCards.length}</td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Rewards Value</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$1,245/year</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">$1,875/year</td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Annual Fees</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${calculateAnnualFees(currentCards)}/year
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                ${calculateAnnualFees(recommendedCards.map(rec => rec.card))}/year
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Net Annual Value</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$950/year</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">$1,480/year</td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Travel Protection</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {hasTravelProtection(currentCards) ? 'Included' : 'Not Available'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                {hasTravelProtection(recommendedCards.map(rec => rec.card)) ? 'Included' : 'Not Available'}
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Airport Lounges</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {hasAirportLounges(currentCards) ? 'Available' : 'Not Available'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                {hasAirportLounges(recommendedCards.map(rec => rec.card)) ? 'Available' : 'Not Available'}
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Purchase Protection</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {hasPurchaseProtection(currentCards) ? 'Included' : 'Not Available'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                {hasPurchaseProtection(recommendedCards.map(rec => rec.card)) ? 'Included' : 'Not Available'}
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Foreign Transaction Fees</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {currentCards.some(card => !card.foreignTransactionFee) ? 'Some cards with no fees' : 'All cards have fees'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                {recommendedCards.some(rec => !rec.card.foreignTransactionFee) ? 'Some cards with no fees' : 'All cards have fees'}
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Card Networks</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {[...new Set(currentCards.map(card => card.issuer))].join(', ')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                {[...new Set(recommendedCards.map(rec => rec.card.issuer))].join(', ')}
              </td>
            </tr>

            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Credit Score Range</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {[...new Set(currentCards.map(card => card.creditScoreRequired))].sort().join(' to ')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                {[...new Set(recommendedCards.map(rec => rec.card.creditScoreRequired))].sort().join(' to ')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeatureTable;