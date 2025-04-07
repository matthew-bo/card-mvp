'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Import from both places to ensure compatibility
import { storeCardData } from '@/utils/cardStorage';
import { useAuth } from '@/components/AuthProvider';
import { CreditCardDetails } from '@/types/cards';
import { CardDisplay } from '@/components/CardDisplay';
import CardSearch from '@/components/CardSearch';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CardsPage() {
  const { user } = useAuth();
  const [selectedCardKey, setSelectedCardKey] = useState<string>('');
  const [cardDetails, setCardDetails] = useState<CreditCardDetails | null>(null);
  const [userCards, setUserCards] = useState<CreditCardDetails[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_availableCards, setAvailableCards] = useState<CreditCardDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // These state variables are maintained for API compatibility with CardSearch component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedCardName, set_SelectedCardName] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedCardIssuer, set_SelectedCardIssuer] = useState<string>('');

  // Load user's existing cards
  useEffect(() => {
    const loadUserCards = async () => {
      if (!user) return;
      
      try {
        const cardsQuery = query(
          collection(db, 'user_cards'),
          where('userId', '==', user.uid)
        );
        
        const cardsSnap = await getDocs(cardsQuery);
        const userCardIds = cardsSnap.docs.map(doc => doc.data().cardId);
        
        // Fetch all available cards
        const response = await fetch('/api/cards/all');
        if (!response.ok) {
          throw new Error('Failed to load card database');
        }
        
        const data = await response.json();
        setAvailableCards(data.data);
        
        // Filter to get user's cards
        const loadedCards = data.data.filter((card: CreditCardDetails) => 
          userCardIds.includes(card.id)
        );
        
        setUserCards(loadedCards);
      } catch (err) {
        console.error('Error loading user cards:', err);
        setError('Failed to load your cards');
      }
    };
    
    loadUserCards();
  }, [user]);

  // Fetch card details when a card is selected
  useEffect(() => {
    const fetchCardDetails = async () => {
      if (!selectedCardKey) {
        setCardDetails(null);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/cards/details?cardKey=${selectedCardKey}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch card details: ${response.status}`);
        }
        
        const data = await response.json();
        setCardDetails(data.data);
      } catch (err) {
        console.error('Error fetching card details:', err);
        setError('Failed to load card details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCardDetails();
  }, [selectedCardKey]);

  // Update this to use underscores for unused variables
  const handleCardSelect = (cardKey: string, _cardName: string, _cardIssuer: string) => {
    setSelectedCardKey(cardKey);
    set_SelectedCardName(_cardName);
    set_SelectedCardIssuer(_cardIssuer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardKey) return;
  
    setLoading(true);
    setError(null);

    try {
      const cardData = {
        cardId: selectedCardKey,
        lastFour: "1234", // You'll need to get this from user input
        type: "credit",
        dateAdded: new Date()
      };
  
      await storeCardData(user?.uid || 'temp-user-id', cardData);
  
      // Add the selected card to the user's cards in state
      if (cardDetails) {
        setUserCards(prev => [...prev, cardDetails]);
      }
      
      setSelectedCardKey('');
      set_SelectedCardName('');
      set_SelectedCardIssuer('');
      setCardDetails(null);
      
      alert('Card added successfully!');
    } catch (error) {
      console.error('Error adding card:', error);
      setError('Failed to add card');
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

        <div className="space-y-6">
          {/* Card Search Component */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Search for Your Cards</h2>
            <CardSearch 
              onCardSelect={handleCardSelect}
              excludeCardKeys={userCards.map(card => card.id)}
              placeholder="Start typing your card name..."
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Selected Card Details */}
          {selectedCardKey && cardDetails && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Selected Card</h2>
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Card Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Card:</span> {cardDetails.name}</p>
                  <p><span className="font-medium">Issuer:</span> {cardDetails.issuer}</p>
                  <p><span className="font-medium">Annual Fee:</span> ${cardDetails.annualFee}</p>
                  <div>
                    <p className="font-medium">Reward Rates:</p>
                    {Object.entries(cardDetails.rewardRates)
                      .filter(([, rate]) => rate > 0)
                      .map(([category, rate]) => (
                        <p key={category} className="ml-4 capitalize">
                          • {rate}% on {category}
                        </p>
                      ))}
                  </div>
                  {cardDetails.signupBonus && (
                    <p>
                      <span className="font-medium">Sign-up Bonus:</span> {cardDetails.signupBonus.description}
                    </p>
                  )}
                  <p><span className="font-medium">Required Score:</span> {cardDetails.creditScoreRequired}</p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add This Card'}
                </button>
              </div>
            </div>
          )}
          
          {/* Display User's Cards */}
          {userCards.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Cards ({userCards.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCards.map((card) => (
                  <CardDisplay 
                    key={card.id} 
                    card={card} 
                    onDelete={() => {/* Handle delete */}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}