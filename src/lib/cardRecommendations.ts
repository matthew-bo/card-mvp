import { CreditCardDetails, OptimizationPreference } from '@/types/cards';
import { creditCards } from '@/lib/cardDatabase';

interface Expense {
  id: string;
  amount: number;
  category: 'dining' | 'travel' | 'grocery' | 'gas' | 'entertainment' | 'rent' | 'other';
  date: Date;
}

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
}

function analyzeSpending(expenses: Expense[]): SpendingAnalysis {
  const totalSpend = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const spendByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyAverage = totalSpend / (expenses.length > 0 ? 
    Math.max(1, Math.ceil((new Date().getTime() - new Date(Math.min(...expenses.map(e => e.date.getTime()))).getTime()) / (30 * 24 * 60 * 60 * 1000))) 
    : 1);

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
    .filter(([, percentage]) => percentage > 10)
    .map(([category]) => category);

  return {
    totalSpend,
    categoryPercentages,
    monthlyAverage,
    highSpendCategories,
    canMeetSignupBonus: monthlyAverage * 3 >= 4000 // Assumes typical 3-month period
  };
}

function scoreCard(
  card: CreditCardDetails,
  spendingAnalysis: SpendingAnalysis,
  optimizationPreference: OptimizationPreference,
  currentCards: CreditCardDetails[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Optimization Preference Matching (0-30 points)
  switch (optimizationPreference) {
    case 'points':
      if (card.categories.includes('points')) {
        score += 30;
        reasons.push("Matches preference for points earning");
      }
      break;
    case 'cashback':
      if (card.categories.includes('cashback')) {
        score += 30;
        reasons.push("Matches preference for cashback");
      }
      break;
    case 'perks':
      if (card.perks.length > 4) {
        score += 30;
        reasons.push("Strong perks selection");
      }
      break;
    case 'creditScore':
      if (card.categories.includes('build-credit')) {
        score += 30;
        reasons.push("Good for building credit");
      }
      break;
  }

  // 2. Spending Pattern Matching (0-50 points)
  spendingAnalysis.highSpendCategories.forEach(category => {
    const rewardRate = card.rewardRates[category as keyof typeof card.rewardRates];
    const currentBestRate = Math.max(...currentCards.map(c => 
      c.rewardRates[category as keyof typeof c.rewardRates] || 0
    ));

    if (rewardRate > currentBestRate) {
      score += 15;
      reasons.push(`Better ${category} rewards than current cards (${rewardRate}% vs ${currentBestRate}%)`);
    }
  });

  // 3. Annual Fee Value Proposition (0-20 points)
  const potentialAnnualRewards = Object.entries(spendingAnalysis.categoryPercentages)
    .reduce((sum, [category, percentage]) => {
      const categorySpend = (spendingAnalysis.monthlyAverage * 12) * (percentage / 100);
      return sum + (categorySpend * (card.rewardRates[category as keyof typeof card.rewardRates] / 100));
    }, 0);

  if (card.annualFee === 0) {
    score += 10;
    reasons.push("No annual fee");
  } else if (potentialAnnualRewards > card.annualFee * 2) {
    score += 20;
    reasons.push(`Rewards ($${potentialAnnualRewards.toFixed(0)}) significantly exceed annual fee ($${card.annualFee})`);
  } else if (potentialAnnualRewards > card.annualFee * 1.5) {
    score += 10;
    reasons.push("Rewards outweigh annual fee");
  }

  // 4. Sign-up Bonus Consideration (0-20 points)
  if (card.signupBonus && spendingAnalysis.canMeetSignupBonus) {
    const bonusValue = card.signupBonus.type === 'points' ? 
      card.signupBonus.amount * 0.015 : // Assumes 1.5 cents per point
      card.signupBonus.amount;

    if (bonusValue > 500) {
      score += 20;
      reasons.push(`High-value signup bonus worth $${bonusValue}`);
    } else {
      score += 10;
      reasons.push(`Achievable signup bonus`);
    }
  }

  // 5. Card Portfolio Diversity (0-20 points)
  const existingIssuers = new Set(currentCards.map(c => c.issuer));
  if (!existingIssuers.has(card.issuer)) {
    score += 10;
    reasons.push("Diversifies card portfolio with new issuer");
  }

  return { score, reasons };
}

export function getCardRecommendations(params: {
  expenses: Expense[];
  currentCards: CreditCardDetails[];
  optimizationPreference: OptimizationPreference;
  creditScore?: 'poor' | 'fair' | 'good' | 'excellent';
}): { card: CreditCardDetails; reason: string; score: number }[] {
  const { expenses, currentCards, optimizationPreference, creditScore } = params;
  const spendingAnalysis = analyzeSpending(expenses);

  const scoreMap: Record<string, number> = { 
    poor: 1, 
    fair: 2, 
    good: 3, 
    excellent: 4 
  };

  type ScoredCard = {
    card: CreditCardDetails;
    reason: string;
    score: number;
  };

  // Get all available cards (excluding ones user already has)
  const availableCards: CreditCardDetails[] = creditCards.filter(
    (card: CreditCardDetails) => !currentCards.some(userCard => userCard.id === card.id)
  );

  // Score each available card
  const scoredCards: ScoredCard[] = availableCards.map((card: CreditCardDetails) => {
    // Check credit score requirement first
    if (creditScore) {
      const requiredScore = scoreMap[card.creditScoreRequired];
      const userScoreValue = scoreMap[creditScore];
      if (userScoreValue < requiredScore) {
        return {
          card,
          reason: "Credit score requirement not met",
          score: -1000
        };
      }
    }

    // Score the card
    const { score, reasons } = scoreCard(card, spendingAnalysis, optimizationPreference, currentCards);

    return {
      card,
      reason: reasons.join(". "),
      score
    };
  });

  // Return top 3 cards, sorted by score
  return scoredCards
    .sort((a: ScoredCard, b: ScoredCard) => b.score - a.score)
    .slice(0, 3);
}