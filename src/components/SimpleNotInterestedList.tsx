// src/components/SimpleNotInterestedList.tsx
'use client';

import React from 'react';
import { CreditCardDetails } from '@/types/cards';
import SafeModal from '@/components/SafeModal';

interface SimpleNotInterestedListProps {
  notInterestedIds: string[];
  notInterestedCards: CreditCardDetails[];
  onRemove: (cardId: string) => void;
  onClose: () => void;
}

const SimpleNotInterestedList: React.FC<SimpleNotInterestedListProps> = ({ 
  notInterestedIds, 
  notInterestedCards,
  onRemove,
  onClose
}) => {
  const hasCards = notInterestedIds.length > 0;
  
  return (
    <SafeModal 
      isOpen={true} 
      onClose={onClose}
      title={`Not Interested Cards ${hasCards ? `(${notInterestedIds.length})` : ''}`}
    >
      {!hasCards ? (
        <p className="text-gray-600">You haven&apos;t marked any cards as &quot;Not Interested&quot; yet.</p>
      ) : (
        <>
          <p className="text-gray-600 mb-4">
            These cards won&apos;t appear in your recommendations. Click &quot;Reconsider&quot; to add them back to potential recommendations.
          </p>
          
          <div className="space-y-3">
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
        </>
      )}
    </SafeModal>
  );
};

export default SimpleNotInterestedList;