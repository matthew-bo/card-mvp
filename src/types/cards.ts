export type CreditScoreType = "poor" | "fair" | "good" | "excellent";

export type OptimizationPreference = "points" | "creditScore" | "cashback" | "perks";

export interface OptimizationSettings {
  preference: OptimizationPreference;
  zeroAnnualFee: boolean;
}

export interface RewardRates {
  dining: number;
  travel: number;
  grocery: number;
  gas: number;
  entertainment: number;
  rent: number;
  other: number;
  [key: string]: number; // Allow for additional categories
}

export interface SignupBonus {
  amount: number;
  type: "points" | "cashback";
  spendRequired: number;
  timeframe: number;
  description: string;
}

export interface CreditCardDetails {
  id: string;
  name: string;
  issuer: string;
  rewardRates: RewardRates;
  annualFee: number;
  creditScoreRequired: CreditScoreType;
  perks: string[];
  signupBonus?: SignupBonus;
  foreignTransactionFee: boolean;
  categories: string[];
  description: string;
  cardType?: 'business' | 'personal';
}

export interface RecommendedCard {
  card: CreditCardDetails;
  reason: string;
  score: number;
  matchPercentage?: number;
  potentialAnnualValue?: number;
}

export interface FirestoreExpense {
  amount: number;
  category: string;
  date: { toDate: () => Date } | Date | string;
  userId: string;
}

export interface LoadedExpense {
  id: string;
  amount: number;
  category: string;
  date: Date;
  userId: string;
}

export interface SpendingAnalysis {
  totalSpend: number;
  categoryPercentages: Record<string, number>;
  monthlyAverage: number;
  highSpendCategories: string[];
  canMeetSignupBonus: boolean;
  spendingPattern: 'balanced' | 'category-focused' | 'low-spend' | 'high-spend';
}

export interface PointValueResult {
  value: number;         // Calculated dollar value
  displayValue: string;  // Formatted string for display
  pointAmount: number;   // Original point amount
  type: "points" | "cashback";
  issuer?: string;
}

// For the point value conversion
export interface PointMultipliers {
  [issuer: string]: number;
}

// For notification system
export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  id: number;
  timeout?: number;
}

// For API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User preferences stored in database
export interface UserPreferences {
  userId: string;
  optimizationPreference: OptimizationPreference;
  creditScore: CreditScoreType;
  zeroAnnualFee: boolean;
  updatedAt: Date;
}

// Database card reference
export interface UserCardReference {
  cardId: string;
  userId: string;
  dateAdded: Date;
}


export interface ApiStatusCode {
  statusCode: number;
  apiCalls: number;
  apiCallsLimit: number;
  apiCallsRemaining: number;
  lastUpdated: string;
}

export interface ApiUsageMonth {
  yearMonth: string;
  statusCode: ApiStatusCode[];
}

export interface ApiUsageResponse {
  success: boolean;
  data: ApiUsageMonth[];
  error?: string;
}