'use client';

import { useState, useEffect, useCallback } from 'react';
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
import UpdateRecommendationsButton from '@/components/UpdateRecommendationsButton';
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
  
  // Use the cards hook instead of static import
  const { cards: creditCards, loading: cardsLoading } = useCards();
  
  // =========== STATE MANAGEMENT ===========
  // User inputs
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  
  // Data
  const [expenses, setExpenses] = useState<LoadedExpense[]>([]);
  const [userCards, setUserCards] = useState<CreditCardDetails[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedCard[]>([]);
  const [allCards, setAllCards] = useState<CreditCardDetails[]>([]);
  const [loadingAllCards, setLoadingAllCards] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedCard, setSelectedCard] = useState<string>('');
  const [cardSearchLoading, setCardSearchLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shouldShowRecommendations = expenses.length > 0 || userCards.length > 0;
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
  } | null>(null);

  // Add cleanup effect to ensure body styles are reset
  useEffect(() => {
    return () => {
      // Reset body styles when component unmounts
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

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

  // Show notification
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setNotification({ message, type, id });
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotification(current => current?.id === id ? null : current);
    }, 4000);
  }, []);

  // =========== LOCAL STORAGE DATA PERSISTENCE ===========
  // Move useEffect to top level and put condition inside
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

  // Save data for non-logged in users  
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

  // Add useEffect to load all cards
  const loadAllCards = useCallback(async () => {
    console.log('Starting to load all cards');
    setLoadingAllCards(true);
    
    try {
      // Use a server endpoint that returns all cards
      const response = await fetch('/api/cards/all');
      if (!response.ok) {
        throw new Error('Failed to load card database');
      }
      
      const data = await response.json();
      console.log(`Loaded ${data.data.length} cards from ${data.source || 'unknown'} source`);
      
      // Filter based on card type
      let filteredCards;
    
      if (cardType === 'personal') {
        filteredCards = filterPersonalCards(data.data);
      } else if (cardType === 'business') {
        filteredCards = filterBusinessCards(data.data);
      } else {
        filteredCards = data.data;
      }
          
      console.log(`Showing ${filteredCards.length} ${cardType} cards`);
      setAllCards(filteredCards); 
      
      console.log('Successfully loaded cards');
    } catch (error) {
      console.error('Error loading all cards:', error);
      setError('Failed to load card database');
      
      setAllCards([]); 
    } finally {
      console.log('Finished loading all cards attempt');
      setLoadingAllCards(false);
    }
  }, [cardType]);

  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('Loading timeout reached - forcing completion');
        setLoading(false);
        setLoadingAllCards(false);
        setError('Loading took too long. Please refresh the page.');
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timeout);
    }
  }, [loading]);
  

  // Fix the useEffect dependencies
  useEffect(() => {
    if (mounted) {
      loadAllCards();
    }
  }, [cardType, mounted, loadAllCards]); 

  const handleRefreshRecommendations = useCallback(async () => {
    setRefreshingRecommendations(true);
    setError(null);
  
    try {
      // Refresh all cards from API
      await loadAllCards();
      
      showNotification('Recommendations updated based on your latest inputs', 'success');
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError('Failed to update recommendations. Please try again.');
    } finally {
      setRefreshingRecommendations(false);
    }
  }, [loadAllCards, showNotification]);
    
  // When generating recommendations, use allCards parameter 
  // Inside the recommender useEffect
  useEffect(() => {
    if (!showUpdateButton && !loadingAllCards && allCards.length > 0) {
      try {
        console.log(`Generating recommendations with ${allCards.length} available cards`);
        
        // Filter out cards the user already has or isn't interested in
        const availableForRecommendation = allCards.filter((card: CreditCardDetails) => 
          !userCards.some(uc => uc.id === card.id) && 
          !notInterestedCards.includes(card.id)
        );
        
        console.log(`After filtering user cards and not interested, ${availableForRecommendation.length} cards remain`);
        
        // Get algorithm recommendations
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
        
        console.log(`Algorithm generated ${algorithmRecommendations.length} recommendations`);
        
        // Ensure we have at least 6-10 recommendations by adding random cards if needed
        let finalRecommendations = [...algorithmRecommendations];
        
        if (finalRecommendations.length < 6 && availableForRecommendation.length > 0) {
          console.log('Adding random cards to ensure sufficient recommendations');
          
          // Randomly select cards that aren't already in the recommendations
          const recommendedCardIds = finalRecommendations.map(rec => rec.card.id);
          const additionalCandidates = availableForRecommendation.filter(
            (card: CreditCardDetails) => !recommendedCardIds.includes(card.id)
          );
          
          // Randomly select from remaining cards
          const randomCards = additionalCandidates
            .sort(() => Math.random() - 0.5)
            .slice(0, 10 - finalRecommendations.length);
          
          const randomRecommendations = randomCards.map((card: CreditCardDetails) => ({
            card,
            reason: "Additional option for your consideration",
            score: 50,
            matchPercentage: 70,
            potentialAnnualValue: 500, // Default value
            complementScore: 40,       // Default value
            longTermValue: 600,        // Default value
            portfolioContribution: ["Adds diversity to your portfolio"] // Default value
          })) as ScoredCard[];
          
          finalRecommendations = [...finalRecommendations, ...randomRecommendations];
        }
        
        console.log(`Final recommendation count: ${finalRecommendations.length}`);
        setManualRecommendations(finalRecommendations);
        
        // Reset update button state after generating recommendations
        setShowUpdateButton(true);
      } catch (err) {
        console.error('Error updating recommendations:', err);
        setError('Failed to update recommendations.');
        setShowUpdateButton(true);
      }
    }
  }, [expenses, userCards, optimizationPreference, creditScore, zeroAnnualFee, notInterestedCards, loadingAllCards, allCards, showUpdateButton, loadAllCards, loadAllCards]);

  // Call load cards
  useEffect(() => {
    loadAllCards();
  }, []);

  // Save data for non-logged in users  
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const dataToSave = {
        optimizationPreference,
        creditScore,
        zeroAnnualFee,
        expenses,
        userCards,
        notInterestedCards
      };
      try {
        safeLocalStorage.setItem('cardPickerUserData', JSON.stringify(dataToSave));
      } catch (err) {
        console.error('Error saving data:', err);
        showNotification('Error saving your data locally.', 'error');
      }
    }
  }, [optimizationPreference, creditScore, zeroAnnualFee, expenses, userCards, user, notInterestedCards, showNotification]);

  useEffect(() => {
    // Only search if we have at least 3 characters
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
        console.log('Search response:', data);
        
        // If we have results, filter out cards the user already has
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
    }, 500); // Debounce time
    
    return () => clearTimeout(timer);
  }, [searchTerm, userCards, loadAllCards]);
  
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
          // Don't throw here, just log the error
        }
  
        // Loading cards
        try {
          const cardsSnap = await getDocs(
            query(collection(db, 'user_cards'), 
            where('userId', '==', user.uid))
          );
          
          const userCardIds = cardsSnap.docs.map(doc => doc.data().cardId);
          
          // Use our dynamic card data source
          if (creditCards && creditCards.length > 0) {
            const loadedCards = creditCards.filter(card => userCardIds.includes(card.id));
            setUserCards(loadedCards);
          }
        } catch (cardError) {
          console.error('Error loading cards:', cardError);
          // Don't throw here, just log the error
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
          // Don't throw here, just log the error
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

  useEffect(() => {
    console.log("Recommendations updated:", recommendations);
  }, [recommendations]);
  
  useEffect(() => {
    console.log("Not interested list updated:", notInterestedCards);
  }, [notInterestedCards]);

  useEffect(() => {
    console.log('Loading state changed:', loading);
  }, [loading]);

  // =========== EVENT HANDLERS ===========
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
  if (cardsLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
        <p className="text-gray-600">Loading card database...</p>
      </div>
    </div>;
  }
  
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
        <p className="text-gray-600">Loading application...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">

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

        {/* Loading Overlay - Only show for global operations, not card search */}
        {loading && !cardSearchLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )}

        {/* Card Search Loading Indicator - Only shown in the search area */}
        {cardSearchLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
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

            {/* Add Your Cards Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Your Current Cards</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search for your cards
                </label>
                
                {/* Simple Inline Search */}
                <div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type at least 3 characters to search..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  />
                  
                  {loading ? (
                    <div className="mt-2 p-2 text-center">
                      <div className="inline-block animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      <span className="ml-2 text-sm text-gray-600">Searching...</span>
                    </div>
                  ) : (
                    searchResults.length > 0 && (
                      <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
                        {searchResults.map((card: {cardKey: string; cardName: string; cardIssuer: string}) => (
                          <div
                            key={card.cardKey}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0"
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
                    <div className="mt-2 p-3 text-center text-gray-500 bg-gray-50 rounded-md">
                      No cards found matching your search
                    </div>
                  )}
                </div>
              </div>
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

              {/* Card Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Type</label>
                <CardTypeToggle 
                  value={cardType}
                  onChange={setCardType}
                />
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
                <p className="text-lg font-bold">{recommendations.slice(0, 4).length}</p>
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-lg font-semibold">Recommended Cards</h2>
                <div className="flex space-x-4 mt-2 sm:mt-0">
                  {/* Add the update recommendations button here */}
                  <UpdateRecommendationsButton 
                    onClick={handleRefreshRecommendations} 
                    loading={refreshingRecommendations}
                    className="mb-2 sm:mb-0"
                  />
                  
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

              <div className="flex justify-center mb-6">
                <button
                  onClick={handleUpdateRecommendations}
                  disabled={loading || expenses.length === 0 && userCards.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-lg font-medium disabled:opacity-50 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Update Recommendations</span>
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (!expenses.length && !userCards.length) ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">
                    Add expenses and cards to get personalized recommendations
                  </p>
                </div>
              ) : manualRecommendations.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">
                    {notInterestedCards.length > 0 
                      ? "No more recommendations available. Try reconsidering some cards."
                      : "Click the 'Update Recommendations' button to generate recommendations."}
                  </p>
                  {notInterestedCards.length > 0 && (
                    <button
                      onClick={() => setShowNotInterestedList(true)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800"
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
                      <div className="absolute -top-2 left-4 right-4 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full text-center z-10">
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
            <FeatureTable 
              currentCards={userCards}
              recommendedCards={manualRecommendations.length > 0 ? manualRecommendations : recommendations}
            />

            {/* Rewards Comparison Chart */}
            {(manualRecommendations.length > 0 || userCards.length > 0) && (
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
            )}
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

      {showNotInterestedList && (
        <SimpleNotInterestedList
          notInterestedIds={notInterestedCards}
          notInterestedCards={preparedNotInterestedCards}
          onRemove={handleRemoveFromNotInterested}
          onClose={() => setShowNotInterestedList(false)}
        />
      )}
    </div>
  );
}