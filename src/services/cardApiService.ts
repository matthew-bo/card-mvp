import { ApiUsageMonth } from '@/types/cards';
import { CreditCardDetails, CreditScoreType } from '@/types/cards';

// Make sure these are accessible as environment variables
const API_KEY = process.env.REWARDS_API_KEY;
const API_HOST = 'rewards-credit-card-api.p.rapidapi.com';
const API_BASE_URL = 'https://rewards-credit-card-api.p.rapidapi.com';

// Define interfaces for API responses
interface ApiCardBasic {
  cardKey: string;
  cardName: string;
  cardIssuer: string;
}

interface ApiCardDetail {
  cardKey: string;
  cardName: string;
  cardIssuer: string;
  annualFee?: number;
  creditRange?: string;
  baseSpendAmount?: number;
  isSignupBonus?: number;
  signupBonusAmount?: string;
  signupBonusType?: string;
  signupBonusSpend?: number;
  signupBonusLength?: number;
  signupBonusDesc?: string;
  isFxFee?: number;
  spendBonusCategory?: Array<{
    spendBonusCategoryName: string;
    earnMultiplier?: number;
  }>;
  benefit?: Array<{
    benefitTitle: string;
    benefitDesc?: string;
  }>;
  baseSpendEarnType?: string;
}

interface ApiCardImage {
  cardKey: string;
  cardName: string;
  cardImageUrl: string;
}

// Search cards by name
export async function searchCardsByName(name: string): Promise<ApiCardBasic[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/creditcard-detail-namesearch/${name}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY || '',
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching cards:', error);
    throw error;
  }
}


export async function getApiUsage(): Promise<ApiUsageMonth[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/creditcard-apiusage/${API_KEY}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY || '',
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching API usage:', error);
    throw error;
  }
}

export class ApiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiRateLimitError';
  }
}

// Update your fetch functions to handle rate limits properly
export async function fetchWithRateLimitHandling(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    throw new ApiRateLimitError('API rate limit exceeded');
  }
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response;
}

