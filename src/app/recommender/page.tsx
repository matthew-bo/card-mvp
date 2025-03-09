'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import type { OptimizationPreference, CreditCardDetails } from '@/types/cards';
import { getCardRecommendations } from '@/lib/cardRecommendations';
import { useCards } from '@/hooks/useCards';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import FeatureTable from '@/components/FeatureTable';
import { CardDisplay } from '@/components/CardDisplay';
import safeStorage from '@/utils/safeStorage';
import SimpleNotInterestedList from '@/components/SimpleNotInterestedList';
import CardTypeToggle from '@/components/CardTypeToggle';
import { filterPersonalCards, filterBusinessCards } from '@/utils/cardUtils';

// Safe localStorage handling
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return safeStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try {
        safeStorage.setItem(key, value);
      } catch (e) {
        console.error('Error setting localStorage item:', e);
      }
    }
  }
};

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

interface SearchResultCard {
  cardKey: string;
  cardName: string;
  cardIssuer: string;
}

interface ScoredCard {
  card: CreditCardDetails;
  reason: string;
  score: number;
  matchPercentage: number;
  potentialAnnualValue: number;
  complementScore: number;
  longTermValue: number;
  portfolioContribution: string[];
}

export default function RecommenderPage() {
  const { user } = useAuth();
  const { cards: creditCards, loading: cardsLoading } = useCards();
  
  // =========== STATE MANAGEMENT ===========
  // User inputs
  const [mounted, setMounted] = useState(false);
  const [optimizationPreference, setOptimizationPreference] = useState<OptimizationPreference>('points');
  const [creditScore, setCreditScore] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [zeroAnnualFee, setZeroAnnualFee] = useState<boolean>(false);
  const [notInterestedCards, setNotInterestedCards] = useState<string[]>([]);
  const [showNotInterestedList, setShowNotInterestedList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultCard[]>([]);
  const [preparedNotInterestedCards, setPreparedNotInterestedCards] = useState<CreditCardDetails[]>([]);
  const [manualRecommendations, setManualRecommendations] = useState<RecommendedCard[]>([]);
  const [showUpdateButton, setShowUpdateButton] = useState(true);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);
  const [cardType, setCardType] = useState<'personal' | 'business' | 'both'>('personal');
  const [loadingState, setLoadingState] = useState<string>('initializing');
  
  // Data
  const [expenses, setExpenses] = useState<LoadedExpense[]>([]);
  const [userCards, setUserCards] = useState<CreditCardDetails[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedCard[]>([]);
  const [allCards, setAllCards] = useState<CreditCardDetails[]>([]);
  const [loadingAllCards, setLoadingAllCards] = useState(true);
  const [_selectedCard, setSelectedCard] = useState<string>('');
  const [cardSearchLoading, setCardSearchLoading] = useState(false);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
  } | null>(null);

  // Show notification callback
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setNotification({ message, type, id });
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotification(current => current?.id === id ? null : current);
    }, 4000);
  }, []);

  // Load all cards callback
  const loadAllCards = useCallback(async () => {
    console.log('🔄 Loading all cards started');
    setLoadingState('loading-cards');
    setLoadingAllCards(true);
    
    try {
      const response = await fetch('/api/cards/all');
      
      if (!response.ok) {
        throw new Error(`Failed to load card database: ${response.status}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Failed to parse card data');
      }
      
      let filteredCards = [];
      
      if (!data.data || !Array.isArray(data.data)) {
        filteredCards = [];
      } else if (cardType === 'personal') {
        filteredCards = filterPersonalCards(data.data);
      } else if (cardType === 'business') {
        filteredCards = filterBusinessCards(data.data);
      } else {
        filteredCards = data.data;
      }
      
      setAllCards(filteredCards);
      setLoadingState('cards-loaded');
    } catch (error) {
      setAllCards([]);
      setError(`Failed to load card database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoadingState('cards-error');
    } finally {
      setLoadingAllCards(false);
    }
  }, [cardType]);

  // Handle refresh recommendations callback
  const handleRefreshRecommendations = useCallback(async () => {
    setRefreshingRecommendations(true);
    setError(null);
  
    try {
      await loadAllCards();
      showNotification('Recommendations updated based on your latest inputs', 'success');
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError('Failed to update recommendations. Please try again.');
    } finally {
      setRefreshingRecommendations(false);
    }
  }, [loadAllCards, showNotification]);

  // =========== EFFECTS ===========
  // Component mount effect
  useEffect(() => {
    setMounted(true);
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

  // Load user data effect
  useEffect(() => {
    if (!user && mounted) {
      const savedData = safeStorage.getItem('cardPickerUserData');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          setOptimizationPreference(data.optimizationPreference || 'points');
          setCreditScore(data.creditScore || 'good');
          setZeroAnnualFee(data.zeroAnnualFee || false);
          setExpenses(data.expenses || []);
          setUserCards(data.userCards || []);
          setNotInterestedCards(data.notInterestedCards || []);
        } catch (err) {
          console.error('Error loading saved data:', err);
        }
      }
    }
  }, [user, mounted]);

  // Save data effect
  useEffect(() => {
    if (!user && mounted) {
      const dataToSave = {
        optimizationPreference,
        creditScore,
        zeroAnnualFee,
        expenses,
        userCards,
        notInterestedCards
      };
      try {
        safeStorage.setItem('cardPickerUserData', JSON.stringify(dataToSave));
      } catch (err) {
        console.error('Error saving data:', err);
        showNotification('Error saving your data locally.', 'error');
      }
    }
  }, [optimizationPreference, creditScore, zeroAnnualFee, expenses, userCards, user, notInterestedCards, showNotification, mounted]);

  // Loading timeout effect
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setLoadingAllCards(false);
        setError('Loading timed out. Please refresh the page or try again later.');
        setLoadingState('timeout');
      }
    }, 15000);
    
    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  // Load cards effect
  useEffect(() => {
    if (mounted) {
      loadAllCards();
    }
  }, [cardType, mounted, loadAllCards]);

  // Generate recommendations effect
  useEffect(() => {
    if (!showUpdateButton && !loadingAllCards && allCards.length > 0) {
      try {
        const availableForRecommendation = allCards.filter((card: CreditCardDetails) => 
          !userCards.some(uc => uc.id === card.id) && 
          !notInterestedCards.includes(card.id)
        );
        
        const algorithmRecommendations = getCardRecommendations({
          expenses,
          currentCards: userCards,
          optimizationSettings: {
            preference: optimizationPreference,
            zeroAnnualFee
          },
          creditScore,
          excludeCardIds: notInterestedCards,
          availableCards: allCards
        });
        
        let finalRecommendations = [...algorithmRecommendations];
        
        if (finalRecommendations.length < 6 && availableForRecommendation.length > 0) {
          const recommendedCardIds = finalRecommendations.map(rec => rec.card.id);
          const additionalCandidates = availableForRecommendation.filter(
            (card: CreditCardDetails) => !recommendedCardIds.includes(card.id)
          );
          
          const randomCards = additionalCandidates
            .sort(() => Math.random() - 0.5)
            .slice(0, 10 - finalRecommendations.length);
          
          const randomRecommendations = randomCards.map((card: CreditCardDetails) => ({
            card,
            reason: "Additional option for your consideration",
            score: 50,
            matchPercentage: 70,
            potentialAnnualValue: 500,
            complementScore: 40,
            longTermValue: 600,
            portfolioContribution: ["Adds diversity to your portfolio"]
          })) as ScoredCard[];
          
          finalRecommendations = [...finalRecommendations, ...randomRecommendations];
        }
        
        setManualRecommendations(finalRecommendations);
        setShowUpdateButton(true);
      } catch (err) {
        console.error('Error updating recommendations:', err);
        setError('Failed to update recommendations.');
        setShowUpdateButton(true);
      }
    }
  }, [expenses, userCards, optimizationPreference, creditScore, zeroAnnualFee, notInterestedCards, loadingAllCards, allCards, showUpdateButton]);

  // Search effect
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setCardSearchLoading(true);
      try {
        const response = await fetch(`/api/cards/search?q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          const filtered = data.data.filter(
            (card: SearchResultCard) => !userCards.some(userCard => userCard.id === card.cardKey)
          );
          setSearchResults(filtered);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching cards:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm, userCards]);

  // Firebase data loading effect
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
        }
  
        // Loading cards
        try {
          const cardsSnap = await getDocs(
            query(collection(db, 'user_cards'), 
            where('userId', '==', user.uid))
          );
          
          const userCardIds = cardsSnap.docs.map(doc => doc.data().cardId);
          
          if (creditCards && creditCards.length > 0) {
            const loadedCards = creditCards.filter(card => userCardIds.includes(card.id));
            setUserCards(loadedCards);
          }
        } catch (cardError) {
          console.error('Error loading cards:', cardError);
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
    } else {
      setLoading(false);
    }
  }, [user, creditCards]);

  // Debug logging effects
  useEffect(() => {
    console.log("Recommendations updated:", recommendations);
  }, [recommendations]);
  
  useEffect(() => {
    console.log("Not interested list updated:", notInterestedCards);
  }, [notInterestedCards]);

  useEffect(() => {
    console.log('Loading state changed:', loading);
  }, [loading]);

  useEffect(() => {
    console.log(`Loading state changed to: ${loadingState}`);
  }, [loadingState]);

  // Don't render anything during SSR
  if (!mounted) {
    return null;
  }

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

  const prepareAndShowNotInterestedList = () => {
    // Filter cards from the static creditCards array
    const notInterestedCardsData = notInterestedCards
      .map(id => creditCards.find(card => card.id === id))
      .filter(Boolean) as CreditCardDetails[];
    
    setPreparedNotInterestedCards(notInterestedCardsData);
    setShowNotInterestedList(true);
  };

  // Function to fetch card details when a card is selected
  const fetchCardDetails = async (cardKey: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cards/details?cardKey=${cardKey}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch card details: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        handleCardSelection(data.data);
        setSearchTerm(''); // Clear search after selection
        setSearchResults([]); // Clear results
      } else {
        setError('Failed to get card details');
      }
    } catch (error) {
      console.error('Error fetching card details:', error);
      setError(`Failed to get card details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
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

  // Handle Not Interested Recommended Card
  const handleNotInterested = (cardId: string) => {
    // Add to not interested list if not already there
    setNotInterestedCards(prev => {
      if (prev.includes(cardId)) {
        return prev; // Card already in list, don't add it again
      }
      return [...prev, cardId];
    });
    
    // Remove from current recommendations
    setRecommendations(prev => {
      // Filter out the card that was marked "not interested"
      const updatedRecs = prev.filter(rec => rec.card.id !== cardId);
      
      // If we now have fewer than the target number of cards (e.g., 4), get a replacement
      if (updatedRecs.length < 4 && allCards.length > 0) {
        // Find the next best card that's not already recommended or marked as not interested
        const currentRecIds = updatedRecs.map(rec => rec.card.id);
        const allNotInterestedIds = [...notInterestedCards, cardId]; // Include the one just marked
        
        // Find potential replacement cards
        const replacementCandidates = allCards.filter(card => 
          !currentRecIds.includes(card.id) && 
          !allNotInterestedIds.includes(card.id)
        );
        
        if (replacementCandidates.length > 0) {
          // Sort replacements with some randomness for variety
          const sortedReplacements = replacementCandidates
            .map(card => ({ 
              card, 
              score: Math.random() * 100 // Random score for variety
            }))
            .sort((a, b) => b.score - a.score);
            
          // Take the top replacement
          const replacement = sortedReplacements[0];
          
          // Add the replacement to recommendations
          updatedRecs.push({
            card: replacement.card,
            reason: "Additional card for your consideration",
            score: 50,
          } as RecommendedCard); // Use type assertion to force compatibility
        }
      }
      
      return updatedRecs;
    });
  };

   // handle remove from not interested
  const handleRemoveFromNotInterested = (cardId: string) => {
    setNotInterestedCards(prev => {
      const updatedList = prev.filter(id => id !== cardId);
      
      if (updatedList.length === 0) {
        setTimeout(() => {
          setShowNotInterestedList(false);
        }, 100);
      }
      
      return updatedList;
    });
  };

  // handle card selection from search
  const handleCardSelection = (cardToAdd: CreditCardDetails) => {
    setLoading(true);
    setError(null);

    try {
      if (user) {
        addDoc(collection(db, 'user_cards'), {
          cardId: cardToAdd.id,
          userId: user.uid,
          dateAdded: new Date()
        }).then(() => {
          setUserCards(prev => [...prev, cardToAdd]);
          showNotification('Card added successfully!', 'success');
          
          // Switch to results tab on mobile after adding card
          if (window.innerWidth < 768) {
            setActiveTab('results');
          }
        });
      } else {
        // For non-logged in users
        setUserCards(prev => [...prev, cardToAdd]);
        showNotification('Card added successfully!', 'success');
        
        if (window.innerWidth < 768) {
          setActiveTab('results');
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error adding card:', error);
      setError('Failed to add card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecommendations = () => {
    setShowUpdateButton(false);
    // This will trigger the useEffect to run with the latest data
  };

  // =========== DATA PROCESSING ===========
// Get comparison data for chart
const getComparisonData = () => {
  const chartCategories = ['dining', 'travel', 'grocery', 'gas', 'entertainment', 'rent'] as const;
  type CategoryKey = keyof CreditCardDetails['rewardRates'];

  // Use only the displayed recommended cards (up to 4)
  const displayedRecommendedCards = (manualRecommendations.length > 0 ? manualRecommendations : recommendations)
    .slice(0, 4)
    .map(rec => rec.card);

  return chartCategories.map(category => {
    const currentBestRate = userCards.length > 0 
      ? Math.max(...userCards.map(card => 
          card.rewardRates[category as CategoryKey] || 0))
      : 0;
      
    const recommendedBestRate = displayedRecommendedCards.length > 0
      ? Math.max(...displayedRecommendedCards.map(card => 
          card.rewardRates[category as CategoryKey] || 0))
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
  // Check if we're still loading card data
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading data... ({loadingState})</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment as we analyze your data.</p>
          <button 
            onClick={() => {
              setLoading(false);
              setLoadingAllCards(false);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Skip Loading
          </button>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              loadAllCards();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (cardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading card database...</p>
          <p className="text-sm text-gray-500 mt-2">We&apos;re finding the best cards for you.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ pointerEvents: 'auto' }} className="min-h-screen bg-gray-50 pt-20">
      {/* Notification Banner */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-30 max-w-md flex items-center shadow-lg rounded-lg px-4 py-3 transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-white border-l-4 border-green-500 text-green-800' :
            notification.type === 'error' ? 'bg-white border-l-4 border-red-500 text-red-800' :
            'bg-white border-l-4 border-blue-500 text-blue-800'
          }`}
        >
          <div className="flex items-center">
            <div className={`mr-3 ${
              notification.type === 'success' ? 'text-green-500' :
              notification.type === 'error' ? 'text-red-500' :
              'text-blue-500'
            }`}>
              {notification.type === 'success' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="ml-auto pl-3 text-gray-400 hover:text-gray-500"
            aria-label="Dismiss notification"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
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

      {/* Loading Overlay - Only show for global operations, not card search */}
      {loading && !cardSearchLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center backdrop-blur-sm pointer-events-none">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center pointer-events-auto">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Processing your request...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Mobile Navigation Tabs - Only visible on mobile */}
        <div className="lg:hidden mb-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex-1 px-4 py-3 text-center font-medium text-sm ${
                activeTab === 'input' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Input Data
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 px-4 py-3 text-center font-medium text-sm ${
                activeTab === 'results' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              View Results
            </button>
          </div>
        </div>

        {/* Summary Banner - Show on both tabs for mobile */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
            <p className="text-lg font-bold">{recommendations.slice(0, 4).length}</p>
          </div>
          <div>
            <p className="text-xs text-blue-600 uppercase font-medium">Optimizing For</p>
            <p className="text-lg font-bold capitalize">{optimizationPreference}</p>
          </div>
        </div>

        {/* Content Grid - Side by Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Input Sections */}
          <div className={`lg:col-span-4 space-y-6 ${activeTab === 'input' || window.innerWidth >= 1024 ? 'block' : 'hidden'}`}>
            {/* Card Type Toggle moved to Optimization Settings */}
            
            {/* Add Expense Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6" data-section="expense-form">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Track Expense</h2>
              <p className="text-sm text-gray-600 mb-4">
                Track your monthly expenses for personalized recommendations
              </p>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                      disabled={loading}
                      step="0.01"
                      min="0"
                    />
                  </div>
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
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : 'Add Expense'}
                </button>
              </form>
            </div>

            {/* Add Your Cards Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6" data-section="card-search">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Your Current Cards</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for your cards
                </label>
                
                {/* Enhanced Inline Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type at least 3 characters to search..."
                    className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {cardSearchLoading && searchTerm.length >= 3 && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    </div>
                  )}
                </div>
                
                {loading ? (
                  <div className="mt-2 p-2 text-center">
                    <div className="inline-block animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    <span className="ml-2 text-sm text-gray-600">Searching...</span>
                  </div>
                ) : (
                  searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-60 overflow-y-auto shadow-sm">
                      {searchResults.map((card: {cardKey: string; cardName: string; cardIssuer: string}) => (
                        <div
                          key={card.cardKey}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0 transition-colors"
                          onClick={() => {
                            // Handle card selection
                            fetchCardDetails(card.cardKey);
                          }}
                        >
                          <div className="font-medium">{card.cardName}</div>
                          <div className="text-sm text-gray-500">{card.cardIssuer}</div>
                        </div>
                      ))}
                    </div>
                  )
                )}
                
                {searchTerm.length >= 3 && !loading && searchResults.length === 0 && (
                  <div className="mt-2 p-3 text-center text-gray-500 bg-gray-50 rounded-md border border-gray-200">
                    No cards found matching your search
                  </div>
                )}

                {searchTerm.length > 0 && searchTerm.length < 3 && (
                  <p className="mt-2 text-xs text-gray-500">
                    Please enter at least 3 characters to search
                  </p>
                )}
              </div>
            </div>

            {/* Optimization Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimization Settings</h2>
              
              {/* Card Type Selection - Moved here from elsewhere */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Type</label>
                <CardTypeToggle 
                  value={cardType}
                  onChange={setCardType}
                  className="w-full"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">What would you like to optimize for?</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">What&apos;s your credit score range?</label>
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
          <div className={`lg:col-span-8 space-y-6 ${activeTab === 'results' || window.innerWidth >= 1024 ? 'block' : 'hidden'}`}>
            {/* Expenses List */}
            <div className="bg-white rounded-lg shadow-sm border p-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Your Expenses</h3>
                <div className="flex items-center">
                  {expenses.length > 0 && (
                    <span className="text-sm text-gray-500 mr-2">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
                  )}
                  {/* Mobile quick-add button */}
                  <button 
                    className="lg:hidden text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    onClick={() => setActiveTab('input')}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
              
              {expenses.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-500 mb-2">No expenses added yet</p>
                  <button 
                    className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                    onClick={() => {
                      setActiveTab('input');
                      setTimeout(() => {
                        const element = document.querySelector('[data-section="expense-form"]');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                          element.classList.add('bg-blue-50');
                          setTimeout(() => element.classList.remove('bg-blue-50'), 2000);
                        }
                      }, 100);
                    }}
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
            <div className="bg-white rounded-lg shadow-sm border p-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Current Cards</h2>
                <div className="flex items-center">
                  {userCards.length > 0 && (
                    <span className="text-sm text-gray-500 mr-2">{userCards.length} card{userCards.length !== 1 ? 's' : ''}</span>
                  )}
                  {/* Mobile quick-add button */}
                  <button 
                    className="lg:hidden text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    onClick={() => setActiveTab('input')}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
              
              {userCards.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <p className="text-gray-500 mb-2">No cards added yet</p>
                  <button 
                    className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                    onClick={() => {
                      setActiveTab('input');
                      setTimeout(() => {
                        const element = document.querySelector('[data-section="card-search"]');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                          element.classList.add('bg-blue-50');
                          setTimeout(() => element.classList.remove('bg-blue-50'), 2000);
                        }
                      }, 100);
                    }}
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
            <div className="bg-white rounded-lg shadow-sm border p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recommended Cards</h2>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      handleRefreshRecommendations();
                      handleUpdateRecommendations();
                    }}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {manualRecommendations.length > 0 ? "Update Recommendations" : "Generate Recommendations"}
                  </button>
                  
                  {notInterestedCards.length > 0 && (
                    <button
                      onClick={prepareAndShowNotInterestedList}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <span>Not Interested ({notInterestedCards.length})</span>
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (!expenses.length && !userCards.length) ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-gray-500 mb-2">
                    Add expenses and cards to get personalized recommendations
                  </p>
                  <button 
                    className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                    onClick={() => {
                      setActiveTab('input');
                      setTimeout(() => {
                        const element = document.querySelector('[data-section="expense-form"]');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                          element.classList.add('bg-blue-50');
                          setTimeout(() => element.classList.remove('bg-blue-50'), 2000);
                        }
                      }, 100);
                    }}
                  >
                    Start by Adding Data
                  </button>
                </div>
              ) : manualRecommendations.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <p className="text-gray-500 mb-2">
                    {notInterestedCards.length > 0 
                      ? "No more recommendations available. Try reconsidering some cards."
                      : "Click the 'Generate Recommendations' button to see recommendations."}
                  </p>
                  {notInterestedCards.length > 0 && (
                    <button
                      onClick={() => setShowNotInterestedList(true)}
                      className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      View Not Interested Cards
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Only show the first 4 recommendations */}
                  {manualRecommendations.slice(0, 4).map(({ card, reason }) => (
                    <div key={card.id} className="relative">
                      <div className="absolute -top-2 left-4 right-4 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full text-center z-10 shadow-sm">
                        {reason}
                      </div>
                      <div className="pt-4">
                        <CardDisplay 
                          card={card} 
                          onNotInterested={handleNotInterested}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feature Comparison Table */}
            <div className="bg-white rounded-lg shadow-sm border p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Comparison</h2>
              
              {userCards.length === 0 || manualRecommendations.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-500 mb-2">Add cards or generate recommendations to see a comparison</p>
                  {userCards.length === 0 ? (
                    <button 
                      className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                      onClick={() => {
                        setActiveTab('input');
                        setTimeout(() => {
                          const element = document.querySelector('[data-section="card-search"]');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                            element.classList.add('bg-blue-50');
                            setTimeout(() => element.classList.remove('bg-blue-50'), 2000);
                          }
                        }, 100);
                      }}
                    >
                      Add Your Cards
                    </button>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      Generate recommendations in the Recommended Cards section to see a comparison.
                    </p>
                  )}
                </div>
              ) : (
                <FeatureTable 
                  currentCards={userCards}
                  recommendedCards={manualRecommendations.length > 0 ? manualRecommendations : recommendations}
                />
              )}
            </div>

            {/* Rewards Comparison Chart */}
            {(manualRecommendations.length > 0 || userCards.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border p-5 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rewards Rate Comparison</h2>
                
                {userCards.length === 0 || manualRecommendations.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-500">Add cards or generate recommendations to see reward rate comparisons</p>
                  </div>
                ) : (
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
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Stoid</h2>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:space-x-12 text-sm text-gray-500 text-center md:text-left">
              <div className="mb-4 md:mb-0">
                <h3 className="font-medium text-gray-700 mb-2">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-blue-600 transition-colors">How It Works</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Credit Card Guides</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
                </ul>
              </div>
              
              <div className="mb-4 md:mb-0">
                <h3 className="font-medium text-gray-700 mb-2">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-8 mt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 mb-4 md:mb-0">© {new Date().getFullYear()} Stoid. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
              
              <a href="#" className="text-gray-400 hover:text-gray-500" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              
              <a href="#" className="text-gray-400 hover:text-gray-500" aria-label="GitHub">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Not Interested Modal */}
      {showNotInterestedList && (
        <div className="z-35">
          <SimpleNotInterestedList
            notInterestedIds={notInterestedCards}
            notInterestedCards={preparedNotInterestedCards}
            onRemove={handleRemoveFromNotInterested}
            onClose={() => setShowNotInterestedList(false)}
          />
        </div>
      )}
      
      {/* Data Security Badge - Adds credibility */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-10 pointer-events-none">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex items-center pointer-events-auto">
          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs text-gray-600">256-bit Secure | SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
}