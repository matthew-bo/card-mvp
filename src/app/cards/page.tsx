'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import { creditCards } from '@/lib/cardDatabase';

export default function CardsPage() {
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'user-cards'), {
        cardId: selectedCard,
        dateAdded: new Date()
      });

      setSelectedCard('');
      alert('Card added successfully!');
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Error adding card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Add Your Cards</h1>
          <Link 
            href="/dashboard"
            className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Back to Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
          <div>
            <label htmlFor="card" className="block text-sm font-medium text-gray-700">
              Select Card
            </label>
            <select
              id="card"
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a card</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name} (${card.annualFee}/year)
                </option>
              ))}
            </select>
          </div>


          {selectedCard && (
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Card Details</h3>
              {creditCards.filter(card => card.id === selectedCard).map(card => (
                <div key={card.id} className="space-y-2 text-sm">
                  <p><span className="font-medium">Annual Fee:</span> ${card.annualFee}</p>
                  <div>
                    <p className="font-medium">Reward Rates:</p>
                    {Object.entries(card.rewardRates)  
                      .filter(([, rate]) => rate > 0)
                      .map(([category, rate]) => (
                        <p key={category} className="ml-4 capitalize">
                          • {rate}% on {category}
                        </p>
                      ))}
                  </div>
                  {card.signupBonus && (
                    <p>
                      <span className="font-medium">Sign-up Bonus:</span> {card.signupBonus.description}
                    </p>
                  )}
                  <p><span className="font-medium">Required Score:</span> {card.creditScoreRequired}</p>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Card
          </button>
        </form>
      </div>
    </main>
  );
}