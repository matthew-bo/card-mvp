'use client';

import React from 'react';
import { CreditCardDetails } from '@/types/cards';

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
              ×
            </button>
          </div>
          <p className="text-gray-600">You haven't marked any cards as "Not Interested" yet.</p>
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
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          These cards won't appear in your recommendations. Click "Reconsider" to add them back to potential recommendations.
        </p>
        
        <div className="space-y-3 overflow-y-auto flex-grow" style={{ maxHeight: '50vh' }}>
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

export default SimpleNotInterestedList;