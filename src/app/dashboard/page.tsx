'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, deleteDoc, doc, where } from 'firebase/firestore';
import type { OptimizationPreference, CreditCardDetails } from '@/types/cards';
import { getCardRecommendations } from '@/lib/cardRecommendations';
import { creditCards } from '@/lib/cardDatabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import Image from 'next/image';

export default function Dashboard() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [userCards, setUserCards] = useState<CreditCardDetails[]>([]);
  const [optimizationPreference, setOptimizationPreference] = useState<OptimizationPreference>('points');
  const [recommendations, setRecommendations] = useState<{ card: CreditCardDetails; reason: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditScore, setCreditScore] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [isDeleting, setIsDeleting] = useState(false);
  const [startDate, setStartDate] = useState(subMonths(startOfMonth(new Date()), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(endOfMonth(new Date()).toISOString().split('T')[0]);

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      setExpenses(expenses.filter(exp => exp.id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    
    setIsDeleting(true);
    try {
      const cardsRef = collection(db, 'user-cards');
      const q = query(cardsRef, where('cardId', '==', cardId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        await deleteDoc(doc(db, 'user-cards', querySnapshot.docs[0].id));
        setUserCards(userCards.filter(card => card.id !== cardId));
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Error deleting card');
    } finally {
      setIsDeleting(false);
    }
  };

  const getComparisonData = () => {
    const categories = ['dining', 'travel', 'grocery', 'gas', 'other'];
    return categories.map(category => {
      const currentBestRate = Math.max(...userCards.map(card => card.rewards[category as keyof typeof card.rewards] || 0));
      const recommendedBestRate = Math.max(...recommendations.map(rec => rec.card.rewards[category as keyof typeof rec.card.rewards] || 0));
      
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        'Current Best Rate': currentBestRate,
        'Recommended Best Rate': recommendedBestRate,
      };
    });
  };

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      try {
        // Fetch user's expenses with date filter
        const expensesRef = collection(db, 'expenses');
        const expensesQuery = query(
          expensesRef,
          where('date', '>=', new Date(startDate)),
          where('date', '<=', new Date(endDate)),
          orderBy('date', 'desc')
        );
        const expensesSnap = await getDocs(expensesQuery);
        const expensesData = expensesSnap.docs.map(doc => ({
          id: doc.id,
          amount: doc.data().amount,
          category: doc.data().category,
          date: doc.data().date.toDate()
        }));
        setExpenses(expensesData);

        // Fetch user's cards
        const cardsRef = collection(db, 'user-cards');
        const cardsSnap = await getDocs(query(cardsRef));
        const cardsData = cardsSnap.docs.map(doc => {
          const cardId = doc.data().cardId;
          return creditCards.find(c => c.id === cardId);
        }).filter(Boolean) as CreditCardDetails[];
        setUserCards(cardsData);

        // Get recommendations
        const newRecommendations = getCardRecommendations({
          expenses: expensesData,
          currentCards: cardsData,
          optimizationPreference,
          creditScore
        });
        setRecommendations(newRecommendations);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [optimizationPreference, creditScore, startDate, endDate]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Credit Card Dashboard</h1>
        
        {/* Optimization Preference */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Optimization Preference</h2>
          <select
            value={optimizationPreference}
            onChange={(e) => setOptimizationPreference(e.target.value as OptimizationPreference)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="points">Maximize Points</option>
            <option value="creditScore">Build Credit Score</option>
            <option value="cashback">Maximize Cash Back</option>
            <option value="perks">Best Perks</option>
          </select>
        </div>

        {/* Credit Score */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Credit Score Range</h2>
          <select
            value={creditScore}
            onChange={(e) => setCreditScore(e.target.value as typeof creditScore)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="excellent">Excellent (720+)</option>
            <option value="good">Good (690-719)</option>
            <option value="fair">Fair (630-689)</option>
            <option value="poor">Poor (Below 630)</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Expense Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <Link 
                href="/expenses"
                className="block w-full p-3 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add New Expense
              </Link>
              <Link
                href="/cards"
                className="block w-full p-3 text-center bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Manage Cards
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-2">
              {expenses.length === 0 ? (
                <p className="text-gray-500">No expenses in selected date range</p>
              ) : (
                expenses.map((expense: any) => (
                  <div key={expense.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium capitalize">{expense.category}</span>
                        <span className="text-gray-500 ml-2">
                          {expense.date.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">${expense.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Current Cards */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCards.length === 0 ? (
              <p className="text-gray-500">No cards added yet</p>
            ) : (
              userCards.map((card) => (
                <div key={card.id} className="border rounded-lg p-4 relative">
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    disabled={isDeleting}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="flex items-start space-x-4">
                    <Image
                      src="/api/placeholder/300/180"
                      alt={`${card.name} logo`}
                      width={300}
                      height={180}
                      className="w-24 h-16 object-contain rounded"
                    />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{card.name}</h3>
                      <div className="text-sm text-gray-600">
                        <p>Annual Fee: ${card.annualFee}</p>
                        <div className="mt-2">
                          <p className="font-medium">Reward Rates:</p>
                          {Object.entries(card.rewards)
                            .filter(([, rate]) => rate > 0)
                            .map(([category, rate]) => (
                              <p key={category} className="ml-2 capitalize">
                                • {rate}% on {category}
                              </p>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rewards Comparison Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Rewards Rate Comparison</h2>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getComparisonData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis label={{ value: 'Reward Rate (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Current Best Rate"fill="#4B5563" />
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
          ) : recommendations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Add your current cards and expenses to get personalized recommendations</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map(({ card, reason }) => (
                <div key={card.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col space-y-4">
                    <Image
                      src="/api/placeholder/300/180"
                      alt={`${card.name} logo`}
                      width={300}
                      height={180}
                      className="w-full h-32 object-contain rounded mb-2"
                    />
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
                            {Object.entries(card.rewards)
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
                            <span className="font-medium">Sign-up Bonus:</span> {card.signupBonus.amount} {card.signupBonus.type}
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

      </div>
    </main>
  );
}