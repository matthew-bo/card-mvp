'use client';

import React, { useEffect, useState } from 'react';
import { CreditCardDetails } from '@/types/cards';

interface NotInterestedListProps {
  notInterestedIds: string[];
  onRemove: (cardId: string) => void;
  onClose: () => void;
}

const NotInterestedList: React.FC<NotInterestedListProps> = ({ 
  notInterestedIds, 
  onRemove,
  onClose
}) => {
  const [notInterestedCards, setNotInterestedCards] = useState<CreditCardDetails[]>([]);
  
  // Fetch card details when the component mounts
  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        const cardDetails: CreditCardDetails[] = [];
        
        // Fetch each card's details
        for (const cardId of notInterestedIds) {
          try {
            const response = await fetch(`/api/cards/details?cardKey=${cardId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                cardDetails.push(data.data);
              }
            }
          } catch (error) {
            console.error(`Error fetching details for card ${cardId}:`, error);
          }
        }
        
        setNotInterestedCards(cardDetails);
      } catch (error) {
        console.error('Error fetching card details:', error);
      }
    };
    
    fetchCardDetails();
  }, [notInterestedIds]);
  
  if (notInterestedIds.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Not Interested Cards</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">You haven&apos;t marked any cards as &quot;Not Interested&quot; yet.</p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Not Interested Cards ({notInterestedIds.length})</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          These cards won&apos;t appear in your recommendations. Click &quot;Reconsider&quot; to add them back to potential recommendations.
        </p>
        
        {notInterestedCards.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto flex-grow max-h-[400px] pr-1">
            {notInterestedCards.map(card => (
              <div 
                key={card.id} 
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div>
                  <p className="font-medium">{card.name}</p>
                  <p className="text-sm text-gray-600">{card.issuer}</p>
                </div>
                <button
                  onClick={() => onRemove(card.id)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                >
                  Reconsider
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex justify-end pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotInterestedList;