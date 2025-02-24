import { CreditCardDetails } from '@/types/cards';
import { creditCards } from '@/lib/cardDatabase';
import { OptimizationPreference, OptimizationSettings } from '@/types/cards';

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
  };
  monthlyAverage: number;
  highSpendCategories: string[];
  canMeetSignupBonus: boolean;
  spendingPattern: 'balanced' | 'category-focused' | 'low-spend' | 'high-spend';
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
}

type CreditScoreType = 'poor' | 'fair' | 'good' | 'excellent';
const CREDIT_SCORE_MAP = {
  poor: 1,
  fair: 2,
  good: 3,
  excellent: 4
} as const;

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

function analyzeSpending(expenses: Expense[]): SpendingAnalysis {
  try {
    const validExpenses = expenses.filter(validateExpense);
    if (validExpenses.length === 0) {
      throw new Error('No valid expenses found');
    }

    const totalSpend = validExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const spendByCategory = validExpenses.reduce((acc, exp) => {
      const category = exp.category || 'other';
      acc[category] = (acc[category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const dates = validExpenses.map(e => validateAndParseDate(e.date));
    const oldestDate = Math.min(...dates);
    const dateRange = Math.max(1, Math.ceil((Date.now() - oldestDate) / (30 * 24 * 60 * 60 * 1000)));
    const monthlyAverage = totalSpend / dateRange;

    const categoryPercentages = {
      dining: (spendByCategory.dining || 0) / totalSpend * 100,
      travel: (spendByCategory.travel || 0) / totalSpend * 100,
      grocery: (spendByCategory.grocery || 0) / totalSpend * 100,
      gas: (spendByCategory.gas || 0) / totalSpend * 100,
      entertainment: (spendByCategory.entertainment || 0) / totalSpend * 100,
      rent: (spendByCategory.rent || 0) / totalSpend * 100,
      other: (spendByCategory.other || 0) / totalSpend * 100,
    };

    const highSpendCategories = Object.entries(categoryPercentages)
      .filter(([, percentage]) => percentage > 15)
      .map(([category]) => category);

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
      spendingPattern
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
      spendingPattern: 'low-spend'
    };
  }
}

interface RecommendationParams {
  expenses: Expense[];
  currentCards: CreditCardDetails[];
  optimizationSettings: OptimizationSettings;
  creditScore?: CreditScoreType;
}

export function getCardRecommendations(params: RecommendationParams): ScoredCard[] {
  try {
    const { expenses, currentCards, optimizationSettings, creditScore } = params;
    const spendingAnalysis = analyzeSpending(expenses);

    if (!Array.isArray(currentCards)) {
      throw new Error('Invalid current cards array');
    }

    const availableCards = creditCards.filter(card => 
      !currentCards.some(userCard => userCard.id === card.id) &&
      // Filter out cards with annual fees if user prefers no annual fee
      (!optimizationSettings.zeroAnnualFee || card.annualFee === 0)
    );

    const scoredCards: ScoredCard[] = availableCards.map(card => {
      let score = 0;
      const reasons: string[] = [];
      let matchFactors = 0;

      // Credit Score Check
      if (creditScore) {
        const requiredScore = CREDIT_SCORE_MAP[card.creditScoreRequired];
        const userScoreValue = CREDIT_SCORE_MAP[creditScore];
        if (userScoreValue < requiredScore) {
          return {
            card,
            reason: "Credit score requirement not met",
            score: -1000,
            matchPercentage: 0,
            potentialAnnualValue: 0
          };
        }
      }

      // Optimization Preference Matching (adjusted weights based on preference)
      type PreferenceWeights = {
        [key in OptimizationPreference]: {
          rewards: number;
          perks: number;
          value: number;
          signup: number;
        }
      };
      
      const preferenceWeights: PreferenceWeights = {
        points: { rewards: 40, perks: 20, value: 30, signup: 10 },
        cashback: { rewards: 50, perks: 10, value: 30, signup: 10 },
        perks: { rewards: 20, perks: 50, value: 20, signup: 10 },
        creditScore: { rewards: 30, perks: 20, value: 40, signup: 10 }
      };

      const weights = preferenceWeights[optimizationSettings.preference];

      // Card matches optimization preference
      if (card.categories.includes(optimizationSettings.preference)) {
        score += weights.rewards;
        matchFactors++;
        reasons.push(`Optimizes for ${optimizationSettings.preference}`);
      }

      // Perks Scoring (enhanced for perks preference)
      if (optimizationSettings.preference === 'perks') {
        const perkScore = card.perks.length * 5; // More weight to number of perks
        score += Math.min(perkScore, 50); // Cap at 50 points
        if (card.perks.length > 3) {
          reasons.push(`Strong perks package with ${card.perks.length} benefits`);
        }
      }

      // Spending Pattern Analysis (weighted by preference)
      const categoryMatches = spendingAnalysis.highSpendCategories
        .filter(category => {
          const rewardRate = card.rewardRates[category as keyof typeof card.rewardRates];
          return rewardRate > 2;
        });

      if (categoryMatches.length > 0) {
        const spendingScore = (categoryMatches.length / spendingAnalysis.highSpendCategories.length) * weights.rewards;
        score += spendingScore;
        matchFactors++;
        reasons.push(`Strong rewards in ${categoryMatches.length} of your top spending categories`);
      }

      // Value Proposition (adjusted for preference)
      const potentialAnnualRewards = Object.entries(spendingAnalysis.categoryPercentages)
        .reduce((sum, [category, percentage]) => {
          const spend = (spendingAnalysis.monthlyAverage * 12) * (percentage / 100);
          const rate = card.rewardRates[category as keyof typeof card.rewardRates];
          return sum + (spend * (rate / 100));
        }, 0);

      const valueScore = card.annualFee === 0 ? weights.value : 
        (potentialAnnualRewards > card.annualFee * 2) ? weights.value : 
        (potentialAnnualRewards > card.annualFee) ? weights.value / 2 : 0;

      score += valueScore;
      if (card.annualFee === 0) {
        reasons.push("No annual fee");
      } else if (potentialAnnualRewards > card.annualFee * 2) {
        reasons.push(`${potentialAnnualRewards.toFixed(0)} rewards value exceeds ${card.annualFee} annual fee`);
      }

      // Sign-up Bonus Value (weighted less for perks focus)
      if (card.signupBonus && spendingAnalysis.canMeetSignupBonus) {
        const bonusValue = card.signupBonus.type === 'points' ? 
          card.signupBonus.amount * 0.015 : 
          card.signupBonus.amount;
        
        if (bonusValue > 500) {
          score += weights.signup;
          matchFactors++;
          reasons.push(`Valuable sign-up bonus worth $${bonusValue.toFixed(0)}`);
        }
      }

      const matchPercentage = (matchFactors / 4) * 100;

      return {
        card,
        reason: reasons.slice(0, 2).join(". "),
        score,
        matchPercentage,
        potentialAnnualValue: potentialAnnualRewards
      };
    });

    return scoredCards
      .sort((a: ScoredCard, b: ScoredCard) => b.score - a.score)
      .slice(0, 3);

  } catch (err) {
    console.error('Recommendation generation error:', err);
    return [];
  }
}