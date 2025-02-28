import { CreditCardDetails } from '@/types/cards';

// Make sure these are accessible as environment variables
const API_KEY = process.env.REWARDS_API_KEY;
const API_HOST = 'rewards-credit-card-api.p.rapidapi.com';
const API_BASE_URL = 'https://rewards-credit-card-api.p.rapidapi.com';

// Search cards by name
export async function searchCardsByName(name: string): Promise<{cardKey: string, cardName: string, cardIssuer: string}[]> {
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

// Get card details by cardKey
export async function getCardDetails(cardKey: string): Promise<any> {
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
    return data[0]; // API returns an array with a single object
  } catch (error) {
    console.error(`Error fetching card details for ${cardKey}:`, error);
    throw error;
  }
}

// Get all cards (limited version for testing)
export async function getAllCards(): Promise<any[]> {
  try {
    // This API doesn't have a direct "get all cards" endpoint in your plan
    // So we'll use a common search term that will return some cards
    const response = await fetch(`${API_BASE_URL}/creditcard-detail-namesearch/card`, {
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
    console.error('Error fetching all cards:', error);
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
    
    const data = await response.json();
    return data[0]?.cardImageUrl || '';
  } catch (error) {
    console.error(`Error fetching card image for ${cardKey}:`, error);
    throw error;
  }
}

// Map API card data to your application's format
export function mapApiCardToAppFormat(apiCard: any): CreditCardDetails {
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
    apiCard.spendBonusCategory.forEach((category: any) => {
      const categoryName = category.spendBonusCategoryName?.toLowerCase() || '';
      
      // Map API categories to our categories
      if (categoryName.includes('dining') || categoryName.includes('restaurant')) {
        rewardRates.dining = Math.max(rewardRates.dining, category.earnMultiplier || 1);
      }
      if (categoryName.includes('travel') || categoryName.includes('airline') || 
          categoryName.includes('hotel') || categoryName.includes('airfare')) {
        rewardRates.travel = Math.max(rewardRates.travel, category.earnMultiplier || 1);
      }
      if (categoryName.includes('grocery') || categoryName.includes('supermarket')) {
        rewardRates.grocery = Math.max(rewardRates.grocery, category.earnMultiplier || 1);
      }
      if (categoryName.includes('gas') || categoryName.includes('fuel')) {
        rewardRates.gas = Math.max(rewardRates.gas, category.earnMultiplier || 1);
      }
      if (categoryName.includes('entertainment')) {
        rewardRates.entertainment = Math.max(rewardRates.entertainment, category.earnMultiplier || 1);
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
    if (apiCard.creditRange.toLowerCase().includes('excellent')) {
      creditScore = "excellent";
    } else if (apiCard.creditRange.toLowerCase().includes('good')) {
      creditScore = "good";
    } else if (apiCard.creditRange.toLowerCase().includes('fair')) {
      creditScore = "fair";
    } else {
      creditScore = "poor";
    }
  }
  
  // Extract perks
  const perks: string[] = [];
  if (apiCard.benefit && Array.isArray(apiCard.benefit)) {
    apiCard.benefit.forEach((benefit: any) => {
      if (benefit.benefitTitle) {
        perks.push(benefit.benefitTitle);
      }
    });
  }
  
  // Determine categories
  const categories: string[] = [];
  if (rewardRates.dining > baseSpend) categories.push('dining');
  if (rewardRates.travel > baseSpend) categories.push('travel');
  if (rewardRates.grocery > baseSpend) categories.push('grocery');
  if (rewardRates.gas > baseSpend) categories.push('gas');
  if (apiCard.baseSpendEarnType?.toLowerCase().includes('cash')) categories.push('cashback');
  if (apiCard.baseSpendEarnType?.toLowerCase().includes('point')) categories.push('points');
  
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
  
  return {
    id: apiCard.cardKey,
    name: apiCard.cardName,
    issuer: apiCard.cardIssuer,
    rewardRates: rewardRates,
    annualFee: parseInt(String(apiCard.annualFee)) || 0,
    creditScoreRequired: creditScore,
    perks: perks,
    signupBonus: signupBonus,
    foreignTransactionFee: apiCard.isFxFee === 1,
    categories: categories.length > 0 ? categories : ['other'],
    description: apiCard.signupBonusDesc || `A ${apiCard.cardName} card from ${apiCard.cardIssuer}`
  };
}