// Get all cards
// Update your fetchAllCards function to use the cardlist endpoint
// Updated code for fetchAllCards function
export async function fetchAllCards(): Promise<CreditCardDetails[]> {
  try {
    console.log('Fetching all cards from API...');
    
    const response = await fetch(`${API_BASE_URL}/creditcard-cardlist`, {
      headers: {
        'X-RapidAPI-Key': API_KEY || '',
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const issuersWithCards = await response.json();
    const allCardBasics: { cardKey: string; cardName: string; cardIssuer: string }[] = [];
    
    // Extract all cards from all issuers
    for (const issuer of issuersWithCards) {
      for (const card of issuer.card) {
        if (card.isActive === 1) {
          allCardBasics.push({
            cardKey: card.cardKey,
            cardName: card.cardName,
            cardIssuer: issuer.cardIssuer
          });
        }
      }
    }
    
    // Fetch details for a subset of cards (to avoid rate limits)
    // In production, you might want to implement a caching strategy
    const detailedCards: CreditCardDetails[] = [];
    
    // Process in batches to respect API rate limits
    const batchSize = 10;
    const cardsToProcess = allCardBasics.slice(0, 50); // Process 50 for testing
    
    for (let i = 0; i < cardsToProcess.length; i += batchSize) {
      const batch = cardsToProcess.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (card) => {
        try {
          return await getCardDetails(card.cardKey);
        } catch (error) {
          console.error(`Error fetching details for ${card.cardName}:`, error);
          // Create a minimal card with basic info - with correct type for creditScoreRequired
          return {
            id: card.cardKey,
            name: card.cardName,
            issuer: card.cardIssuer,
            rewardRates: {
              dining: 1,
              travel: 1,
              grocery: 1,
              gas: 1,
              entertainment: 1,
              rent: 1,
              other: 1
            },
            annualFee: 0,
            creditScoreRequired: "good" as CreditScoreType, // Add 'as CreditScoreType' to fix the type error
            perks: [],
            foreignTransactionFee: false,
            categories: ["other"],
            description: `A ${card.cardName} card from ${card.cardIssuer}`
          } as CreditCardDetails; // Add type assertion to ensure it matches
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      detailedCards.push(...batchResults);
      
      // Add a small delay between batches to avoid rate limits
      if (i + batchSize < cardsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return detailedCards;
  } catch (error) {
    console.error('Error fetching all cards:', error);
    throw error;
  }
}

// Get card details by cardKey
export async function fetchCardById(cardKey: string): Promise<CreditCardDetails> {
  return getCardDetails(cardKey); // Reuse your existing function
}

// Map API card data to your application's format
export function mapApiCardToAppFormat(apiCard: ApiCardDetail): CreditCardDetails {
  // Parse reward rates from spend bonus categories
  const rewardRates: {
    dining: number;
    travel: number;
    grocery: number;
    gas: number;
    entertainment: number;
    rent: number;
    other: number;
  } = {
    dining: 1,
    travel: 1,
    grocery: 1,
    gas: 1,
    entertainment: 1,
    rent: 1,
    other: 1
  };
  
  if (apiCard.spendBonusCategory && Array.isArray(apiCard.spendBonusCategory)) {
    apiCard.spendBonusCategory.forEach((category) => {
      const categoryName = category.spendBonusCategoryName?.toLowerCase() || '';
      const earnMultiplier = category.earnMultiplier || 1;
      
      // Map API categories to our categories
      if (categoryName.includes('dining') || categoryName.includes('restaurant')) {
        rewardRates.dining = Math.max(rewardRates.dining, earnMultiplier);
      }
      if (categoryName.includes('travel') || categoryName.includes('airline') || 
          categoryName.includes('hotel') || categoryName.includes('airfare')) {
        rewardRates.travel = Math.max(rewardRates.travel, earnMultiplier);
      }
      if (categoryName.includes('grocery') || categoryName.includes('supermarket')) {
        rewardRates.grocery = Math.max(rewardRates.grocery, earnMultiplier);
      }
      if (categoryName.includes('gas') || categoryName.includes('fuel')) {
        rewardRates.gas = Math.max(rewardRates.gas, earnMultiplier);
      }
      if (categoryName.includes('entertainment')) {
        rewardRates.entertainment = Math.max(rewardRates.entertainment, earnMultiplier);
      }
    });
  }
  
  // Default for base spending
  const baseSpend = apiCard.baseSpendAmount || 1;
  Object.keys(rewardRates).forEach(key => {
    if (rewardRates[key as keyof typeof rewardRates] === 1) {
      rewardRates[key as keyof typeof rewardRates] = baseSpend;
    }
  });
  
  // Map credit score
  let creditScore: "poor" | "fair" | "good" | "excellent" = "good";
  if (apiCard.creditRange) {
    const creditRangeLower = apiCard.creditRange.toLowerCase();
    if (creditRangeLower.includes('excellent')) {
      creditScore = "excellent";
    } else if (creditRangeLower.includes('good')) {
      creditScore = "good";
    } else if (creditRangeLower.includes('fair')) {
      creditScore = "fair";
    } else {
      creditScore = "poor";
    }
  }
  
  // Extract perks
  const perks: string[] = [];
  if (apiCard.benefit && Array.isArray(apiCard.benefit)) {
    apiCard.benefit.forEach((benefit) => {
      if (benefit.benefitTitle) {
        perks.push(benefit.benefitTitle);
      }
    });
  }
  
  // Create signup bonus data if available
  let signupBonus = undefined;
  if (apiCard.isSignupBonus === 1 && apiCard.signupBonusAmount) {
    try {
      const amount = parseInt(apiCard.signupBonusAmount) || 0;
      const spendRequired = parseInt(String(apiCard.signupBonusSpend)) || 0;
      const timeframe = parseInt(String(apiCard.signupBonusLength)) || 3;
      
      signupBonus = {
        amount: amount,
        type: apiCard.signupBonusType?.toLowerCase().includes('cash') ? 'cashback' as const : 'points' as const,
        spendRequired: spendRequired,
        timeframe: timeframe,
        description: apiCard.signupBonusDesc || `Earn ${apiCard.signupBonusAmount} after spending $${spendRequired}`
      };
    } catch (error) {
      console.error('Error parsing signup bonus data:', error);
      // If parsing fails, leave signupBonus as undefined
    }
  }
  
  // Create categories array with more variety
  const categories: string[] = [];
  if (rewardRates.dining > baseSpend) categories.push('dining');
  if (rewardRates.travel > baseSpend) categories.push('travel');
  if (rewardRates.grocery > baseSpend) categories.push('grocery');
  if (rewardRates.gas > baseSpend) categories.push('gas');
  if (apiCard.baseSpendEarnType?.toLowerCase().includes('cash')) categories.push('cashback');
  if (apiCard.baseSpendEarnType?.toLowerCase().includes('point')) categories.push('points');
  
  // Add additional categories to ensure diversity
  if (apiCard.annualFee === 0) categories.push('no-annual-fee');
  if (parseFloat(String(apiCard.annualFee)) > 300) categories.push('premium');
  if (!apiCard.isFxFee) categories.push('no-foreign-fee');
  
  // Ensure we have at least one category
  if (categories.length === 0) {
    categories.push('other');
  }
  
  return {
    id: apiCard.cardKey || '',
    name: apiCard.cardName || '',
    issuer: apiCard.cardIssuer || '',
    rewardRates: rewardRates,
    annualFee: parseInt(String(apiCard.annualFee)) || 0,
    creditScoreRequired: creditScore,
    perks: perks,
    signupBonus: signupBonus,
    foreignTransactionFee: apiCard.isFxFee === 1,
    categories: categories,
    description: apiCard.signupBonusDesc || `A ${apiCard.cardName} card from ${apiCard.cardIssuer}`
  };
}

// Get card details by cardKey
export async function getCardDetails(cardKey: string): Promise<CreditCardDetails> {
  try {
    const response = await fetch(`${API_BASE_URL}/creditcard-detail-bycard/${cardKey}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY || '',
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid API response format');
    }
    
    return mapApiCardToAppFormat(data[0] as ApiCardDetail);
  } catch (error) {
    console.error(`Error fetching card details for ${cardKey}:`, error);
    throw error;
  }
}

// Get card image
export async function getCardImage(cardKey: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/creditcard-card-image/${cardKey}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY || '',
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json() as ApiCardImage[];
    return data[0]?.cardImageUrl || '';
  } catch (error) {
    console.error(`Error fetching card image for ${cardKey}:`, error);
    throw error;
  }
}