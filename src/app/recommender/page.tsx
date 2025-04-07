'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, Firestore, CollectionReference, DocumentData, updateDoc } from 'firebase/firestore';
import type { 
  OptimizationPreference, 
  CreditCardDetails,
  FirestoreExpense,
  LoadedExpense,
  RecommendedCard,
  ApiResponse,
  UserPreferences,
  SearchResultCard
} from '@/types/cards';
import { useLoadingState, LoadingState } from '@/hooks/useLoadingState';
import { getCardRecommendations } from '@/lib/cardRecommendations';
import { useCards } from '@/hooks/useCards';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { Logger } from '@/utils/logger';
import { FIREBASE_COLLECTIONS } from '@/lib/firebase';
import safeStorage from '@/utils/safeStorage';
import Link from 'next/link';
import cardSearchIndex from '@/services/cardSearchIndex';
import { cardCache as persistentCardCache } from '@/lib/utils/cardCache';
import cardDataService from '@/services/cardDataService';

// Dynamically import recharts chart component
const DynamicRewardsChart = dynamic(() => import('@/components/RewardsChart'), { ssr: false });

// Safe storage access wrapper
const getSafeStorageItem = (key: string) => {
  try {
    return safeStorage.getItem(key);  } catch (error) {
    console.error('Error accessing storage:', error);
    return null;
  }
};

const setSafeStorageItem = (key: string, value: string) => {
  try {
    safeStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Error setting storage:', error);
    return false;
  }
};

// Type guard for Firestore instance
const isFirestore = (db: Firestore | null): db is Firestore => {
  return db !== null;
};

// Card filtering utilities - update to respect explicit cardType property
const filterPersonalCards = (cards: CreditCardDetails[]): CreditCardDetails[] => {
  // Consider cards with cardType 'personal' or cards with no cardType specified
  return cards.filter(card => card.cardType === 'personal' || !card.cardType);
};

const filterBusinessCards = (cards: CreditCardDetails[]): CreditCardDetails[] => {
  // Only consider cards with explicit 'business' cardType
  return cards.filter(card => card.cardType === 'business');
};

// Dynamically import components that use browser APIs
const DynamicFeatureTable = dynamic(
  () => import('@/components/FeatureTable'),
  { ssr: false }
);

const DynamicCardDisplay = dynamic(
  () => import('@/components/CardDisplay').then(mod => mod.CardDisplay),
  { ssr: false }
);

const DynamicSimpleNotInterestedList = dynamic(
  () => import('@/components/SimpleNotInterestedList'),
  { ssr: false }
);

const DynamicCardTypeToggle = dynamic(
  () => import('@/components/CardTypeToggle'),
  { ssr: false }
);

// Add these type definitions at the top of the file
type CardTypeToggleProps = {
  value: 'personal' | 'business' | 'both';
  onChange: (type: 'personal' | 'business' | 'both') => void;
  className?: string;
};

type CardDisplayProps = {
  card: CreditCardDetails;
  onDelete?: () => void;
  onNotInterested?: () => void;
  reason?: string;
};

type FeatureTableProps = {
  currentCards: CreditCardDetails[];
  recommendedCards: RecommendedCard[];
};

