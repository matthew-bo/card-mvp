// src/lib/cardRecommendations.ts
import { CreditCardDetails, OptimizationSettings, OptimizationPreference, CreditScoreType } from '@/types/cards';
import { getPointValue } from '../utils/pointsConverter';
import { LoadedExpense } from '@/types/cards';

interface SpendingAnalysis {
  totalSpend: number;
  categoryPercentages: {
    dining: number;
    travel: number;
    grocery: number;
    gas: number;
    entertainment: number;
    rent: number;
    other: number;
    [key: string]: number;
  };
  monthlyAverage: number;
  highSpendCategories: string[];
  canMeetSignupBonus: boolean;
  spendingPattern: 'balanced' | 'category-focused' | 'low-spend' | 'high-spend';
  spendByCategory: Record<string, number>;
  categoryRank: { category: string; percentage: number }[];
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: Date | { seconds: number; nanoseconds: number } | string;
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

interface CardPortfolioAnalysis {
  coverageByCategory: Record<string, number>;
  totalAnnualFees: number;
  wealthOfPerks: string[];
  averageCreditScore: CreditScoreType;
  diversityScore: number;
  bestCategoryCoverage: Record<string, { rate: number; cardId: string }>;
}

interface RecommendationParams {
  expenses: Expense[];
  currentCards: CreditCardDetails[];
  optimizationSettings: OptimizationSettings;
  creditScore?: CreditScoreType;
  excludeCardIds?: string[];
  availableCards?: CreditCardDetails[];
}

type CategoryKey = keyof SpendingAnalysis['categoryPercentages'];

const CREDIT_SCORE_MAP = {
  poor: 1,
  fair: 2,
  good: 3,
  excellent: 4
} as const;

// Add these type definitions at the top of the file, near other interfaces
interface RecommendationOptions {
  expenses: LoadedExpense[];
  currentCards: CreditCardDetails[];
  optimizationSettings: {
    preference: OptimizationPreference;
    zeroAnnualFee: boolean;
  };
  creditScore: 'poor' | 'fair' | 'good' | 'excellent';
  excludeCardIds: string[];
  availableCards: CreditCardDetails[];
}

interface RecommendedCard {
  card: CreditCardDetails;
  score: number;
  reason: string;
  matchPercentage?: number;
  potentialAnnualValue?: number;
  complementScore?: number;
  longTermValue?: number;
  portfolioContribution?: any;
}

// Determine how complementary a card is to an existing portfolio
function calculateComplementScore(
  card: CreditCardDetails, 
  currentCards: CreditCardDetails[],
  spendingAnalysis: SpendingAnalysis
): { score: number; contributions: string[] } {
  const contributions: string[] = [];
  let complementScore = 0;
  
  // Get the best reward rate for each category in the current portfolio
  const portfolioBestRates: Record<string, number> = {};
  const portfolioIssuers = new Set<string>();
  
  for (const category of Object.keys(spendingAnalysis.categoryPercentages)) {
    portfolioBestRates[category] = Math.max(
      0,
      ...currentCards.map(c => (c.rewardRates?.[category as CategoryKey] ?? 0))
    );
  }
  
  // Track issuers for diversity score
  currentCards.forEach(c => portfolioIssuers.add(c.issuer));
  
  // Calculate complement score based on spending-weighted category improvements
  let totalCategoryImprovement = 0;
  
  for (const { category, percentage } of spendingAnalysis.categoryRank) {
    const currentBestRate = portfolioBestRates[category] || 0;
    const newRate = card.rewardRates?.[category as CategoryKey] ?? 0;
    
    if (newRate > currentBestRate) {
      // Weight the improvement by spending percentage in that category
      const improvement = (newRate - currentBestRate) * (percentage / 100);
      totalCategoryImprovement += improvement;
      
      // Track significant improvements for explaining card value
      if (improvement > 0.5) {
        const diff = (newRate - currentBestRate).toFixed(1);
        contributions.push(`Improves ${category} rewards by ${diff}%`);
      }
    }
  }
  
  // Score based on weighted category improvements
  complementScore += totalCategoryImprovement * 20;
  
  // Issuer diversity bonus - reward cards from different issuers
  if (!portfolioIssuers.has(card.issuer)) {
    complementScore += 10;
    contributions.push(`Adds ${card.issuer} to your card network diversity`);
  }
  
  // Perks coverage bonus - reward cards that provide new perks
  const currentPerks = new Set(currentCards.flatMap(c => c.perks ?? []));
  const newPerks = (card.perks ?? []).filter(perk => !currentPerks.has(perk));
  
  if (newPerks.length > 0) {
    complementScore += Math.min(newPerks.length * 5, 15);
    
    if (newPerks.length > 0) {
      const perkSample = newPerks.length > 2 
        ? `${newPerks.length} new perks including ${newPerks[0]}`
        : `new perks: ${newPerks.join(', ')}`;
      contributions.push(perkSample);
    }
  }
  
  // Foreign transaction fee coverage - valuable if portfolio doesn't have it
  const hasNoForeignFeeCard = currentCards.some(c => c.foreignTransactionFee === false);
  if (!hasNoForeignFeeCard && card.foreignTransactionFee === false) {
    complementScore += 15;
    contributions.push('Adds no foreign transaction fee coverage');
  }
  
  return { score: complementScore, contributions };
}

// Calculate long-term value accounting for diminishing signup bonus value
function calculateLongTermValue(
  card: CreditCardDetails,
  spendingAnalysis: SpendingAnalysis
): { value: number; description: string } {
  // Base value from ongoing rewards
  const annualSpend = spendingAnalysis.monthlyAverage * 12;
  let annualRewards = 0;
  
  // Calculate rewards based on category spending
  for (const [category, percentage] of Object.entries(spendingAnalysis.categoryPercentages)) {
    const spend = annualSpend * (percentage / 100);
    const rate = card.rewardRates[category as CategoryKey] || 0;
    annualRewards += spend * (rate / 100);
  }
  
  // Convert points to dollars when applicable
  const pointInfo = card.signupBonus?.type === 'points' 
    ? getPointValue(annualRewards, 'points', card.issuer)
    : { value: annualRewards };
  
  const ongoingValue = pointInfo.value;
  
  // Calculate signup bonus value spread over 4 years (diminishing value)
  let signupBonusValue = 0;
  
  if (card.signupBonus && spendingAnalysis.canMeetSignupBonus) {
    const bonusType = card.signupBonus.type;
    const bonusAmount = card.signupBonus.amount;
    
    // Convert bonus to dollar value
    const bonusPointInfo = bonusType === 'points'
      ? getPointValue(bonusAmount, 'points', card.issuer)
      : { value: bonusAmount };
    
    // Total bonus value
    const totalBonusValue = bonusPointInfo.value;
    
    // Calculate 4-year value (heavily front-loaded)
    // Year 1: 70% of value, Year 2: 15%, Year 3: 10%, Year 4: 5%
    signupBonusValue = totalBonusValue * 0.25; // Average over 4 years
  }
  
  // Calculate credits/perks value
  let perksValue = 0;
  if (card.perks.length > 0) {
    // Simplified - in reality would need to evaluate each perk's value
    perksValue = Math.min(card.perks.length * 5, 30);
  }
  
  // Total long-term value minus annual fee, averaged over 4 years
  const longTermValue = ongoingValue + signupBonusValue + perksValue - card.annualFee;
  
  let valueDescription = '';
  if (longTermValue > card.annualFee * 3) {
    valueDescription = 'Exceptional long-term value';
  } else if (longTermValue > card.annualFee * 2) {
    valueDescription = 'Strong long-term value';
  } else if (longTermValue > card.annualFee) {
    valueDescription = 'Good long-term value';
  } else {
    valueDescription = 'Moderate long-term value';
  }
  
  return { value: longTermValue, description: valueDescription };
}

function validateAndParseDate(date: Date | { seconds: number } | string): number {
  try {
    if (date instanceof Date) {
      const timestamp = date.getTime();
      if (isNaN(timestamp)) {
        throw new Error('Invalid Date object');
      }
      return timestamp;
    }

    if (date && typeof date === 'object' && 'seconds' in date) {
      const timestamp = new Date(date.seconds * 1000).getTime();
      if (isNaN(timestamp)) {
        throw new Error('Invalid Firestore timestamp');
      }
      return timestamp;
    }

    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      const timestamp = parsedDate.getTime();
      if (isNaN(timestamp)) {
        throw new Error('Invalid date string format');
      }
      return timestamp;
    }

    throw new Error('Unsupported date format');
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Date validation error:', error.message, 'Value:', date);
    return new Date().getTime();
  }
}

