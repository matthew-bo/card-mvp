// src/services/cardApiService.ts
import { CreditCardDetails } from '@/types/cards';

const API_KEY = process.env.NEXT_PUBLIC_REWARDS_API_KEY;
const API_BASE_URL = 'https://rapidapi.com/';

interface ApiCardResponse {
  // Define the structure that matches the API response
  id: string;
  name: string;
  issuer: string;
  annual_fee: number;
  rewards: {
    [category: string]: number;
  };
  signup_bonus?: {
    amount: number;
    type: string;
    spend_requirement: number;
    timeframe_months: number;
    description: string;
  };
  credit_score: string;
  foreign_transaction_fee: boolean;
  perks: string[];
  categories: string[];
  description: string;
  // Add any other fields from the API
}

/**
 * Fetches all credit cards from the Rewards Credit Card API
 */
export async function fetchAllCards(): Promise<CreditCardDetails[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/cards`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return mapApiCardsToAppFormat(data.cards);
  } catch (error) {
    console.error('Error fetching cards from API:', error);
    throw error;
  }
}

/**
 * Fetches a single card by ID
 */
export async function fetchCardById(id: string): Promise<CreditCardDetails> {
  try {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return mapApiCardToAppFormat(data);
  } catch (error) {
    console.error(`Error fetching card ID ${id} from API:`, error);
    throw error;
  }
}

/**
 * Maps API response format to our application's CreditCardDetails format
 */
function mapApiCardsToAppFormat(apiCards: ApiCardResponse[]): CreditCardDetails[] {
  return apiCards.map(mapApiCardToAppFormat);
}

function mapApiCardToAppFormat(apiCard: ApiCardResponse): CreditCardDetails {
  // Map credit score from API format to our format
  const creditScoreMap: {[key: string]: "poor" | "fair" | "good" | "excellent"} = {
    'poor': 'poor',
    'fair': 'fair',
    'good': 'good',
    'excellent': 'excellent',
    // Add any other mappings needed based on API values
  };

  return {
    id: apiCard.id,
    name: apiCard.name,
    issuer: apiCard.issuer,
    rewardRates: {
      dining: apiCard.rewards.dining || 0,
      travel: apiCard.rewards.travel || 0,
      grocery: apiCard.rewards.grocery || 0,
      gas: apiCard.rewards.gas || 0,
      entertainment: apiCard.rewards.entertainment || 0,
      rent: apiCard.rewards.rent || 0,
      other: apiCard.rewards.other || 0,
      // Map any other categories from the API
    },
    annualFee: apiCard.annual_fee,
    creditScoreRequired: creditScoreMap[apiCard.credit_score] || 'good',
    perks: apiCard.perks,
    signupBonus: apiCard.signup_bonus ? {
      amount: apiCard.signup_bonus.amount,
      type: apiCard.signup_bonus.type as "points" | "cashback",
      spendRequired: apiCard.signup_bonus.spend_requirement,
      timeframe: apiCard.signup_bonus.timeframe_months,
      description: apiCard.signup_bonus.description
    } : undefined,
    foreignTransactionFee: apiCard.foreign_transaction_fee,
    categories: apiCard.categories,
    description: apiCard.description
  };
}