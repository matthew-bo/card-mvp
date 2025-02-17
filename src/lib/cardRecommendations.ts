import { CreditCardDetails, OptimizationPreference } from '@/types/cards';
import { creditCards } from './cardDatabase';

interface Expense {
  amount: number;
  category: 'dining' | 'travel' | 'grocery' | 'gas' | 'other';
  date: Date;
}

interface SpendingPattern {
  totalSpend: number;
  categoryPercentages: {
    dining: number;
    travel: number;
    grocery: number;
    gas: number;
    other: number;
  };
  monthlyAverage: number;
}

export function analyzeSpending(expenses: Expense[]): SpendingPattern {
  const totalSpend = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const spendByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSpend,
    categoryPercentages: {
      dining: (spendByCategory.dining || 0) / totalSpend * 100,
      travel: (spendByCategory.travel || 0) / totalSpend * 100,
      grocery: (spendByCategory.grocery || 0) / totalSpend * 100,
      gas: (spendByCategory.gas || 0) / totalSpend * 100,
      other: (spendByCategory.other || 0) / totalSpend * 100,
    },
    monthlyAverage: totalSpend / (expenses.length > 0 ? 
      Math.max(1, Math.ceil((new Date().getTime() - new Date(Math.min(...expenses.map(e => e.date.getTime()))).getTime()) / (30 * 24 * 60 * 60 * 1000))) 
      : 1)
  };
}

export function getCardRecommendations(params: {
  expenses: Expense[];
  currentCards: CreditCardDetails[];
  optimizationPreference: OptimizationPreference;
  creditScore?: 'poor' | 'fair' | 'good' | 'excellent';
}): { card: CreditCardDetails; reason: string; score: number }[] {
  const { expenses, currentCards, optimizationPreference, creditScore } = params;
  const spendingPattern = analyzeSpending(expenses);

  // Filter out cards user already has
  const availableCards = creditCards.filter(
    card => !currentCards.find(userCard => userCard.id === card.id)
  );

  // Score each card
  const scoredCards = availableCards.map(card => {
    let score = 0;
    let reasons: string[] = [];

    // Credit Score Check
    if (creditScore) {
      const scoreMap = { poor: 1, fair: 2, good: 3, excellent: 4 };
      const requiredScore = scoreMap[card.creditScoreRequired];
      const userScoreValue = scoreMap[creditScore];
      if (userScoreValue < requiredScore) {
        score -= 1000; // Effectively removes from consideration
        reasons.push("Credit score requirement not met");
      }
    }

    // Optimization Preference Matching
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
        if (card.perks.length > 3) {
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

    // Spending Pattern Analysis
    const categories = ['dining', 'travel', 'grocery', 'gas'] as const;
    categories.forEach(category => {
      if (spendingPattern.categoryPercentages[category] > 15) {
        const rewardRate = card.rewards[category];
        if (rewardRate > 2) {
          score += 20;
          reasons.push(`Strong ${category} rewards matching your spending`);
        }
      }
    });

    // Value Proposition
    if (card.annualFee === 0) {
      score += 10;
      reasons.push("No annual fee");
    } else {
      // Check if spending justifies annual fee
      const potentialAnnualRewards = Object.entries(spendingPattern.categoryPercentages).reduce(
        (sum, [category, percentage]) => {
          const categorySpend = (spendingPattern.monthlyAverage * 12) * (percentage / 100);
          return sum + (categorySpend * (card.rewards[category as keyof typeof card.rewards] / 100));
        }, 0);
      
      if (potentialAnnualRewards > card.annualFee * 1.5) {
        score += 15;
        reasons.push("Rewards likely to outweigh annual fee");
      }
    }

    // Sign-up Bonus Consideration
    if (card.signupBonus && spendingPattern.monthlyAverage * card.signupBonus.timeframe >= card.signupBonus.spendRequired) {
      score += 20;
      reasons.push("Sign-up bonus spending requirement achievable");
    }

    return {
      card,
      reason: reasons.slice(0, 2).join(". "), // Return top 2 reasons
      score
    };
  });

  // Sort by score and return top 3
  return scoredCards
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}