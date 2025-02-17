export type OptimizationPreference = "points" | "creditScore" | "cashback" | "perks";

export interface CreditCardDetails {
  id: string;
  name: string;
  issuer: string;
  rewardRates: { 
    dining: number;
    travel: number;
    grocery: number;
    gas: number;
    entertainment: number;
    rent: number;
    other: number;
  };
  annualFee: number;
  creditScoreRequired: "poor" | "fair" | "good" | "excellent";
  perks: string[];
  signupBonus?: {
    amount: number;
    type: "points" | "cashback";
    spendRequired: number;
    timeframe: number;
    description: string;
  };
  foreignTransactionFee: boolean;
  categories: string[];
  description: string;
}

export interface Recommendation {
  card: CreditCardDetails;
  reason: string;
  score: number;
}

export interface Expense {
    id: string;
    amount: number;
    category: 'dining' | 'travel' | 'grocery' | 'gas' | 'other';
    date: Date;
}