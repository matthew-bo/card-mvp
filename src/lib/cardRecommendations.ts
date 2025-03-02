// src/lib/cardRecommendations.ts
import { CreditCardDetails, OptimizationSettings, OptimizationPreference, CreditScoreType } from '@/types/cards';
import { getPointValue } from '@/utils/pointsConverter';

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
      ...currentCards.map(c => c.rewardRates[category as CategoryKey] || 0)
    );
  }
  
  // Track issuers for diversity score
  currentCards.forEach(c => portfolioIssuers.add(c.issuer));
  
  // Calculate complement score based on spending-weighted category improvements
  let totalCategoryImprovement = 0;
  
  for (const { category, percentage } of spendingAnalysis.categoryRank) {
    const currentBestRate = portfolioBestRates[category] || 0;
    const newRate = card.rewardRates[category as CategoryKey] || 0;
    
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
  const currentPerks = new Set(currentCards.flatMap(c => c.perks));
  const newPerks = card.perks.filter(perk => !currentPerks.has(perk));
  
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
  const hasNoForeignFeeCard = currentCards.some(c => !c.foreignTransactionFee);
  if (!hasNoForeignFeeCard && !card.foreignTransactionFee) {
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
    if (validExpenses.length === 0) {
      throw new Error('No valid expenses found');
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

export function getCardRecommendations(params: RecommendationParams): ScoredCard[] {
  try {
    const { expenses, currentCards, optimizationSettings, creditScore = 'good', excludeCardIds = [], availableCards } = params;
    const spendingAnalysis = analyzeSpending(expenses);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const portfolioAnalysis = analyzeCardPortfolio(currentCards);

    if (!Array.isArray(currentCards)) {
      throw new Error('Invalid current cards array');
    }

    // Use provided availableCards or fallback to an empty array
    const cardsToFilter = availableCards || [];
    
    if (cardsToFilter.length === 0) {
      console.warn('No available cards to recommend');
      return [];
    }

    // Log the number of available cards for debugging
    console.log(`Filtering recommendations from ${cardsToFilter.length} available cards`);

    // Filter available cards
    const filteredCards = cardsToFilter.filter(cardItem => {
      // Filter out cards user already has
      if (currentCards.some(userCard => userCard.id === cardItem.id)) {
        return false;
      }
      
      // Filter out not interested cards
      if (excludeCardIds.includes(cardItem.id)) {
        return false;
      }
      
      // Credit score check - make this stricter
      const requiredScore = CREDIT_SCORE_MAP[cardItem.creditScoreRequired] || CREDIT_SCORE_MAP.good;
      const userScoreValue = CREDIT_SCORE_MAP[creditScore] || CREDIT_SCORE_MAP.good;
      if (userScoreValue < requiredScore) {
        return false; // Don't show cards that require better credit than user has
      }
      
      // Annual fee check - enforce strictly
      if (optimizationSettings.zeroAnnualFee && cardItem.annualFee > 0) {
        return false;
      }
      
      return true;
    });

    // Log filtered cards count
    console.log(`After filtering, ${filteredCards.length} cards remain as candidates`);


    // Optimization preference weights - amplify user's chosen preference
    type PreferenceWeights = {
      [key in OptimizationPreference]: {
        rewards: number;
        perks: number;
        value: number;
        signup: number;
        complement: number;
        longTerm: number;
      }
    };
    
    const preferenceWeights: PreferenceWeights = {
      points: { 
        rewards: 50, perks: 15, value: 25, signup: 20, complement: 30, longTerm: 20 
      },
      cashback: { 
        rewards: 60, perks: 10, value: 30, signup: 10, complement: 25, longTerm: 25 
      },
      perks: { 
        rewards: 20, perks: 60, value: 20, signup: 10, complement: 30, longTerm: 15 
      },
      creditScore: { 
        rewards: 20, perks: 15, value: 45, signup: 5, complement: 20, longTerm: 35 
      }
    };

    const weights = preferenceWeights[optimizationSettings.preference];

    // Score all available cards
    const scoredCards: ScoredCard[] = filteredCards.map(cardItem => {
      // Start with base score components
      let preferenceScore = 0;
      let spendingScore = 0;
      let valueScore = 0;
      let signupScore = 0;
      let matchFactors = 0;
      const reasons: string[] = [];

    // 1. Preference Matching Score - increase weight substantially
    if (cardItem.categories.includes(optimizationSettings.preference)) {
      preferenceScore += weights.rewards * 3; // Triple the weight for stronger preference matching
      matchFactors++;
      reasons.push(`Optimizes for ${optimizationSettings.preference}`);
    }

    // Add specific handling for each preference type
    if (optimizationSettings.preference === 'points' && 
        (cardItem.categories.includes('points') || cardItem.categories.includes('travel'))) {
      preferenceScore += weights.rewards * 2; // Additional boost for points cards
    }

    if (optimizationSettings.preference === 'cashback' && 
        cardItem.categories.includes('cashback')) {
      preferenceScore += weights.rewards * 2; // Additional boost for cashback cards
    }

    if (optimizationSettings.preference === 'perks' && 
        cardItem.perks.length > 3) {
      preferenceScore += weights.rewards * 2; // Additional boost for cards with many perks
    }

    if (optimizationSettings.preference === 'creditScore' && 
        cardItem.annualFee === 0) {
      preferenceScore += weights.rewards * 2; // For credit building, prefer no annual fee cards
    }

      // 2. Perks Scoring - enhanced for perks preference
      let perksScore = 0;
      if (optimizationSettings.preference === 'perks') {
        perksScore = Math.min(cardItem.perks.length * 8, weights.perks);
        if (cardItem.perks.length > 3) {
          reasons.push(`Extensive perks package with ${cardItem.perks.length} benefits`);
        }
      } else {
        perksScore = Math.min(cardItem.perks.length * 3, weights.perks);
      }

      // 3. Spending Pattern Analysis - dynamically weighted by category importance
      let categoryMatchScore = 0;
      const matchedCategories: string[] = [];
      const topSpendingCategories = spendingAnalysis.categoryRank.slice(0, 3); // Get top 3 spending categories
        
      for (const { category, percentage } of topSpendingCategories) {
        const rewardRate = cardItem.rewardRates[category as CategoryKey] || 0;
        
        // Significantly boost score for cards that are strong in top spending categories
        if (rewardRate > 2) {
          // Weight by both the reward rate and the spending percentage
          categoryMatchScore += (rewardRate * percentage / 100) * 5; // Increase this multiplier
          matchedCategories.push(category);
          
          // Add specific reasoning
          if (percentage > 20) {
            reasons.push(`Strong ${rewardRate}x rewards in ${category}, your highest spending category`);
          } else {
            reasons.push(`Good ${rewardRate}x rewards in ${category}`);
          }
        }
      }

      // 4. Value Proposition
      const annualRewardsEstimate = spendingAnalysis.categoryRank.reduce((sum, { category, percentage }) => {
        const spend = (spendingAnalysis.monthlyAverage * 12) * (percentage / 100);
        const rate = cardItem.rewardRates[category as CategoryKey] || 0;
        return sum + (spend * (rate / 100));
      }, 0);
      
      if (cardItem.annualFee === 0 && optimizationSettings.zeroAnnualFee) {
        valueScore = weights.value;
        reasons.push("No annual fee");
      } else if (annualRewardsEstimate > cardItem.annualFee * 3) {
        valueScore = weights.value;
        reasons.push(`Rewards value easily exceeds ${cardItem.annualFee} annual fee`);
      } else if (annualRewardsEstimate > cardItem.annualFee * 1.5) {
        valueScore = weights.value * 0.8;
        reasons.push(`Good value compared to ${cardItem.annualFee} annual fee`);
      } else if (annualRewardsEstimate > cardItem.annualFee) {
        valueScore = weights.value * 0.5;
      }

      // 5. Sign-up Bonus Value
      if (cardItem.signupBonus && spendingAnalysis.canMeetSignupBonus) {
        const bonusValue = cardItem.signupBonus.type === 'points' ? 
          cardItem.signupBonus.amount * 0.015 : 
          cardItem.signupBonus.amount;
        
        if (bonusValue > 500) {
          signupScore = weights.signup;
          matchFactors++;
          reasons.push(`Valuable sign-up bonus worth $${bonusValue.toFixed(0)}`);
        } else if (bonusValue > 200) {
          signupScore = weights.signup * 0.7;
        }
      }
      
      // 6. Calculate how well this card complements the existing portfolio
      const { score: complementScore, contributions } = calculateComplementScore(
        cardItem, 
        currentCards,
        spendingAnalysis
      );
      
      // 7. Calculate long-term value (averaged over 4 years)
      const { value: longTermValue, description: valueDescription } = calculateLongTermValue(
        cardItem,
        spendingAnalysis
      );
      
      if (valueDescription) {
        reasons.push(valueDescription);
      }

// 8. Calculate final score with all components
const baseScore = preferenceScore + spendingScore + perksScore + valueScore + signupScore;
const portfolioFactors = (complementScore / 100 * weights.complement) + (longTermValue / 1000 * weights.longTerm);

// Add category overlap penalty to improve portfolio diversity
let categoryOverlapPenalty = 0;

// Safe check for currentCards
if (currentCards && currentCards.length > 0) {
  // Check each spending category in this card's reward rates
  for (const category in cardItem.rewardRates) {
    if (cardItem.rewardRates[category as keyof typeof cardItem.rewardRates] > 2) {
      // Check if any existing card is also strong in this category
      const hasOverlap = currentCards.some(existingCard => 
        existingCard.rewardRates[category as keyof typeof existingCard.rewardRates] > 2
      );
      
      if (hasOverlap) {
        // Add penalty for category overlap
        categoryOverlapPenalty += 15;
      }
    }
  }
}

// Modify the final score calculation to include the penalty
const totalScore = baseScore + portfolioFactors - categoryOverlapPenalty;

const matchPercentage = (matchFactors / 3) * 100;

// Generate reason for recommendation
const scoreComponents = {
  preferenceScore,
  spendingScore,
  longTermValue,
  complementScore
};

return {
  card: cardItem,
  reason: generateCardReason(cardItem, contributions, scoreComponents),
  score: totalScore, // Changed from finalScore to totalScore
  matchPercentage,
  potentialAnnualValue: annualRewardsEstimate,
  complementScore,
  longTermValue,
  portfolioContribution: contributions
};
});

// Sort by score
const rankedCards = scoredCards
  .sort((a: ScoredCard, b: ScoredCard) => b.score - a.score);

// First, establish the recommendation count
const recommendationCount = Math.min(4, Math.max(2, rankedCards.length));

// Then create the unique recommendations array
const uniqueRecommendations = Array.from(
  new Map(rankedCards.map(card => [card.card.id, card])).values()
) as ScoredCard[];

// Return recommendations limited to the calculated count
return uniqueRecommendations.slice(0, recommendationCount);
} catch (err) {
console.error('Recommendation generation error:', err);
return [];
}
}