function validateExpense(expense: Expense): boolean {
  try {
    if (!expense.amount || typeof expense.amount !== 'number' || expense.amount < 0) {
      console.error('Invalid expense amount:', expense.amount);
      return false;
    }

    if (!expense.category || typeof expense.category !== 'string') {
      console.error('Invalid expense category:', expense.category);
      return false;
    }

    validateAndParseDate(expense.date);
    return true;
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Expense validation error:', error.message);
    return false;
  }
}

// Enhanced spending analysis with more detailed category information
function analyzeSpending(expenses: Expense[]): SpendingAnalysis {
  try {
    const validExpenses = expenses.filter(validateExpense);
    
    // If no expenses, return default analysis instead of throwing error
    if (validExpenses.length === 0) {
      return {
        totalSpend: 0,
        categoryPercentages: {
          dining: 20,  // Default category distribution
          travel: 15,
          grocery: 25,
          gas: 10,
          entertainment: 10,
          rent: 0,
          other: 20
        },
        monthlyAverage: 2500, // Reasonable default monthly spend
        highSpendCategories: ['grocery', 'dining', 'travel'],
        canMeetSignupBonus: true, // Assume can meet signup bonus
        spendingPattern: 'balanced',
        spendByCategory: {
          dining: 500,
          travel: 375,
          grocery: 625,
          gas: 250,
          entertainment: 250,
          rent: 0,
          other: 500
        },
        categoryRank: [
          { category: 'grocery', percentage: 25 },
          { category: 'dining', percentage: 20 },
          { category: 'travel', percentage: 15 },
          { category: 'gas', percentage: 10 },
          { category: 'entertainment', percentage: 10 },
          { category: 'other', percentage: 20 }
        ]
      };
    }

    const totalSpend = validExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate spending by category
    const spendByCategory = validExpenses.reduce((acc, exp) => {
      const category = exp.category || 'other';
      acc[category] = (acc[category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate date range for monthly average
    const dates = validExpenses.map(e => validateAndParseDate(e.date));
    const oldestDate = Math.min(...dates);
    const dateRange = Math.max(1, Math.ceil((Date.now() - oldestDate) / (30 * 24 * 60 * 60 * 1000)));
    const monthlyAverage = totalSpend / dateRange;

    // Calculate percentages and create ranked list
    const categoryPercentages = {
      dining: (spendByCategory.dining || 0) / totalSpend * 100,
      travel: (spendByCategory.travel || 0) / totalSpend * 100,
      grocery: (spendByCategory.grocery || 0) / totalSpend * 100,
      gas: (spendByCategory.gas || 0) / totalSpend * 100,
      entertainment: (spendByCategory.entertainment || 0) / totalSpend * 100,
      rent: (spendByCategory.rent || 0) / totalSpend * 100,
      other: (spendByCategory.other || 0) / totalSpend * 100,
    };
    
    // Rank categories by spending percentage
    const categoryRank = Object.entries(categoryPercentages)
      .map(([category, percentage]) => ({ category, percentage }))
      .sort((a, b) => b.percentage - a.percentage);

    const highSpendCategories = categoryRank
      .filter(item => item.percentage > 15)
      .map(item => item.category);

    // Determine spending pattern
    const spendingPattern = 
      monthlyAverage > 5000 ? 'high-spend' :
      monthlyAverage < 1000 ? 'low-spend' :
      highSpendCategories.length > 2 ? 'balanced' : 'category-focused';

    return {
      totalSpend,
      categoryPercentages,
      monthlyAverage,
      highSpendCategories,
      canMeetSignupBonus: monthlyAverage * 3 >= 4000,
      spendingPattern,
      spendByCategory,
      categoryRank
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Spending analysis error:', error.message);
    return {
      totalSpend: 0,
      categoryPercentages: {
        dining: 0,
        travel: 0,
        grocery: 0,
        gas: 0,
        entertainment: 0,
        rent: 0,
        other: 0
      },
      monthlyAverage: 0,
      highSpendCategories: [],
      canMeetSignupBonus: false,
      spendingPattern: 'low-spend',
      spendByCategory: {},
      categoryRank: []
    };
  }
}

function analyzeCardPortfolio(cards: CreditCardDetails[]): CardPortfolioAnalysis {
  // If no cards, return empty analysis
  if (cards.length === 0) {
    return {
      coverageByCategory: {},
      totalAnnualFees: 0,
      wealthOfPerks: [],
      averageCreditScore: 'good',
      diversityScore: 0,
      bestCategoryCoverage: {}
    };
  }
  
  // Calculate total annual fees
  const totalAnnualFees = cards.reduce((sum, card) => sum + card.annualFee, 0);
  
  // Track best reward rate by category
  const bestCategoryCoverage: Record<string, { rate: number; cardId: string }> = {};
  const categories = ['dining', 'travel', 'grocery', 'gas', 'entertainment', 'rent', 'other'];
  
  for (const category of categories) {
    let bestRate = 0;
    let bestCardId = '';
    
    for (const card of cards) {
      const rate = card.rewardRates[category as CategoryKey] || 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestCardId = card.id;
      }
    }
    
    bestCategoryCoverage[category] = { 
      rate: bestRate, 
      cardId: bestCardId 
    };
  }
  
  // Calculate coverage - how well spending categories are covered
  const coverageByCategory = categories.reduce((acc, category) => {
    acc[category] = bestCategoryCoverage[category].rate;
    return acc;
  }, {} as Record<string, number>);
  
  // Collect unique perks
  const uniquePerks = new Set<string>();
  cards.forEach(card => {
    card.perks.forEach(perk => uniquePerks.add(perk));
  });
  const wealthOfPerks = Array.from(uniquePerks);
  
  // Calculate average credit score required
  const scoreValues = cards.map(card => CREDIT_SCORE_MAP[card.creditScoreRequired]);
  const avgScoreValue = scoreValues.reduce((sum, val) => sum + val, 0) / cards.length;
  
  let averageCreditScore: CreditScoreType = 'good';
  if (avgScoreValue <= 1.5) averageCreditScore = 'poor';
  else if (avgScoreValue <= 2.5) averageCreditScore = 'fair';
  else if (avgScoreValue <= 3.5) averageCreditScore = 'good';
  else averageCreditScore = 'excellent';
  
  // Calculate diversity score based on issuers
  const issuers = new Set(cards.map(card => card.issuer));
  const diversityScore = issuers.size / cards.length;
  
  return {
    coverageByCategory,
    totalAnnualFees,
    wealthOfPerks,
    averageCreditScore,
    diversityScore,
    bestCategoryCoverage
  };
}

function generateCardReason(
  card: CreditCardDetails,
  portfolioContributions: string[],
  scoreComponents: {
    longTermValue: number;
    complementScore: number;
    preferenceScore: number;
    spendingScore: number;
  }
): string {
  // Find the top scoring component
  const scores = [
    { type: 'longTerm', score: scoreComponents.longTermValue },
    { type: 'complement', score: scoreComponents.complementScore },
    { type: 'preference', score: scoreComponents.preferenceScore },
    { type: 'spending', score: scoreComponents.spendingScore }
  ];
  
  // Sort by score to find top contributors
  scores.sort((a, b) => b.score - a.score);
  
  // Use portfolio contributions first if available
  if (portfolioContributions.length > 0) {
    return portfolioContributions[0];
  }
  
  // Fallback reasons based on card attributes
  if (card.annualFee === 0) {
    return "No annual fee with solid rewards structure";
  }
  
  if (card.signupBonus && card.signupBonus.amount > 500) {
    return `Valuable ${card.signupBonus.type} bonus worth ${card.signupBonus.amount}`;
  }
  
  // Find the best reward category
  const bestCategory = Object.entries(card.rewardRates)
    .sort(([, a], [, b]) => b - a)[0];
    
  if (bestCategory && bestCategory[1] > 3) {
    return `Strong ${bestCategory[0]} rewards at ${bestCategory[1]}%`;
  }
  
  return "Good all-around value for your spending habits";
}

// Helper function to analyze category coverage
function analyzeCardCategoryStrengths(card: CreditCardDetails, spendingAnalysis: SpendingAnalysis): {
  coveredCategories: string[];
  bestCategories: string[];
  avgRate: number;
  baseRate: number;
} {
  if (!card.rewardRates) {
    return {
      coveredCategories: [],
      bestCategories: [],
      avgRate: 0,
      baseRate: 1
    };
  }
  
  // Get all reward categories with rates
  const categoryRates = Object.entries(card.rewardRates)
    .filter(([_, rate]) => !isNaN(Number(rate)) && Number(rate) > 0)
    .map(([category, rate]) => ({ category, rate: Number(rate) }));
  
  // Calculate average rate
  const avgRate = categoryRates.length > 0
    ? categoryRates.reduce((sum, item) => sum + item.rate, 0) / categoryRates.length
    : 0;
  
  // Find base/other rate
  const baseRate = card.rewardRates.other || 1;
  
  // Check which top spending categories are covered well by this card
  const coveredCategories = spendingAnalysis.highSpendCategories.filter(category => {
    const rate = card.rewardRates[category as keyof typeof card.rewardRates];
    return rate && rate > baseRate;
  });
  
  // Find card's best categories
  const bestCategories = categoryRates
    .filter(item => item.rate > baseRate)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3)
    .map(item => item.category);
  
  return {
    coveredCategories,
    bestCategories,
    avgRate,
    baseRate
  };
}

// Score card based on optimization preference and spending pattern
function scoreCard(card: CreditCardDetails, spendingAnalysis: SpendingAnalysis, preference: OptimizationPreference): {
  score: number;
  reason: string;
} {
  try {
    // Validate required card properties
    if (!card || !card.rewardRates || !card.name || typeof card.annualFee !== 'number') {
      console.warn(`Invalid card data for scoring: ${card?.id || 'unknown'}`);
      return { score: 0, reason: 'Invalid card data' };
    }

    // Log card being scored
    console.log(`Scoring card: ${card.name} (${card.id})`);
    
    // Analyze card category strengths
    const { coveredCategories, bestCategories, avgRate, baseRate } = 
      analyzeCardCategoryStrengths(card, spendingAnalysis);
    
    // Initialize scoring variables
    let score = 0;
    let reasons: string[] = [];
    
    // Points optimization
    if (preference === 'points') {
      // Value cards that cover top spending categories
      if (coveredCategories.length > 0) {
        score += 20 + (coveredCategories.length * 10);
        reasons.push(`Covers ${coveredCategories.length} of your top spending categories`);
      } 
      // Also value cards with good average rewards
      else if (avgRate > 1.5) {
        score += 15 + (avgRate * 10);
        reasons.push(`Offers an average of ${avgRate.toFixed(1)}% rewards`);
      }
    }
    // Cashback optimization
    else if (preference === 'cashback') {
      // Value cards with good base cashback rate
      if (baseRate >= 1.5) {
        score += 15 + (baseRate * 10);
        reasons.push(`Offers ${baseRate}% base cashback`);
      }
      
      // Also value category coverage
      if (coveredCategories.length > 0) {
        score += 15 + (coveredCategories.length * 10);
        reasons.push(`Covers ${coveredCategories.length} of your top spending categories`);
      }
    }
    // Travel optimization
    else if (preference === 'travel') {
      // Value travel rewards
      const travelRate = card.rewardRates.travel || 0;
      if (travelRate > 1) {
        score += 15 + (travelRate * 10);
        reasons.push(`Offers ${travelRate}X travel rewards`);
      }
      
      // Check for travel perks
      const travelPerks = (card.perks || []).filter(perk => 
        perk.toLowerCase().includes('travel') || 
        perk.toLowerCase().includes('lounge') ||
        perk.toLowerCase().includes('global') ||
        perk.toLowerCase().includes('hotel')
      );
      
      if (travelPerks.length > 0) {
        score += 10 + (travelPerks.length * 5);
        reasons.push(`Offers ${travelPerks.length} travel perks`);
      }
      
      // No foreign transaction fee is valuable for travel
      if (card.foreignTransactionFee === false) {
        score += 10;
        reasons.push('No foreign transaction fees');
      }
    }
    
    // If no specific optimization matched, use a default
    if (score === 0 || reasons.length === 0) {
      // Default scoring - average rate
      if (avgRate > 1) {
        score += 10 + (avgRate * 5);
        reasons.push(`Offers an average of ${avgRate.toFixed(1)}% rewards`);
      } else {
        // Last resort - give some score to no annual fee cards
        if (card.annualFee === 0) {
          score += 15;
          reasons.push('No annual fee');
        } else {
          score += 5;
          reasons.push('General rewards card');
        }
      }
    }
    
    // Adjust score based on annual fee
    if (card.annualFee > 0) {
      // Reduce score slightly for high annual fee cards
      const feePenalty = Math.min(15, card.annualFee / 20);
      score = Math.max(0, score - feePenalty);
    } else {
      // Bonus for no annual fee
      score += 10;
    }
    
    // Add a small randomness factor (0.01-0.99) to break ties
    score += Math.random();
    
    // Return combined score and primary reason
    return { 
      score: Math.max(0, score), // Ensure score is never negative
      reason: reasons[0] || 'General rewards card'
    };
  } catch (error) {
    console.error(`Error scoring card ${card?.id || 'unknown'}:`, error);
    return { score: 0, reason: 'Error in scoring calculation' };
  }
}

export function getCardRecommendations({
  expenses,
  currentCards,
  optimizationSettings,
  creditScore,
  excludeCardIds = [],
  availableCards
}: RecommendationOptions): RecommendedCard[] {
  try {
    console.log('Starting card recommendation process...');
    console.log('Input validation:', {
      availableCardsCount: availableCards?.length || 0,
      currentCardsCount: currentCards?.length || 0,
      excludeCardIdsCount: excludeCardIds?.length || 0,
      expensesCount: expenses?.length || 0,
      creditScore,
      optimizationSettings
    });

    // Guard against missing input data
    if (!availableCards || availableCards.length === 0) {
      console.warn('No cards available for recommendations');
      return [];
    }

    // Validate card data structure - Only require id, name, and issuer
    const invalidCards = availableCards.filter(card => 
      !card?.name || !card?.id || !card?.issuer
    );
    if (invalidCards.length > 0) {
      console.error('Found invalid cards:', invalidCards);
    }

    // Ensure we have arrays even if null/undefined passed
    const safeCurrentCards = currentCards || [];
    const safeExcludeCardIds = excludeCardIds || [];
    const safeExpenses = expenses || [];
  
    // Get spending analysis
    const spendingAnalysis = analyzeSpending(safeExpenses);
  
    // Basic filtering to remove cards user already has or marked as not interested
    const currentCardIds = new Set(safeCurrentCards.map(card => card.id));
    let filteredCards = availableCards.filter(card => {
      // Simpler card validation - require only name, id, and issuer
      if (!card || !card.id || !card.name || !card.issuer) {
        console.warn('Skipping invalid card:', card?.id || 'unknown', 'Missing required properties');
        return false;
      }
      return !currentCardIds.has(card.id) && !safeExcludeCardIds.includes(card.id);
    });
    console.log('After basic filtering (only current/not-interested cards removed):', filteredCards.length);
  
    // Secondary filtering (credit score & annual fee)
    filteredCards = filteredCards.filter(card => {
      // Handle missing or malformed card data with safer defaults
      if (!card) {
        return false;
      }
      
      // Credit score filtering - Using safer defaults if fields are missing
      const cardScoreRequired = card.creditScoreRequired?.toLowerCase() || 'excellent';
      const userScore = creditScore?.toLowerCase() || 'poor';
      
      // Define the credit score hierarchy
      const scoreHierarchy = {
        'poor': 1,
        'fair': 2,
        'good': 3,
        'excellent': 4
      };
      
      // Get numeric values for comparison
      const cardScoreValue = scoreHierarchy[cardScoreRequired as keyof typeof scoreHierarchy] || 4;
      const userScoreValue = scoreHierarchy[userScore as keyof typeof scoreHierarchy] || 1;
      
      // User score must be >= card required score
      if (userScoreValue < cardScoreValue) {
        return false;
      }
      
      // Annual fee filtering (if user wants zero annual fee)
      if (optimizationSettings.zeroAnnualFee) {
        // Consider cards with annual fee under $1 as effectively zero annual fee
        // Also handle undefined annual fee gracefully
        const annualFee = card.annualFee ?? 0;
        if (annualFee > 1) {
          return false;
        }
      }
      
      return true;
    });
    console.log('After secondary filtering (credit score & annual fee):', filteredCards.length);
  
    // If no cards remain after filtering, return an empty array
    if (filteredCards.length === 0) {
      console.warn('No cards remain after filtering');
      return [];
    }
  
    // Log the spending analysis for debugging
    console.log('Generated spending analysis:', spendingAnalysis);
  
    // Score cards
    console.log('Scoring', filteredCards.length, 'cards for recommendations');
    const scoredCards: ScoredCard[] = [];
  
    try {
      // Score each card
      for (const card of filteredCards) {
        try {
          // Use the dedicated scoring function
          const { score, reason } = scoreCard(card, spendingAnalysis, optimizationSettings.preference);
          
          // Add scored card
          scoredCards.push({
            card,
            score,
            reason,
            matchPercentage: Math.min(100, Math.round(score / 0.7)),
            potentialAnnualValue: 0,
            complementScore: 0,
            longTermValue: 0,
            portfolioContribution: []
          });
        } catch (cardError) {
          console.error(`Error scoring card ${card.id}:`, cardError);
          // Continue to next card instead of failing entire scoring process
        }
      }
    } catch (error) {
      console.error('Critical error in recommendation algorithm:', error);
      // Return a minimal set of cards if algorithm fails
      return filteredCards.slice(0, 10).map(card => ({
        card,
        score: 10,
        reason: 'Matched your preferences'
      }));
    }
  
    // Sort by score (descending)
    scoredCards.sort((a, b) => b.score - a.score);
  
    // Log top 5 recommendations for debugging
    console.log('Top recommendations:');
    scoredCards.slice(0, 5).forEach((rec, i) => {
      console.log(`  ${i+1}. ${rec.card.name || rec.card.id} - Score: ${rec.score}, Reason: ${rec.reason}`);
    });
  
    // Return top 10 recommendations
    return scoredCards.slice(0, 10);
  } catch (error) {
    console.error('Critical error in getCardRecommendations:', error);
    console.error('Input state:', {
      availableCards: availableCards?.length,
      currentCards: currentCards?.length,
      expenses: expenses?.length,
      creditScore,
      optimizationSettings
    });
    return [];
  }
}