'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, query, where, orderBy } from 'firebase/firestore';
import type { OptimizationPreference, CreditCardDetails } from '@/types/cards';
import { getCardRecommendations } from '@/lib/cardRecommendations';
import { creditCards } from '@/lib/cardDatabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SimpleMonitor } from '@/utils/monitoring/simpleMonitor';

interface FirestoreExpense {
  amount: number;
  category: string;
  date: { toDate: () => Date };
  userId: string;
}

interface LoadedExpense {
  id: string;
  amount: number;
  category: string;
  date: Date;
  userId: string;
}

interface RecommendedCard {
  card: CreditCardDetails;
  reason: string;
  score: number;
}

export default function Home() {
  const { user } = useAuth();
  
  // State for user inputs
  const [optimizationPreference, setOptimizationPreference] = useState<OptimizationPreference>('points');
  const [creditScore, setCreditScore] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  
  // State for data
  const [expenses, setExpenses] = useState<LoadedExpense[]>([]);
  const [userCards, setUserCards] = useState<CreditCardDetails[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedCard[]>([]);
  
  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories for expenses
  const categories = [
    { id: 'dining', name: 'Dining' },
    { id: 'travel', name: 'Travel' },
    { id: 'grocery', name: 'Grocery' },
    { id: 'gas', name: 'Gas' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'rent', name: 'Rent' },
    { id: 'other', name: 'Other' }
  ] as const;

  // Load saved data for non-logged in users
  useEffect(() => {
    if (!user) {
      const savedData = localStorage.getItem('cardPickerUserData');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          setOptimizationPreference(data.optimizationPreference || 'points');
          setCreditScore(data.creditScore || 'good');
          setExpenses(data.expenses || []);
          setUserCards(data.userCards || []);
        } catch (err) {
          console.error('Error loading saved data:', err);
        }
      }
    }
  }, [user]);

  // Save data for non-logged in users
  useEffect(() => {
    if (!user) {
      const dataToSave = {
        optimizationPreference,
        creditScore,
        expenses,
        userCards
      };
      try {
        localStorage.setItem('cardPickerUserData', JSON.stringify(dataToSave));
      } catch (err) {
        console.error('Error saving data:', err);
      }
    }
  }, [optimizationPreference, creditScore, expenses, userCards, user]);

  // Load user data from Firebase for logged-in users
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        const expensesSnap = await getDocs(
          query(collection(db, 'expenses'), 
          where('userId', '==', user.uid),
          orderBy('date', 'desc'))
        );
        
        const loadedExpenses = expensesSnap.docs.map(doc => {
          const data = doc.data() as FirestoreExpense;
          return {
            id: doc.id,
            ...data,
            date: data.date.toDate()
          } as LoadedExpense;
        });
        setExpenses(loadedExpenses);

        const cardsSnap = await getDocs(
          query(collection(db, 'user_cards'), 
          where('userId', '==', user.uid))
        );
        
        const userCardIds = cardsSnap.docs.map(doc => doc.data().cardId);
        const loadedCards = creditCards.filter(card => userCardIds.includes(card.id));
        setUserCards(loadedCards);

        const prefsDoc = await getDocs(
          query(collection(db, 'user_preferences'),
          where('userId', '==', user.uid))
        );
        
        if (!prefsDoc.empty) {
          const prefs = prefsDoc.docs[0].data();
          setOptimizationPreference(prefs.optimizationPreference);
          setCreditScore(prefs.creditScore);
        }
      } catch (err) {
        const error = err as Error;
        console.error('Error loading user data:', error);
        console.error('Error stack:', error.stack);
        setError('Failed to load your data. Please try again.');
        SimpleMonitor.trackError(error);
      }
    };

    loadUserData();
  }, [user]);
  // Automatically save data for logged-in users
  useEffect(() => {
    const saveUserData = async () => {
      if (!user) return;
      
      try {
        await setDoc(doc(db, 'user_preferences', user.uid), {
          userId: user.uid,
          optimizationPreference,
          creditScore,
          updatedAt: new Date()
        });
      } catch (err) {
        const error = err as Error;
        console.error('Error saving preferences:', error);
        setError('Failed to save your preferences. Your changes may not be saved.');
      }
    };

    saveUserData();
  }, [user, optimizationPreference, creditScore]);

  // Update recommendations
  useEffect(() => {
    try {
      const newRecommendations = getCardRecommendations({
        expenses,
        currentCards: userCards,
        optimizationPreference,
        creditScore
      });
      setRecommendations(newRecommendations);
    } catch (err) {
      const error = err as Error;
      console.error('Error updating recommendations:', error);
      setError('Failed to update recommendations. Please try again.');
    }
  }, [expenses, userCards, optimizationPreference, creditScore]);

  // Handle adding expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    
    setLoading(true);
    setError(null);

    try {
      const expenseData = {
        amount: parseFloat(amount),
        category,
        date: new Date(),
        userId: user?.uid || 'anonymous'
      };

      if (user) {
        const docRef = await addDoc(collection(db, 'expenses'), expenseData);
        setExpenses(prev => [{
          id: docRef.id,
          ...expenseData,
          date: expenseData.date
        }, ...prev]);
      } else {
        setExpenses(prev => [{
          id: Date.now().toString(),
          ...expenseData,
          date: expenseData.date
        }, ...prev]);
      }

      setAmount('');
      setCategory('');
    } catch (err) {
      const error = err as Error;
      console.error('Error adding expense:', error);
      setError('Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding card
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    setLoading(true);
    setError(null);

    try {
      const newCard = creditCards.find(c => c.id === selectedCard);
      if (!newCard) throw new Error('Card not found');

      if (user) {
        await addDoc(collection(db, 'user_cards'), {
          cardId: selectedCard,
          userId: user.uid,
          dateAdded: new Date()
        });
      }

      setUserCards(prev => [...prev, newCard]);
      setSelectedCard('');
    } catch (err) {
      const error = err as Error;
      console.error('Error adding card:', error);
      setError('Failed to add card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get comparison data for chart
  const getComparisonData = () => {
    const chartCategories = ['dining', 'travel', 'grocery', 'gas', 'entertainment', 'rent'] as const;
    type CategoryKey = keyof CreditCardDetails['rewardRates'];

    return chartCategories.map(category => {
      const currentBestRate = userCards.length > 0 
        ? Math.max(...userCards.map(card => 
            card.rewardRates[category as CategoryKey] || 0))
        : 0;
        
      const recommendedBestRate = recommendations.length > 0
        ? Math.max(...recommendations.map(rec => 
            rec.card.rewardRates[category as CategoryKey] || 0))
        : 0;

      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        'Current Best Rate': currentBestRate,
        'Recommended Best Rate': recommendedBestRate,
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold">Card Picker</h1>
            </div>
            <div className="flex items-center">
              {user ? (
                <button
                  onClick={() => auth.signOut()}
                  className="ml-4 text-sm text-gray-700 hover:text-gray-900"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm text-gray-700 hover:text-gray-900"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="ml-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Add Expense Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.00"
                required
                disabled={loading}
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </form>

          {/* Expenses List */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Your Expenses</h3>
            <p className="text-sm text-gray-600 mb-4">
              * Please add all expenses from the past month for the most accurate recommendations
            </p>
            {expenses.length === 0 ? (
              <p className="text-gray-500">No expenses added yet</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium capitalize">{expense.category}</span>
                    </div>
                    <span className="font-medium">
                      ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}   
              </div>
            )}
          </div>
        </div>

        {/* Add Card Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Your Current Cards</h2>
          <form onSubmit={handleAddCard} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Card</label>
              <select
                value={selectedCard}
                onChange={(e) => setSelectedCard(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="">Select a card</option>
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Card'}
            </button>
          </form>
        </div>

        {/* Current Cards */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Current Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userCards.length === 0 ? (
              <p className="text-gray-500 col-span-3">No cards added yet</p>
            ) : (
              userCards.map((card) => (
                <div key={card.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{card.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p>Annual Fee: ${card.annualFee}</p>
                    <div>
                      <p className="font-medium">Reward Rates:</p>
                      {Object.entries(card.rewardRates)
                        .filter(([, rate]) => rate > 0)
                        .map(([category, rate]) => (
                          <p key={category} className="ml-2 capitalize">
                            • {rate}% on {category}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Optimization Preference */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">What would you like to optimize for?</h2>
          <select
            value={optimizationPreference}
            onChange={(e) => setOptimizationPreference(e.target.value as OptimizationPreference)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="points">Maximize Points</option>
            <option value="creditScore">Build Credit Score</option>
            <option value="cashback">Maximize Cash Back</option>
            <option value="perks">Best Perks</option>
          </select>
        </div>

        {/* Credit Score */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">What&apos;s your credit score range?</h2>
          <select
            value={creditScore}
            onChange={(e) => setCreditScore(e.target.value as typeof creditScore)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="excellent">Excellent (720+)</option>
            <option value="good">Good (690-719)</option>
            <option value="fair">Fair (630-689)</option>
            <option value="poor">Poor (Below 630)</option>
          </select>
        </div>

        {/* Rewards Comparison Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Rewards Rate Comparison</h2>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getComparisonData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis label={{ value: 'Reward Rate (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Current Best Rate" fill="#4B5563" />
                <Bar dataKey="Recommended Best Rate" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card Recommendations */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Recommended Cards</h2>
          {loading ? (
            <div className="text-center py-4">Loading recommendations...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map(({ card, reason }) => (
                <div key={card.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{card.name}</h3>
                      <p className="text-gray-600 mb-4">{reason}</p>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Annual Fee:</span> ${card.annualFee}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Top Rewards:</span>
                          <ul className="mt-1 space-y-1">
                            {Object.entries(card.rewardRates)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 2)
                              .map(([category, rate]) => (
                                <li key={category} className="ml-4">
                                  • {rate}% on {category}
                                </li>
                              ))}
                          </ul>
                        </div>
                        {card.signupBonus && (
                          <p className="text-sm">
                            <span className="font-medium">Sign-up Bonus:</span> {card.signupBonus.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}  