const RecommenderPage = () => {
  // Use a ref to check if this is the initial mount
  const mountRef = useRef(false);
  
  // Add a state for window width
  const [windowWidth, setWindowWidth] = useState(0);
  
  // Log only on initial mount and set window width
  useEffect(() => {
    if (!mountRef.current) {
      console.log('RecommenderPage mounting, checking initial render');
      mountRef.current = true;
      
      // Set window width on client side
      setWindowWidth(window.innerWidth);
      
      // Add resize listener
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  const { user } = useAuth();
  const [userCardIds, setUserCardIds] = useState<string[]>([]);
  
  // Only use useCards when we have specific card keys to fetch
  const { cards: userCreditCards, loading: userCardsLoading } = useCards(userCardIds);
  
  // =========== STATE MANAGEMENT ===========
  // User inputs
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
  const [cardType, setCardType] = useState<'personal' | 'business' | 'both'>('personal');
  const { loading, error, setLoadingState, clearError, isLoading, isError, isReady } = useLoadingState('ready');
  
  // Data
  const [expenses, setExpenses] = useState<LoadedExpense[]>([]);
  const [userCards, setUserCards] = useState<CreditCardDetails[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedCard[]>([]);
  const [allCards, setAllCards] = useState<CreditCardDetails[]>([]);
  const [loadingAllCards, setLoadingAllCards] = useState(false);
  const [cardSearchLoading, setCardSearchLoading] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
  } | null>(null);

  const router = useRouter();
  
  // Calculate total expenses at the top level to ensure it's available everywhere
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Add a local storage utility for anonymous users
  const getLocalStorageCards = (): CreditCardDetails[] => {
    if (typeof window === 'undefined') return [];
    try {
      const storedCards = localStorage.getItem('anonymousCards');
      return storedCards ? JSON.parse(storedCards) : [];
    } catch (error) {
      console.error('Error reading cards from localStorage:', error);
      return [];
    }
  };

  const saveLocalStorageCards = (cards: CreditCardDetails[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('anonymousCards', JSON.stringify(cards));
    } catch (error) {
      console.error('Error saving cards to localStorage:', error);
    }
  };

  const getLocalStorageExpenses = (): LoadedExpense[] => {
    if (typeof window === 'undefined') return [];
    try {
      const storedExpenses = localStorage.getItem('anonymousExpenses');
      return storedExpenses ? JSON.parse(storedExpenses) : [];
    } catch (error) {
      console.error('Error reading expenses from localStorage:', error);
      return [];
    }
  };

  const saveLocalStorageExpenses = (expenses: LoadedExpense[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('anonymousExpenses', JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving expenses to localStorage:', error);
    }
  };

  // Add the loadExpenses function implementation
  const loadExpenses = async () => {
    // For anonymous users, load from localStorage
    if (!user || !db || !isFirestore(db)) {
      const localExpenses = getLocalStorageExpenses();
      setExpenses(localExpenses);
      Logger.info(`Loaded ${localExpenses.length} local expenses`, { 
        context: 'RecommenderPage',
        data: { count: localExpenses.length }
      });
      return;
    }

    try {
      setLoadingState('loading');
      const expensesRef = collection(db, FIREBASE_COLLECTIONS.EXPENSES);
      const q = query(expensesRef, where('userId', '==', user.uid), orderBy('date', 'desc'));
      const expensesSnap = await getDocs(q);
      
      const loadedExpenses: LoadedExpense[] = expensesSnap.docs.map(doc => {
        const data = doc.data() as FirestoreExpense;
        // Handle Firestore timestamp conversion safely
        let expenseDate: Date;
        if (data.date) {
          // Check if it's a Firestore timestamp with toDate method
          if (typeof data.date === 'object' && 'toDate' in data.date && typeof data.date.toDate === 'function') {
            expenseDate = data.date.toDate();
          } else if (data.date instanceof Date) {
            // It's already a Date object
            expenseDate = data.date;
          } else {
            // Try to parse it as a date string
            expenseDate = new Date(data.date as any);
          }
        } else {
          // Fallback to current date if no date provided
          expenseDate = new Date();
        }
        
        return {
          id: doc.id,
          amount: data.amount,
          category: data.category,
          date: expenseDate,
          userId: data.userId
        };
      });
      
      setExpenses(loadedExpenses);
      Logger.info(`Loaded ${loadedExpenses.length} expenses`, { 
        context: 'RecommenderPage',
        data: { count: loadedExpenses.length }
      });
    } catch (error) {
      Logger.error('Error loading expenses', { 
        context: 'RecommenderPage',
        data: error 
      });
      setLoadingState('error', 'Failed to load expenses');
    }
  };

  // Implement proper deleteExpense function
  const deleteExpense = async (expenseId: string) => {
    // For anonymous users
    if (!user || !db || !isFirestore(db)) {
      const localExpenses = getLocalStorageExpenses();
      const updatedExpenses = localExpenses.filter(exp => exp.id !== expenseId);
      saveLocalStorageExpenses(updatedExpenses);
      
      // Update local state
      setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== expenseId));
      showNotification('Expense deleted successfully', 'success');
      return;
    }

    try {
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.EXPENSES, expenseId));
      
      // Update local state
      setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== expenseId));
      showNotification('Expense deleted successfully', 'success');
    } catch (error) {
      Logger.error('Error deleting expense', { 
        context: 'RecommenderPage',
        data: error 
      });
      showNotification('Failed to delete expense', 'error');
    }
  };

  // Add implementation for handleAddCard
  const addCardToUser = async (card: CreditCardDetails) => {
    // If no login, use localStorage
    if (!user || !db || !isFirestore(db)) {
      // Check if the card is already added
      const anonymousCards = getLocalStorageCards();
      if (anonymousCards.some(c => c.id === card.id)) {
        showNotification('This card is already in your collection', 'info');
        return;
      }

      // Add the card to local storage
      const updatedCards = [...anonymousCards, card];
      saveLocalStorageCards(updatedCards);
      
      // Update local state to include the new card
      setUserCardIds(prev => [...prev, card.id]);
      setUserCards(prev => [...prev, card]);
      
      // Remove from not interested if it was there
      if (notInterestedCards.includes(card.id)) {
        setNotInterestedCards(prev => prev.filter(id => id !== card.id));
        // Also save to localStorage
        const notInterested = notInterestedCards.filter(id => id !== card.id);
        try {
          localStorage.setItem('notInterestedCards', JSON.stringify(notInterested));
        } catch (e) {
          console.error('Error saving not interested cards', e);
        }
      }
      
      showNotification(`${card.name || card.id} added to your collection`, 'success');
      
      // Refresh recommendations
      setShowUpdateButton(true);
      return;
    }

    try {
      // First check if the card is already in the user's collection
      const cardsRef = collection(db, FIREBASE_COLLECTIONS.USER_CARDS);
      const q = query(cardsRef, 
        where('userId', '==', user.uid),
        where('cardId', '==', card.id)
      );
      const existingCards = await getDocs(q);
      
      if (!existingCards.empty) {
        showNotification('This card is already in your collection', 'info');
        return;
      }
      
      // Add the card to the user's collection
      await addDoc(collection(db, FIREBASE_COLLECTIONS.USER_CARDS), {
        userId: user.uid,
        cardId: card.id,
        dateAdded: new Date()
      });
      
      // Update local state to include the new card
      setUserCardIds(prev => [...prev, card.id]);
      setUserCards(prev => [...prev, card]);
      
      // Remove from not interested if it was there
      if (notInterestedCards.includes(card.id)) {
        setNotInterestedCards(prev => prev.filter(id => id !== card.id));
      }
      
      showNotification(`${card.name || card.id} added to your collection`, 'success');
      
      // Refresh recommendations
      setShowUpdateButton(true);
    } catch (error) {
      Logger.error('Error adding card to user', { 
        context: 'RecommenderPage',
        data: error 
      });
      showNotification('Failed to add card to your collection', 'error');
    }
  };

  // Implement handleDeleteCard
  const handleDeleteCard = async (cardId: string) => {
    // For anonymous users
    if (!user || !db || !isFirestore(db)) {
      const anonymousCards = getLocalStorageCards();
      const updatedCards = anonymousCards.filter(card => card.id !== cardId);
      saveLocalStorageCards(updatedCards);
      
      // Update local state
      setUserCardIds(prev => prev.filter(id => id !== cardId));
      setUserCards(prev => prev.filter(card => card.id !== cardId));
      
      showNotification('Card removed from your collection', 'success');
      
      // Refresh recommendations
      setShowUpdateButton(true);
      return;
    }

    try {
      // Find the card document to delete
      const cardsRef = collection(db, FIREBASE_COLLECTIONS.USER_CARDS);
      const q = query(cardsRef, 
        where('userId', '==', user.uid),
        where('cardId', '==', cardId)
      );
      const cardDocs = await getDocs(q);
      
      if (cardDocs.empty) {
        showNotification('Card not found in your collection', 'error');
        return;
      }
      
      // Delete the card document
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.USER_CARDS, cardDocs.docs[0].id));
      
      // Update local state
      setUserCardIds(prev => prev.filter(id => id !== cardId));
      setUserCards(prev => prev.filter(card => card.id !== cardId));
      
      showNotification('Card removed from your collection', 'success');
      
      // Refresh recommendations
      setShowUpdateButton(true);
    } catch (error) {
      Logger.error('Error removing card', { 
        context: 'RecommenderPage',
        data: error 
      });
      showNotification('Failed to remove card from your collection', 'error');
    }
  };

  // Implement handleNotInterested
  const handleNotInterested = (cardId: string) => {
    setNotInterestedCards(prev => [...prev, cardId]);
    
    // Filter out the card from recommendations
    const updateRecommendations = manualRecommendations.filter(rec => rec.card.id !== cardId);
    setManualRecommendations(updateRecommendations);
    
    showNotification('Card added to not interested list', 'info');
  };

  // Implement handleRemoveFromNotInterested
  const handleRemoveFromNotInterested = (cardId: string) => {
    setNotInterestedCards(prev => prev.filter(id => id !== cardId));
    setShowNotInterestedList(false);
    showNotification('Card removed from not interested list', 'success');
    
    // Refresh recommendations
    setShowUpdateButton(true);
  };

  // Implement handleUpdateRecommendations
  const handleUpdateRecommendations = () => {
    // Use the memoized availableForRecommendation
    const algorithmRecommendations = getCardRecommendations({
      expenses,
      currentCards: userCards,
      optimizationSettings: {
        preference: optimizationPreference,
        zeroAnnualFee
      },
      creditScore,
      excludeCardIds: notInterestedCards,
      availableCards: availableForRecommendation
    });
    
    setManualRecommendations(algorithmRecommendations);
    setShowUpdateButton(false);
  };

  // Find existing cardCache declaration:
  // const cardCache = useRef<Record<string, CreditCardDetails>>({});
  // And replace it with:
  const cardCacheRef = useRef<Record<string, CreditCardDetails>>({});

  // Then update the fetchCardDetails function:
  const fetchCardDetails = async (cardKey: string) => {
    console.log('Fetching card details for:', cardKey);
    
    try {
      // First check if card exists in the imported cardCache utility
      const persistentCachedCard = persistentCardCache.getCard(cardKey);
      if (persistentCachedCard) {
        console.log('Using persistent cached card details for:', cardKey);
        
        // Add to user collection (optimistic update)
        setUserCards(prev => [...prev, persistentCachedCard]);
        setUserCardIds(prev => [...prev, cardKey]);
        showNotification(`${persistentCachedCard.name || cardKey} added to your collection`, 'success');
        
        // Clear search state immediately for responsive UX
        setSearchTerm('');
        setSearchResults([]);
        setShowUpdateButton(true);
        
        // Process in background
        setTimeout(() => {
          // Add to localStorage for persistence
          if (!user) {
            const localCards = getLocalStorageCards();
            saveLocalStorageCards([...localCards, persistentCachedCard]);
          } else if (db && isFirestore(db)) {
            // Add to Firestore if user is logged in (non-blocking)
            try {
              addDoc(collection(db, FIREBASE_COLLECTIONS.USER_CARDS), {
                userId: user.uid,
                cardId: persistentCachedCard.id,
                dateAdded: new Date()
              }).catch(e => console.error('Background save error:', e));
            } catch (e) {
              console.error('Error preparing Firestore operation:', e);
            }
          }
        }, 100);
        
        return;
      }
      
      // Also check in-memory cache for session
      const inMemoryCachedCard = cardCache.current[cardKey];
      if (inMemoryCachedCard) {
        console.log('Using in-memory cached card details for:', cardKey);
        
        // Add to user collection (optimistic update)
        setUserCards(prev => [...prev, inMemoryCachedCard]);
        setUserCardIds(prev => [...prev, cardKey]);
        showNotification(`${inMemoryCachedCard.name || cardKey} added to your collection`, 'success');
        
        // Clear search state immediately for responsive UX
        setSearchTerm('');
        setSearchResults([]);
        setShowUpdateButton(true);
        
        // Save to persistent cache for future use
        persistentCardCache.setCard(cardKey, inMemoryCachedCard);
        
        // Process in background
        setTimeout(() => {
          // Add to localStorage for persistence
          if (!user) {
            const localCards = getLocalStorageCards();
            saveLocalStorageCards([...localCards, inMemoryCachedCard]);
          } else if (db && isFirestore(db)) {
            // Add to Firestore if user is logged in (non-blocking)
            try {
              addDoc(collection(db, FIREBASE_COLLECTIONS.USER_CARDS), {
                userId: user.uid,
                cardId: inMemoryCachedCard.id,
                dateAdded: new Date()
              }).catch(e => console.error('Background save error:', e));
            } catch (e) {
              console.error('Error preparing Firestore operation:', e);
            }
          }
        }, 100);
        
        return;
      }
      
      // For non-cached cards, show loading state but still update UI immediately
      setCardSearchLoading(true);
      
      // Create optimistic placeholder card with skeleton loading appearance
      const placeholderCard = {
        id: cardKey,
        name: `Loading ${cardKey}...`,
        issuer: 'Loading...',
        annualFee: 0,
        rewardRates: {
          dining: 1, travel: 1, grocery: 1, gas: 1, entertainment: 1,
          rent: 1, other: 1, drugstore: 1, streaming: 1
        },
        creditScoreRequired: 'fair',
        perks: [],
        foreignTransactionFee: false,
        categories: [],
        description: 'Loading card details...',
        cardType: 'personal',
        isLoading: true // Add this flag for UI to show skeleton state
      };
      
      // Add placeholder card immediately
      setUserCards(prev => [...prev, placeholderCard as any]);
      setUserCardIds(prev => [...prev, cardKey]);
      
      // Clear search state for responsive UX
      setSearchTerm('');
      setSearchResults([]);
      
      // Define a fallback handler to still provide a usable card even if API fails
      const handleCardFetchFailure = () => {
        console.log('Using fallback card creation for', cardKey);
        
        // Create a fallback card with basic info
        const fallbackCard: CreditCardDetails = {
          id: cardKey,
          name: cardKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          issuer: 'Unknown',
          annualFee: 0,
          rewardRates: {
            dining: 1, travel: 1, grocery: 1, gas: 1, entertainment: 1,
            rent: 1, other: 1, drugstore: 1, streaming: 1
          },
          creditScoreRequired: 'fair',
          perks: [],
          foreignTransactionFee: false,
          categories: [],
          description: 'Limited information available for this card.',
          cardType: 'personal'
        };
        
        // Cache the fallback card
        cardCache.current[cardKey] = fallbackCard;
        persistentCardCache.setCard(cardKey, fallbackCard);
        
        // Update the UI
        setUserCards(prev => prev.map(card => 
          card.id === cardKey ? fallbackCard : card
        ));
        
        // Save to persistence
        if (!user) {
          const localCards = getLocalStorageCards();
          saveLocalStorageCards([...localCards.filter(c => c.id !== cardKey), fallbackCard]);
        }
        
        showNotification(`Added ${fallbackCard.name} to your collection (limited info)`, 'info');
        setCardSearchLoading(false);
        setShowUpdateButton(true);
      };
      
      // Fetch actual card details in background
      const fetchInBackground = async () => {
        try {
          // Try to fetch using our new API helper with fallback
          const cardData = await fetchCardDetailsFromAPI(cardKey);
          
          if (cardData) {
            // Replace placeholder with real card
            setUserCards(prev => prev.map(card => 
              card.id === cardKey ? cardData : card
            ));
            
            // Save to persistence
            if (!user) {
              const localCards = getLocalStorageCards();
              saveLocalStorageCards([...localCards.filter(c => c.id !== cardKey), cardData]);
            } else if (db && isFirestore(db)) {
              try {
                // Check if already exists
                const cardsRef = collection(db, FIREBASE_COLLECTIONS.USER_CARDS);
                const q = query(cardsRef, 
                  where('userId', '==', user.uid), 
                  where('cardId', '==', cardKey)
                );
                const existingCards = await getDocs(q);
                
                if (existingCards.empty) {
                  await addDoc(collection(db, FIREBASE_COLLECTIONS.USER_CARDS), {
                    userId: user.uid,
                    cardId: cardData.id,
                    dateAdded: new Date()
                  });
                }
              } catch (e) {
                console.error('Error saving to Firestore:', e);
              }
            }
            
            showNotification(`${cardData.name || cardKey} added to your collection`, 'success');
          } else {
            // Handle failure with fallback
            handleCardFetchFailure();
          }
        } catch (error) {
          console.error('Error fetching card details:', error);
          
          // Use fallback on error
          handleCardFetchFailure();
        } finally {
          setCardSearchLoading(false);
          setShowUpdateButton(true);
        }
      };
      
      // Start background fetch
      fetchInBackground();
      
    } catch (error) {
      console.error('Error in fetchCardDetails:', error);
      setCardSearchLoading(false);
      showNotification('Error adding card', 'error');
    }
  };

  // Improve the handleAddExpense implementation to save to the database
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Add expense:', { amount, category });
    
    if (!amount || !category) {
      showNotification('Please enter an amount and select a category', 'error');
      return;
    }
    
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }
    
    // For non-logged in users, use localStorage
    if (!user || !db || !isFirestore(db)) {
      const newExpense: LoadedExpense = {
        id: `expense-${Date.now()}`,
        amount: numAmount,
        category,
        date: new Date(),
        userId: 'anonymous'
      };
      
      const localExpenses = getLocalStorageExpenses();
      const updatedExpenses = [newExpense, ...localExpenses];
      saveLocalStorageExpenses(updatedExpenses);
      
      setExpenses(prev => [newExpense, ...prev]);
      showNotification('Expense added successfully', 'success');
      
      // Clear form
      setAmount('');
      setCategory('');
      return;
    }
    
    // If logged in, save to Firebase
    try {
      const expenseData: Omit<FirestoreExpense, 'id'> = {
        amount: numAmount,
        category,
        date: new Date(),
        userId: user.uid
      };
      
      const docRef = await addDoc(collection(db, FIREBASE_COLLECTIONS.EXPENSES), expenseData);
      
      // Add to local state with the new ID
      const newExpense: LoadedExpense = {
        id: docRef.id,
        amount: numAmount,
        category,
        date: new Date(),
        userId: user.uid
      };
      
      setExpenses(prev => [newExpense, ...prev]);
      showNotification('Expense added successfully', 'success');
    } catch (error) {
      console.error('Error adding expense:', error);
      showNotification('Failed to add expense', 'error');
    }
    
    // Clear form
    setAmount('');
    setCategory('');
  };

  // Add this useEffect to initialize the search index when the component mounts
  useEffect(() => {
    // Initialize the search index in the background
    const initializeSearchIndex = async () => {
      const success = await cardSearchIndex.initialize();
      if (success) {
        console.log('Search index initialized successfully');
      }
    };
    
    initializeSearchIndex();
  }, []);

  // Replace the search useEffect with this optimized version
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }
    
    // Keep track of the current search term to prevent stale updates
    const currentSearchTerm = searchTerm;
    
    // Set loading state
    setCardSearchLoading(true);
    
    // Use the search index for instant results
    const performSearch = async () => {
      try {
        // First try the local search index
        let results = cardSearchIndex.search(currentSearchTerm);
        
        // If we have results, use them immediately
        if (results.length > 0) {
          // Filter out cards already in user's collection
          const filtered = results.filter(
            (card) => !userCards.some(userCard => userCard.id === card.cardKey)
          );
          setSearchResults(filtered);
          setCardSearchLoading(false);
          console.log(`Local search completed instantly, found ${filtered.length} results`);
          return;
        }
        
        // If local search returned no results, fall back to API
        console.log('No local results, falling back to API search');
        
        // Set a timeout for the API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const startTime = performance.now();
        const response = await fetch(`/api/cards/search?q=${encodeURIComponent(currentSearchTerm)}`, {
          signal: controller.signal
        }).catch(error => {
          if (error.name === 'AbortError') {
            throw new Error('Search request timed out');
          }
          throw error;
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        const endTime = performance.now();
        console.log(`API search completed in ${Math.round(endTime - startTime)}ms, found ${data.data?.length || 0} results`);
        
        if (data.success && data.data) {
          // Cache results locally for next time
          if (searchCache.current) {
            searchCache.current[currentSearchTerm] = data.data;
          }
          
          const filtered = data.data.filter(
            (card: SearchResultCard) => !userCards.some(userCard => userCard.id === card.cardKey)
          );
          setSearchResults(filtered);
        } else {
          setSearchResults([]);
          console.warn('Search returned no results or an error:', data.error);
        }
      } catch (error) {
        console.error('Error searching cards:', error);
        setSearchResults([]);
      } finally {
        setCardSearchLoading(false);
      }
    };
    
    // Short timeout to prevent rapid typing from triggering too many searches
    const timer = setTimeout(() => {
      performSearch();
    }, 300); // Reduced from 750ms to 300ms for better responsiveness
    
    return () => clearTimeout(timer);
  }, [searchTerm, userCards]);

  // Add the debounce utility function first, before it's used
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return function(...args: Parameters<T>) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  };

  // Direct callback without useCallback to avoid circular dependencies 
  function handleCardTypeChange(newType: 'personal' | 'business' | 'both') {
    setCardType(newType);
    setShowUpdateButton(true);
  }

  // Memoize the filtered cards available for recommendation
  const availableForRecommendation = useMemo(() => {
    return allCards.filter((card: CreditCardDetails) => 
      !userCards.some(uc => uc.id === card.id) && 
      !notInterestedCards.includes(card.id)
    );
  }, [allCards, userCards, notInterestedCards]);

  // Add this after the function handleUpdateRecommendations
  const getComparisonData = () => {
    // Get the best reward rate for each category from current cards
    const currentBestRates: Record<string, number> = {};
    
    // Categories we'll compare
    const categoriesToCompare = ['dining', 'travel', 'grocery', 'gas', 'entertainment', 'other'];
    
    // Initialize best rates with 0
    categoriesToCompare.forEach(cat => {
      currentBestRates[cat] = 0;
    });
    
    // Find best rates among user's cards
    userCards.forEach(card => {
      if (card.rewardRates) {
        Object.entries(card.rewardRates).forEach(([category, rate]) => {
          if (categoriesToCompare.includes(category) && rate > (currentBestRates[category] || 0)) {
            currentBestRates[category] = rate;
          }
        });
      }
    });
    
    // Get the best reward rate for each category from recommended cards
    const recommendedBestRates: Record<string, number> = {};
    
    // Initialize recommended best rates with 0
    categoriesToCompare.forEach(cat => {
      recommendedBestRates[cat] = 0;
    });
    
    // Use either manual recommendations or algorithm recommendations
    const recsToUse = manualRecommendations.length > 0 ? manualRecommendations : recommendations;
    
    // Find best rates among recommended cards
    recsToUse.forEach(rec => {
      if (rec.card.rewardRates) {
        Object.entries(rec.card.rewardRates).forEach(([category, rate]) => {
          if (categoriesToCompare.includes(category) && rate > (recommendedBestRates[category] || 0)) {
            recommendedBestRates[category] = rate;
          }
        });
      }
    });
    
    // Format data for the chart
    return categoriesToCompare.map(category => ({
      category: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter
      'Current Best Rate': currentBestRates[category] || 0,
      'Recommended Best Rate': recommendedBestRates[category] || 0
    }));
  };

  // Memoize the comparison data calculation
  const comparisonData = useMemo(() => {
    return getComparisonData();
  }, [userCards, recommendations, manualRecommendations]);

  // Add this after the type guard
  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        Logger.warn(`Operation failed (attempt ${attempt}/${maxAttempts}):`, {
          context: 'RecommenderPage',
          data: { error, attempt }
        });
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError;
  };

  // Update loadUserCards to use retry
  const loadUserCards = async () => {
    // For anonymous users, load from localStorage
    if (!user || !db || !isFirestore(db)) {
      const anonymousCards = getLocalStorageCards();
      setUserCards(anonymousCards);
      setUserCardIds(anonymousCards.map(card => card.id));
      
      // Also load not interested cards
      try {
        const notInterested = localStorage.getItem('notInterestedCards');
        if (notInterested) {
          setNotInterestedCards(JSON.parse(notInterested));
        }
      } catch (e) {
        console.error('Error loading not interested cards', e);
      }
      
      setLoadingState('ready');
      return;
    }

    try {
      if (!db || !isFirestore(db)) {
        throw new Error('Firestore is not initialized');
      }

      await retryOperation(async () => {
        const cardsRef = collection(db, FIREBASE_COLLECTIONS.USER_CARDS);
        const q = query(cardsRef, where('userId', '==', user.uid));
        const cardsSnap = await getDocs(q);
        
        const cardIds = cardsSnap.docs.map(doc => doc.data().cardId);
        setUserCardIds(cardIds);
      });
    } catch (err) {
      const error = err as Error;
      Logger.error('Error loading user cards', { context: 'RecommenderPage', data: error.message });
      setLoadingState('error', 'Failed to load user cards');
      setUserCardIds([]);
    }
  };

  // Check Firebase initialization
  useEffect(() => {
    if (!db) {
      setLoadingState('error', 'Firebase is not properly initialized. Please check your environment variables.');
      return;
    }
    // Only set ready if we're not in another loading state
    if (loading === 'initializing') {
      setLoadingState('ready');
    }
  }, [db, loading, setLoadingState]);

  // Load all cards callback
  const loadAllCards = useCallback(async () => {
    if (!db) {
      Logger.error('Firestore is not initialized', { context: 'RecommenderPage' });
      setLoadingState('error', 'Firestore is not initialized. Please check your Firebase configuration.');
      return;
    }

    try {
      setLoadingAllCards(true);
      Logger.info('Loading all cards started', { context: 'RecommenderPage' });
      
      console.log('Fetching cards from API...');
      const response = await fetch('/api/cards/all');
      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load cards');
      }

      const cards = data.data as CreditCardDetails[];
      console.log('Sample card data:', cards[0]); // Log the first card to see its structure
      console.log('Card types in data:', new Set(cards.map(card => card.cardType))); // Log unique cardTypes
      
      let filteredCards = cards;
      if (cardType === 'personal') {
        filteredCards = filterPersonalCards(cards);
      } else if (cardType === 'business') {
        filteredCards = filterBusinessCards(cards);
      }
      // For 'both', use all cards
      
      console.log('Filtered Cards:', filteredCards.length);
      setAllCards(filteredCards);
      
      // Generate initial recommendations
      const initialRecommendations = getCardRecommendations({
        expenses: [], // No expenses for initial load - will use default spending pattern
        currentCards: [],
        optimizationSettings: {
          preference: optimizationPreference,
          zeroAnnualFee: zeroAnnualFee
        },
        creditScore: creditScore,
        excludeCardIds: notInterestedCards,
        availableCards: filteredCards
      });
      console.log('Initial Recommendations:', initialRecommendations);
      setRecommendations(initialRecommendations);
      setShowUpdateButton(false);
      
      Logger.info(`Loaded ${filteredCards.length} cards`, { 
        context: 'RecommenderPage',
        data: { cardCount: filteredCards.length }
      });
      
      // Set loading state to ready after cards are loaded
      if (loading !== 'ready') {
        setLoadingState('ready');
      }
    } catch (error) {
      console.error('Error in loadAllCards:', error);
      Logger.error('Error loading all cards', { 
        context: 'RecommenderPage',
        data: error 
      });
      setLoadingState('error', 'Failed to load cards. Please try again later.');
    } finally {
      setLoadingAllCards(false);
    }
  }, [cardType, setLoadingState, optimizationPreference, zeroAnnualFee, creditScore, notInterestedCards, loading]);

  // Initial load effect - only load cards, not user data for non-logged in users
  useEffect(() => {
    // Only load if not already loading cards and cards haven't been loaded yet
    if (!loadingAllCards && allCards.length === 0) {
      loadAllCards();
    }
  }, [loadAllCards, allCards.length, loadingAllCards]);

  // Load user data only when logged in
  useEffect(() => {
    if (!user || !db) return;
    
    let mounted = true;
    const loadUserData = async () => {
      try {
        // Loading expenses
        await loadExpenses();

        // Loading preferences
        try {
          const prefsDoc = await getDocs(
            query(collection(db, FIREBASE_COLLECTIONS.USER_PREFERENCES),
            where('userId', '==', user.uid))
          );
          
          if (!mounted) return;
          
          if (!prefsDoc.empty) {
            const prefs = prefsDoc.docs[0].data();
            const newOptPref = prefs.optimizationPreference || 'points';
            const newCreditScore = prefs.creditScore || 'good';
            const newZeroAnnualFee = prefs.zeroAnnualFee || false;

            if (optimizationPreference !== newOptPref) setOptimizationPreference(newOptPref);
            if (creditScore !== newCreditScore) setCreditScore(newCreditScore);
            if (zeroAnnualFee !== newZeroAnnualFee) setZeroAnnualFee(newZeroAnnualFee);
          }
        } catch (prefError) {
          if (!mounted) return;
          Logger.error('Error loading preferences', { data: prefError });
        }
      } catch (err) {
        if (!mounted) return;
        const error = err as Error;
        Logger.error('Error loading user data', { data: error.message });
      }
    };

    loadUserData();
    return () => {
      mounted = false;
    };
  }, [user, db]);

  // Load user's cards when user changes
  useEffect(() => {
    loadUserCards();
  }, [user]);

  // Update userCards when userCreditCards changes
  useEffect(() => {
    if (userCreditCards.length > 0) {
      setUserCards(userCreditCards);
    }
  }, [userCreditCards]);

  // Show notification callback
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setNotification({ message, type, id });
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotification(current => current?.id === id ? null : current);
    }, 4000);
  }, []);

  // Handle refresh recommendations callback
  const handleRefreshRecommendations = useCallback(async () => {
    setLoadingState('loading');

    try {
      await loadAllCards();
      showNotification('Recommendations updated based on your latest inputs', 'success');
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setLoadingState('error', 'Failed to update recommendations. Please try again.');
    }
  }, [loadAllCards, showNotification]);

  // =========== EFFECTS ===========
  // Load user data effect
  useEffect(() => {
    if (!user) {
      const savedData = getSafeStorageItem('cardPickerUserData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setOptimizationPreference(parsedData.optimizationPreference || 'points');
          setCreditScore(parsedData.creditScore || 'good');
          setZeroAnnualFee(parsedData.zeroAnnualFee || false);
          setExpenses(parsedData.expenses || []);
          setUserCards(parsedData.userCards || []);
          setNotInterestedCards(parsedData.notInterestedCards || []);
        } catch (error) {
          console.error('Error parsing saved data:', error);
        }
      }
    }
  }, [user]);

  // Save data effect
  useEffect(() => {
    if (!user) {
      const dataToSave = {
        optimizationPreference,
        creditScore,
        zeroAnnualFee,
        expenses,
        userCards,
        notInterestedCards,
      };
      setSafeStorageItem('cardPickerUserData', JSON.stringify(dataToSave));
    }
  }, [optimizationPreference, creditScore, zeroAnnualFee, expenses, userCards, notInterestedCards, user]);

  // Loading timeout effect
  useEffect(() => {
    if (!loading || loading === 'ready' || loading === 'error') {
      return;
    }

    const loadingTimeout = setTimeout(() => {
      setLoadingState('error', 'Loading timed out. Please refresh the page or try again later.');
    }, 15000);
    
    return () => clearTimeout(loadingTimeout);
  }, [loading, setLoadingState]);

  // Load cards effect - REMOVED this effect since it's redundant with the cardType dependency in loadAllCards

  // Generate recommendations effect
  useEffect(() => {
    const shouldGenerateRecommendations = 
      !showUpdateButton && 
      !loadingAllCards && 
      allCards.length > 0 && 
      loading !== 'loading-cards' &&
      loading !== 'loading';

    console.log('Recommendations Effect State:', {
      showUpdateButton,
      loadingAllCards,
      allCardsLength: allCards.length,
      loading,
      shouldGenerateRecommendations
    });

    if (shouldGenerateRecommendations) {
      try {
        // Use the memoized availableForRecommendation instead of recalculating it here
        console.log('Available for Recommendation:', availableForRecommendation.length);
        
        const algorithmRecommendations = getCardRecommendations({
          expenses,
          currentCards: userCards,
          optimizationSettings: {
            preference: optimizationPreference,
            zeroAnnualFee
          },
          creditScore,
          excludeCardIds: notInterestedCards,
          availableCards: availableForRecommendation
        });
        
        console.log('Algorithm Recommendations:', algorithmRecommendations);
        setRecommendations(algorithmRecommendations);
        
        // Always set loading to ready after recommendations are generated
        setLoadingState('ready');
      } catch (error) {
        console.error('Error generating recommendations:', error);
        setLoadingState('error', 'Failed to generate recommendations. Please try again.');
      }
    }
  }, [allCards, userCards, notInterestedCards, optimizationPreference, zeroAnnualFee, creditScore, showUpdateButton, loadingAllCards, loading, setLoadingState, expenses, availableForRecommendation]);

  // Search effect with improved error handling
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }
    
    // Keep track of the current search term to prevent stale updates
    const currentSearchTerm = searchTerm;
    
    // Cancel pending timeouts on component unmount or search term change
    let isActive = true;
    
    // Only set loading state for search if we have a search term
    setCardSearchLoading(true);
    
    const timer = setTimeout(async () => {
      if (!isActive) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`/api/cards/search?q=${encodeURIComponent(currentSearchTerm)}`, {
          signal: controller.signal
        }).catch(error => {
          // Handle network errors
          if (error.name === 'AbortError') {
            throw new Error('Search request timed out');
          }
          throw error;
        });
        
        clearTimeout(timeoutId);
        
        if (!isActive) return;
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!isActive) return;
        
        if (data.success && data.data) {
          const filtered = data.data.filter(
            (card: SearchResultCard) => !userCards.some(userCard => userCard.id === card.cardKey)
          );
          setSearchResults(filtered);
        } else {
          setSearchResults([]);
          console.warn('Search returned no results or an error:', data.error);
        }
      } catch (error) {
        if (!isActive) return;
        
        console.error('Error searching cards:', error);
        setSearchResults([]);
        // We don't want to show a global error for search failures
        // Instead, we just show no results
      } finally {
        if (isActive) {
          setCardSearchLoading(false);
        }
      }
    }, 500);
    
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [searchTerm, userCards]);

  // Update the Firebase data loading effect with cleanup
  useEffect(() => {
    let mounted = true;
    const loadUserData = async () => {
      if (!user || !db) return;
      
      if (loading !== 'loading') {
        setLoadingState('loading');
      }

      try {
        // Loading expenses
        await loadExpenses();

        // Loading cards
        try {
          const cardsRef = collection(db, FIREBASE_COLLECTIONS.USER_CARDS) as CollectionReference<DocumentData>;
          const q = query(cardsRef, where('userId', '==', user.uid));
          const cardsSnap = await getDocs(q);
          
          if (!mounted) return;
          
          const userCardIds = cardsSnap.docs.map(doc => doc.data().cardId);
          
          if (userCreditCards && userCreditCards.length > 0) {
            const loadedCards = userCreditCards.filter(card => userCardIds.includes(card.id));
            // Use JSON stringify comparison to avoid unnecessary re-renders
            if (JSON.stringify(loadedCards.map(c => c.id)) !== JSON.stringify(userCards.map(c => c.id))) {
              setUserCards(loadedCards);
            }
          }
        } catch (cardError) {
          if (!mounted) return;
          Logger.error('Error loading cards', { data: cardError });
          setLoadingState('error', 'Failed to load cards');
        }

        // Loading preferences
        try {
          const prefsDoc = await getDocs(
            query(collection(db, FIREBASE_COLLECTIONS.USER_PREFERENCES),
            where('userId', '==', user.uid))
          );
          
          if (!mounted) return;
          
          if (!prefsDoc.empty) {
            const prefs = prefsDoc.docs[0].data();
            const newOptPref = prefs.optimizationPreference || 'points';
            const newCreditScore = prefs.creditScore || 'good';
            const newZeroAnnualFee = prefs.zeroAnnualFee || false;

            if (optimizationPreference !== newOptPref) setOptimizationPreference(newOptPref);
            if (creditScore !== newCreditScore) setCreditScore(newCreditScore);
            if (zeroAnnualFee !== newZeroAnnualFee) setZeroAnnualFee(newZeroAnnualFee);
          }
        } catch (prefError) {
          if (!mounted) return;
          Logger.error('Error loading preferences', { data: prefError });
          setLoadingState('error', 'Failed to load preferences');
        }

        if (mounted && loading !== 'ready') {
          setLoadingState('ready');
        }
      } catch (err) {
        if (!mounted) return;
        const error = err as Error;
        Logger.error('Error loading user data', { data: error.message });
        setLoadingState('error', `Failed to load your data: ${error.message}`);
      }
    };
  
    if (user && db) {
      loadUserData();
    } else if (!user && loading !== 'ready') {
      setLoadingState('ready');
    }

    return () => {
      mounted = false;
    };
  }, [user, userCreditCards, db, loading]);

  // Add cleanup for loading timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoadingState('error', 'Loading timed out. Please refresh the page or try again later.');
      }
    }, 15000);
    
    return () => {
      clearTimeout(timeoutId);
      // Reset loading state if component unmounts during loading
      if (loading) {
        setLoadingState('ready');
      }
    };
  }, [loading]);

  // Debug logging effects
  // useEffect(() => {
  //   console.log("Recommendations updated:", recommendations);
  // }, [recommendations]);
  
  // useEffect(() => {
  //   console.log("Not interested list updated:", notInterestedCards);
  // }, [notInterestedCards]);

  // useEffect(() => {
  //   console.log('Loading state changed:', loading);
  // }, [loading]);

  // Add this after the other function definitions
  const saveUserPreferences = useCallback(async () => {
    if (!user || !db || !isFirestore(db)) {
      return;
    }

    try {
      const prefsRef = collection(db, FIREBASE_COLLECTIONS.USER_PREFERENCES);
      const q = query(prefsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const prefsData = {
        userId: user.uid,
        optimizationPreference,
        creditScore,
        zeroAnnualFee,
        lastUpdated: new Date()
      };

      if (snapshot.empty) {
        await addDoc(prefsRef, prefsData);
      } else {
        await updateDoc(doc(prefsRef, snapshot.docs[0].id), prefsData);
      }
    } catch (error) {
      Logger.error('Error saving preferences:', {
        context: 'RecommenderPage',
        data: error
      });
      showNotification('Failed to save preferences', 'error');
    }
  }, [user, db, optimizationPreference, creditScore, zeroAnnualFee]);

  // Add this effect to save preferences when they change, with debounce
  useEffect(() => {
    if (!user) return;
    
    const timeoutId = setTimeout(() => {
      saveUserPreferences();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [optimizationPreference, creditScore, zeroAnnualFee, user, saveUserPreferences]);

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
      .map(id => userCreditCards.find(card => card.id === id))
      .filter(Boolean) as CreditCardDetails[];
    
    setPreparedNotInterestedCards(notInterestedCardsData);
    setShowNotInterestedList(true);
  };

  // Add card and search caches to improve performance
  const cardCache = useRef<Record<string, CreditCardDetails>>({});
  const searchCache = useRef<Record<string, SearchResultCard[]>>({});

  // Add a function to preload card data
  const preloadCardData = async () => {
    try {
      // Silently fetch cards in the background to prime the cache
      const response = await fetch('/api/cards/all');
      if (response.ok) {
        console.log('Preloaded card data successfully');
      }
    } catch (error) {
      console.error('Error preloading card data:', error);
    }
  };

  // Add to useEffect to run once after page load
  useEffect(() => {
    // Preload card data after initial render
    if (typeof window !== 'undefined') {
      // Wait a bit after initial render to avoid competing with critical resources
      const timer = setTimeout(() => {
        preloadCardData();
      }, 3000); // 3 second delay
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Add a helper function to fetch a single card from the API
  const fetchCardDetailsFromAPI = async (cardKey: string, isRetry = false): Promise<CreditCardDetails | null> => {
    try {
      console.log(`Fetching card details for ${cardKey} directly from API...`);
      const response = await fetch(`/api/cards/details?cardKey=${encodeURIComponent(cardKey)}`);
      
      if (!response.ok) {
        console.warn(`API error fetching card ${cardKey}: ${response.status}`);
        
        // If this is not already a retry, try to get the card from cardDataService as fallback
        if (!isRetry && cardDataService) {
          console.log(`Trying fallback method for ${cardKey}...`);
          return await cardDataService.fetchCardById(cardKey);
        }
        
        return null;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Cache the card
        persistentCardCache.setCard(cardKey, data.data);
        cardCache.current[cardKey] = data.data;
        return data.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching card details for ${cardKey}:`, error);
      
      // If this is not already a retry, try the fallback
      if (!isRetry && cardDataService) {
        console.log(`Trying fallback method for ${cardKey} after error...`);
        return await cardDataService.fetchCardById(cardKey);
      }
      
      return null;
    }
  };

  // Update preloadCards function to handle errors better
  const preloadCards = async (cardKeys: string[]) => {
    if (!cardKeys.length) return;
    
    try {
      // Only preload cards that aren't already in our caches
      const cardsToPreload = cardKeys.filter(key => 
        !persistentCardCache.getCard(key) && !cardCache.current[key]
      );
      
      if (!cardsToPreload.length) return;
      
      console.log(`Preloading ${cardsToPreload.length} cards...`);
      
      // Use the batch endpoint to fetch multiple cards at once
      const response = await fetch('/api/cards/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardKeys: cardsToPreload }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.warn('Failed to preload cards', errorData || response.status);
        
        // Fall back to individual card loading if batch fails
        if (cardsToPreload.length > 0) {
          console.log('Falling back to individual card loading...');
          for (const cardKey of cardsToPreload.slice(0, 3)) { // Only try a few to avoid hammering the API
            await fetchCardDetailsFromAPI(cardKey, true);
          }
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Cache all the preloaded cards
        Object.entries(data.data).forEach(([cardKey, cardData]) => {
          persistentCardCache.setCard(cardKey, cardData as CreditCardDetails);
          cardCache.current[cardKey] = cardData as CreditCardDetails;
        });
        
        console.log(`Successfully preloaded ${Object.keys(data.data).length} cards`);
      }
    } catch (error) {
      console.error('Error preloading cards:', error);
    }
  };

  // Update useEffect for popular cards preloading
  useEffect(() => {
    // Preload popular cards that users are likely to add
    const preloadPopularCards = async () => {
      if (manualRecommendations.length > 0) {
        // Preload recommended cards first
        const recommendedCardKeys = manualRecommendations
          .slice(0, 5)
          .map(rec => rec.card.id);
          
        await preloadCards(recommendedCardKeys);
      }
      
      // Then preload some generally popular cards
      const popularCardKeys = [
        'chase-sapphire-preferred',
        'chase-freedom-unlimited',
        'amex-gold',
        'capital-one-venture',
        'amex-platinum',
        'discover-it-cash-back',
        'citi-double-cash',
        'wells-fargo-active-cash'
      ];
      
      await preloadCards(popularCardKeys);
    };
    
    // Delay preloading to prioritize visible UI rendering first
    const preloadTimeout = setTimeout(() => {
      preloadPopularCards();
    }, 3000);
    
    return () => clearTimeout(preloadTimeout);
  }, [manualRecommendations]);

  // Update the test function
  const testCardCaching = async () => {
    console.log('Testing card caching functionality...');
    
    // Show cache stats
    const cacheStats = persistentCardCache.getStats();
    console.log('Persistent cache stats:', {
      size: cacheStats.size + ' cards',
      oldestCard: new Date(cacheStats.oldestTimestamp).toLocaleString(),
      newestCard: new Date(cacheStats.newestTimestamp).toLocaleString(),
      averageAge: (cacheStats.averageAge / 1000 / 60).toFixed(2) + ' minutes'
    });
    
    // Test card IDs to fetch
    const testCardIds = [
      'chase-sapphire-preferred',
      'amex-gold',
      'capital-one-venture'
    ];
    
    console.log('Cache state before test:');
    console.log('Persistent cache hits:', testCardIds.map(id => 
      persistentCardCache.getCard(id) ? `${id}: HIT` : `${id}: MISS`
    ));
    console.log('Memory cache hits:', testCardIds.map(id => 
      cardCache.current[id] ? `${id}: HIT` : `${id}: MISS`
    ));
    
    // First request - should be fetched from server
    console.log('Fetching cards for the first time...');
    const startTime = performance.now();
    await preloadCards(testCardIds);
    console.log(`First fetch took ${(performance.now() - startTime).toFixed(2)}ms`);
    
    // Second request - should be instant from cache
    console.log('Fetching cards second time (should be from cache)...');
    const cacheStartTime = performance.now();
    
    // Test persistent cache performance
    testCardIds.forEach(id => {
      const card = persistentCardCache.getCard(id);
      console.log(`Card ${id} from persistent cache:`, card ? 'FOUND' : 'NOT FOUND');
    });
    
    // Test in-memory cache performance
    testCardIds.forEach(id => {
      const card = cardCache.current[id];
      console.log(`Card ${id} from memory cache:`, card ? 'FOUND' : 'NOT FOUND');
    });
    
    console.log(`Cache retrieval took ${(performance.now() - cacheStartTime).toFixed(2)}ms`);
    
    // Update cache stats after test
    const updatedCacheStats = persistentCardCache.getStats();
    console.log('Updated persistent cache stats:', {
      size: updatedCacheStats.size + ' cards',
      oldestCard: new Date(updatedCacheStats.oldestTimestamp).toLocaleString(),
      newestCard: new Date(updatedCacheStats.newestTimestamp).toLocaleString(),
      averageAge: (updatedCacheStats.averageAge / 1000 / 60).toFixed(2) + ' minutes'
    });
    
    console.log('Test complete. Check console logs for results.');
    
    // Show sample timing for user to understand improvement
    const initialLoadTime = cacheStats.size === 0 ? "~800ms" : `${(performance.now() - startTime).toFixed(2)}ms`;
    const cachedLoadTime = `${(performance.now() - cacheStartTime).toFixed(2)}ms`;
    
    showNotification(`Cache test complete. Initial load: ${initialLoadTime}, Cached: ${cachedLoadTime}`, 'info');
  };

  // Add a function to test the loading skeleton UI
  const testSkeletonUI = () => {
    // Create a placeholder loading card
    const loadingCard: CreditCardDetails & { isLoading: boolean } = {
      id: 'loading-test-card',
      name: 'Loading Test Card',
      issuer: 'Test Issuer',
      annualFee: 0,
      rewardRates: {
        dining: 1, travel: 1, grocery: 1, gas: 1, entertainment: 1,
        rent: 1, other: 1, drugstore: 1, streaming: 1
      },
      creditScoreRequired: 'fair',
      perks: [],
      foreignTransactionFee: false,
      categories: [],
      description: 'This card is in loading state for UI testing',
      isLoading: true
    };
    
    // Add it to user cards temporarily
    setUserCards(prev => [...prev, loadingCard]);
    setUserCardIds(prev => [...prev, loadingCard.id]);
    
    // After 5 seconds, remove the loading card
    setTimeout(() => {
      setUserCards(prev => prev.filter(card => card.id !== 'loading-test-card'));
      setUserCardIds(prev => prev.filter(id => id !== 'loading-test-card'));
      showNotification('Loading test complete', 'info');
    }, 5000);
    
    showNotification('Added a test card in loading state. Will be removed in 5 seconds', 'info');
  };

  return (
    <div className="recommender-page">
      {/* Main Content */}
      <div className="pt-20 bg-gray-50 min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Mobile Navigation Tabs - Only visible on mobile */}
          <div className="lg:hidden mb-6 bg-white rounded-lg shadow overflow-hidden">
            <div className="grid grid-cols-2">
              <button
                onClick={() => setActiveTab('input')}
                className={`py-3 text-center font-medium ${
                  activeTab === 'input' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Input
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-3 text-center font-medium ${
                  activeTab === 'results' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Results
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

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Input Sections */}
            <div className={`lg:col-span-4 space-y-6 ${activeTab === 'input' || windowWidth >= 1024 ? 'block' : 'hidden'}`}>
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
                        disabled={isLoading}
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
                      disabled={isLoading}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? (
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
                  
                  {isLoading ? (
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
                  
                  {searchTerm.length >= 3 && !isLoading && searchResults.length === 0 && (
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
                  <DynamicCardTypeToggle 
                    value={cardType}
                    onChange={handleCardTypeChange}
                    className="w-full"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">What would you like to optimize for?</label>
                  <select
                    value={optimizationPreference}
                    onChange={(e) => setOptimizationPreference(e.target.value as OptimizationPreference)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
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
                    disabled={isLoading}
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
            <div className={`lg:col-span-8 space-y-6 ${activeTab === 'results' || windowWidth >= 1024 ? 'block' : 'hidden'}`}>
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
                            onClick={() => deleteExpense(expense.id)}
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
                      <DynamicCardDisplay 
                        key={`user-card-${card.id}`} 
                        card={card} 
                        onDelete={() => handleDeleteCard(card.id)}
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
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (!expenses.length && !userCards.length) ? (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-500 mb-2">
                      Add expenses and cards to get personalized recommendations
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
                    {manualRecommendations.slice(0, 4).map(({ card, reason }, index) => (
                      <div key={`rec-card-${card.id}-${index}`} className="relative">
                        <div className="absolute -top-2 left-4 right-4 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full text-center z-10 shadow-sm">
                          {reason}
                        </div>
                        <div className="pt-4">
                          <DynamicCardDisplay 
                            card={card} 
                            onNotInterested={() => handleNotInterested(card.id)}
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
                  <DynamicFeatureTable 
                    currentCards={userCards}
                    recommendedCards={manualRecommendations.length > 0 ? manualRecommendations : recommendations}
                  />
                )}
              </div>

              {/* Rewards Comparison Chart */}
              {userCards.length > 0 && recommendations.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-5 sm:p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Rewards Rate Comparison</h2>
                  <DynamicRewardsChart data={comparisonData} />
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
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.756-1.333-1.756-1.333-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.239 1.237 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0-1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Loading Overlay - Only show for global operations, not card search */}
      {loading && loading !== 'ready' && !cardSearchLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[800] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Processing your request...</p>
          </div>
        </div>
      )}
      
      {/* Not Interested Modal */}
      {showNotInterestedList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[900] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto z-[901]">
            <DynamicSimpleNotInterestedList
              notInterestedIds={notInterestedCards}
              notInterestedCards={preparedNotInterestedCards}
              onRemove={handleRemoveFromNotInterested}
              onClose={() => setShowNotInterestedList(false)}
            />
          </div>
        </div>
      )}
      
      {/* Data Security Badge - Adds credibility */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[50]">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V9a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs text-gray-600">256-bit Secure | SSL Encrypted</span>
        </div>
      </div>
      
      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-[50] max-w-md">
          <div className={`p-4 rounded-lg shadow-lg border ${
            notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' && (
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p>{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add test button in dev mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Developer Testing Tools</h3>
          <div className="flex space-x-2 flex-wrap">
            <button
              onClick={testCardCaching}
              className="px-4 py-2 bg-purple-600 text-white rounded text-sm"
            >
              Test Card Caching
            </button>
            <button
              onClick={testSkeletonUI}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
            >
              Test Loading UI
            </button>
            <button
              onClick={async () => {
                // Test direct API endpoints
                console.log('⚙️ TESTING: Testing API endpoints directly');
                
                try {
                  // GET single card
                  const singleCardStartTime = performance.now();
                  const singleResponse = await fetch('/api/cards/details?cardKey=amex-gold');
                  const singleEndTime = performance.now();
                  
                  const singleData = await singleResponse.json();
                  console.log(`⚙️ TESTING: GET /api/cards/details response (${Math.round(singleEndTime - singleCardStartTime)}ms):`, singleData);
                  
                  // POST batch cards
                  const batchStartTime = performance.now();
                  const batchResponse = await fetch('/api/cards/details', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      cardKeys: ['chase-sapphire-preferred', 'capital-one-venture', 'discover-it-cash-back']
                    }),
                  });
                  const batchEndTime = performance.now();
                  
                  const batchData = await batchResponse.json();
                  console.log(`⚙️ TESTING: POST /api/cards/details (batch) response (${Math.round(batchEndTime - batchStartTime)}ms):`, batchData);
                  
                  // Display results
                  showNotification(
                    `API Tests: GET=${Math.round(singleEndTime - singleCardStartTime)}ms, BATCH=${Math.round(batchEndTime - batchStartTime)}ms`, 
                    'info'
                  );
                } catch (error) {
                  console.error('⚙️ TESTING: API error:', error);
                  showNotification('Error testing API endpoints', 'error');
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm"
            >
              Test API Endpoints
            </button>
            <button
              onClick={() => {
                console.log('⚙️ TESTING: Checking storage chunks');
                
                try {
                  // Check cardDataService chunks
                  const cardDataMeta = localStorage.getItem('cardDataCache_meta');
                  if (cardDataMeta) {
                    const meta = JSON.parse(cardDataMeta);
                    console.log('CardData chunks meta:', meta);
                    
                    // Sample first 2 chunks
                    for (let i = 0; i < Math.min(2, meta.totalChunks); i++) {
                      const chunk = localStorage.getItem(`cardDataCache_chunk_${i}`);
                      if (chunk) {
                        const parsed = JSON.parse(chunk);
                        console.log(`Chunk ${i}: ${parsed.length} cards, first card: ${parsed[0]?.id || 'unknown'}`);
                      }
                    }
                  } else {
                    console.log('No cardDataCache_meta found');
                  }
                  
                  // Check searchIndex chunks
                  const searchMeta = localStorage.getItem('searchIndex_meta');
                  if (searchMeta) {
                    const meta = JSON.parse(searchMeta);
                    console.log('SearchIndex chunks meta:', meta);
                    
                    // Sample first chunk
                    const chunk = localStorage.getItem('searchIndex_chunk_0');
                    if (chunk) {
                      const parsed = JSON.parse(chunk);
                      console.log(`SearchIndex first chunk has ${parsed.length} items`);
                    }
                  } else {
                    console.log('No searchIndex_meta found');
                  }
                  
                  // Display size usage
                  let totalSize = 0;
                  let keys = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                      const size = localStorage.getItem(key)?.length || 0;
                      totalSize += size;
                      keys.push({ key, size });
                    }
                  }
                  
                  console.log(`Total localStorage usage: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
                  console.log('Storage keys by size:', keys.sort((a, b) => b.size - a.size).slice(0, 5));
                  
                  showNotification(`Storage check complete - see console for details`, 'info');
                } catch (error) {
                  console.error('Error checking storage:', error);
                  showNotification('Error checking storage', 'error');
                }
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded text-sm mt-2"
            >
              Check Storage Chunks
            </button>

            </div>
            <p className="text-xs text-gray-500 mt-2">
              These tools help test the card loading performance and UI states.
            </p>
        </div>
      )}
    </div>
  );
}

export default RecommenderPage;
