'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, query, where, orderBy } from 'firebase/firestore';
import type { OptimizationPreference, CreditCardDetails } from '@/types/cards';
import { getCardRecommendations } from '@/lib/cardRecommendations';
import { creditCards } from '@/lib/cardDatabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import FeatureTable from '@/components/FeatureTable';
import CardDisplay from '@/components/CardDisplay';

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

export default function RecommenderPage() {
  const { user } = useAuth();
  
  // =========== STATE MANAGEMENT ===========
  // User inputs
  const [optimizationPreference, setOptimizationPreference] = useState<OptimizationPreference>('points');
  const [creditScore, setCreditScore] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [zeroAnnualFee, setZeroAnnualFee] = useState<boolean>(false);
  
  // Data
  const [expenses, setExpenses] = useState<LoadedExpense[]>([]);
  const [userCards, setUserCards] = useState<CreditCardDetails[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedCard[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
  } | null>(null);
  
  // =========== CATEGORIES ===========
  const categories = [
    { id: 'dining', name: 'Dining' },
    { id: 'travel', name: 'Travel' },
    { id: 'grocery', name: 'Grocery' },
    { id: 'gas', name: 'Gas' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'rent', name: 'Rent' },
    { id: 'other', name: 'Other' }
  ] as const;

  // =========== LOCAL STORAGE DATA PERSISTENCE ===========
  // Load saved data for non-logged in users
  useEffect(() => {
    if (!user) {
      const savedData = localStorage.getItem('cardPickerUserData');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          setOptimizationPreference(data.optimizationPreference || 'points');
          setCreditScore(data.creditScore || 'good');
          setZeroAnnualFee(data.zeroAnnualFee || false);
          setExpenses(data.expenses || []);
          setUserCards(data.userCards || []);
        } catch (err) {
          console.error('Error loading saved data:', err);
          showNotification('Error loading saved data. Starting fresh.', 'error');
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
        zeroAnnualFee,
        expenses,
        userCards
      };
      try {
        localStorage.setItem('cardPickerUserData', JSON.stringify(dataToSave));
      } catch (err) {
        console.error('Error saving data:', err);
        showNotification('Error saving your data locally.', 'error');
      }
    }
  }, [optimizationPreference, creditScore, zeroAnnualFee, expenses, userCards, user]);

  // =========== FIREBASE DATA LOADING ===========
  // Load user data from Firebase for logged-in users
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
  
      try {
        // Loading expenses
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
        } catch (expError) {
          console.error('Error loading expenses:', expError);
          throw expError;
        }
  
        // Loading cards
        try {
          const cardsSnap = await getDocs(
            query(collection(db, 'user_cards'), 
            where('userId', '==', user.uid))
          );
          
          const userCardIds = cardsSnap.docs.map(doc => doc.data().cardId);
          const loadedCards = creditCards.filter(card => userCardIds.includes(card.id));
          setUserCards(loadedCards);
        } catch (cardError) {
          console.error('Error loading cards:', cardError);
          throw cardError;
        }
  
        // Loading preferences
        try {
          const prefsDoc = await getDocs(
            query(collection(db, 'user_preferences'),
            where('userId', '==', user.uid))
          );
          
          if (!prefsDoc.empty) {
            const prefs = prefsDoc.docs[0].data();
            setOptimizationPreference(prefs.optimizationPreference || 'points');
            setCreditScore(prefs.creditScore || 'good');
            setZeroAnnualFee(prefs.zeroAnnualFee || false);
          }
        } catch (prefError) {
          console.error('Error loading preferences:', prefError);
          throw prefError;
        }
  
      } catch (err) {
        const error = err as Error;
        console.error('Error loading user data:', error);
        setError(`Failed to load your data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    if (user) {
      loadUserData();
    }
  }, [user]);

  // =========== AUTO-SAVE USER PREFERENCES ===========
  useEffect(() => {
    const saveUserData = async () => {
      if (!user) return;
      
      try {
        await setDoc(doc(db, 'user_preferences', user.uid), {
          userId: user.uid,
          optimizationPreference,
          creditScore,
          zeroAnnualFee,
          updatedAt: new Date()
        });
      } catch (err) {
        const error = err as Error;
        console.error('Error saving preferences:', error);
        setError('Failed to save your preferences.');
      }
    };

    saveUserData();
  }, [user, optimizationPreference, creditScore, zeroAnnualFee]);

  // =========== UPDATE RECOMMENDATIONS ===========
  useEffect(() => {
    try {
      const newRecommendations = getCardRecommendations({
        expenses,
        currentCards: userCards,
        optimizationSettings: {
          preference: optimizationPreference,
          zeroAnnualFee
        },
        creditScore
      });
      setRecommendations(newRecommendations);
    } catch (err) {
      const error = err as Error;
      console.error('Error updating recommendations:', error);
      setError('Failed to update recommendations.');
    }
  }, [expenses, userCards, optimizationPreference, creditScore, zeroAnnualFee]);

  // =========== EVENT HANDLERS ===========
  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setNotification({ message, type, id });
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotification(current => current?.id === id ? null : current);
    }, 4000);
  };

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
      showNotification('Expense added successfully!', 'success');
      
      // Switch to results tab on mobile after adding expense
      if (window.innerWidth < 768) {
        setActiveTab('results');
      }
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
      showNotification('Card added successfully!', 'success');
      
      // Switch to results tab on mobile after adding card
      if (window.innerWidth < 768) {
        setActiveTab('results');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error adding card:', error);
      setError('Failed to add card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting expense
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
      
      if (user) {
        await deleteDoc(doc(db, 'expenses', expenseId));
      }
      
      showNotification('Expense deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense. Please try again.');
    }
  };

  // Handle deleting card
  const handleDeleteCard = async (cardId: string) => {
    try {
      setUserCards(prev => prev.filter(card => card.id !== cardId));
      
      if (user) {
        const cardsRef = collection(db, 'user_cards');
        const q = query(cardsRef, 
          where('userId', '==', user.uid),
          where('cardId', '==', cardId)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          await deleteDoc(doc(db, 'user_cards', querySnapshot.docs[0].id));
        }
      }
      
      showNotification('Card deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting card:', error);
      setError('Failed to delete card. Please try again.');
    }
  };

  // =========== DATA PROCESSING ===========
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

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // =========== RENDER ===========
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive Navigation Bar */}
      <nav className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold sm:text-2xl">Card Picker</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="hidden sm:inline text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={() => auth.signOut()}
                    className="text-sm text-gray-700 hover:text-gray-900 px-2 py-1 sm:px-4 sm:py-2 rounded hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm text-gray-700 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-sm bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden bg-white border-b sticky top-16 z-40">
        <div className="grid grid-cols-2 gap-0">
          <button
            className={`py-3 text-center font-medium text-sm ${
              activeTab === 'input' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('input')}
          >
            Input
          </button>
          <button
            className={`py-3 text-center font-medium text-sm ${
              activeTab === 'results' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('results')}
          >
            Results
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div 
          className={`fixed top-16 left-0 right-0 z-50 p-4 flex items-center justify-between transition-all transform ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' :
            notification.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}
        >
          <p>{notification.message}</p>
          <button 
            onClick={() => setNotification(null)}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 text-red-700 p-4 rounded-md shadow-sm border border-red-200">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Content Grid - Responsive Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - All Input Sections */}
          <div className={`lg:col-span-1 space-y-6 ${activeTab === 'input' || window.innerWidth >= 768 ? 'block' : 'hidden'}`}>
            {/* Add Expense Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Track Expense</h2>
              <p className="text-sm text-gray-600 mb-4">
                * Track your monthly expenses for personalized recommendations
              </p>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                    disabled={loading}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Expense'}
                </button>
              </form>
            </div>

            {/* Add Card Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Your Current Cards</h2>
              <form onSubmit={handleAddCard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Card</label>
                  <select
                    value={selectedCard}
                    onChange={(e) => setSelectedCard(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={loading}
                  >
                    <option value="">Select a card</option>
                    {creditCards
                      .filter(card => !userCards.some(c => c.id === card.id))
                      .map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading || !selectedCard}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Card'}
                </button>
              </form>
            </div>

            {/* Optimization Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimization Settings</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">What would you like to optimize for?</label>
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

              {/* Credit Score Selection */}
              <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">What&apos;s your credit score range?</label>
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

              {/* Annual Fee Preference */}
              <div className="mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={zeroAnnualFee}
                    onChange={(e) => setZeroAnnualFee(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Only show cards with no annual fee</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Results Area */}
          <div className={`lg:col-span-2 space-y-6 ${activeTab === 'results' || window.innerWidth >= 768 ? 'block' : 'hidden'}`}>
            {/* Summary Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-blue-600 uppercase font-medium">Total Expenses</p>
                <p className="text-lg font-bold">${totalExpenses.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-medium">Your Cards</p>
                <p className="text-lg font-bold">{userCards.length}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-medium">Recommended</p>
                <p className="text-lg font-bold">{recommendations.length}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase font-medium">Optimizing For</p>
                <p className="text-lg font-bold capitalize">{optimizationPreference}</p>
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Your Expenses</h3>
                {expenses.length > 0 && (
                  <span className="text-sm text-gray-500">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              
              {expenses.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No expenses added yet</p>
                  <button 
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setActiveTab('input')}
                  >
                    Add Your First Expense
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {expenses.map((expense) => (
                    <div 
                      key={expense.id} 
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="font-medium capitalize text-gray-700 truncate max-w-[100px] sm:max-w-none">
                          {expense.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-blue-900">
                          ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                          aria-label="Delete expense"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Cards */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Your Current Cards</h2>
                {userCards.length > 0 && (
                  <span className="text-sm text-gray-500">{userCards.length} card{userCards.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              
              {userCards.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No cards added yet</p>
                  <button 
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setActiveTab('input')}
                  >
                    Add Your First Card
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {userCards.map((card) => (
                    <CardDisplay 
                      key={card.id} 
                      card={card} 
                      onDelete={handleDeleteCard}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Cards */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-xl font-semibold mb-4">Recommended Cards</h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">Add expenses and cards to get personalized recommendations</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {recommendations.map(({ card, reason }) => (
                    <div key={card.id} className="relative">
                      <div className="absolute -top-2 left-4 right-4 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full text-center z-10">
                        {reason}
                      </div>
                      <div className="pt-4">
                         <CardDisplay card={card} />
                      </div> 
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feature Comparison Table */}
            <FeatureTable 
              currentCards={userCards}
              recommendedCards={recommendations}
            />

            {/* Rewards Comparison Chart */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-xl font-semibold mb-4">Rewards Rate Comparison</h2>
              <div className="h-80">
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
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center text-sm text-gray-500">
            <p className="mb-2">Card Picker - Credit Card Optimization Tool</p>
            <p>© {new Date().getFullYear()} Card Picker App</p>
          </div>
        </div>
      </footer>
    </div>
  );
}