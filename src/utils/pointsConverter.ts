// src/utils/pointsConverter.ts

/**
 * Utility for standardizing point values across different credit card reward programs
 */

// Different issuers have different point values per point
interface PointMultipliers {
    [issuer: string]: number;
  }
  
  export const POINT_MULTIPLIERS: PointMultipliers = {
    'Chase': 0.015,      // Chase Ultimate Rewards (1.5 cents when redeemed for travel)
    'American Express': 0.01,  // Amex Membership Rewards (1 cent baseline)
    'Capital One': 0.01,  // Capital One Miles (1 cent baseline)
    'Citi': 0.01,        // Citi ThankYou Points (1 cent baseline)
    'Discover': 0.01,    // Discover Rewards (1 cent baseline)
    'default': 0.01      // Default value for unknown issuers
  };
  
  // For transfer partners, these can be even higher values
  export const TRANSFER_PARTNER_VALUES: PointMultipliers = {
    'Chase': 0.02,        // Up to 2 cents when transferred to partners
    'American Express': 0.019, // Up to 1.9 cents when transferred to partners
    'Capital One': 0.017,  // Up to 1.7 cents when transferred to partners
    'Citi': 0.017,        // Up to 1.7 cents when transferred to partners
    'default': 0.01
  };
  
  type PointType = 'points' | 'miles' | 'cashback';

  interface PointValueResult {
    value: number;
    description?: string;
  }

  const ISSUER_POINT_VALUES: Record<string, number> = {
    'Chase': 0.0125,      // Chase Ultimate Rewards
    'American Express': 0.01,  // Amex Membership Rewards
    'Capital One': 0.01,  // Capital One Miles
    'Citi': 0.01,        // Citi ThankYou Points
    'Discover': 0.01,     // Discover Rewards
    'Default': 0.01      // Default value for unknown issuers
  };

  /**
   * Converts points to a standardized dollar value based on issuer
   * 
   * @param amount - The number of points
   * @param type - Whether this is points or cashback
   * @param issuer - The card issuer (e.g., 'Chase', 'American Express')
   * @param useTransferValue - Whether to use the higher transfer partner values
   * @returns Point value information
   */
  export function getPointValue(
    amount: number,
    type: PointType,
    issuer?: string
  ): PointValueResult {
    if (type === 'cashback') {
      return {
        value: amount,
        description: `$${amount.toFixed(2)} in cashback`
      };
    }

    const multiplier = issuer ? (ISSUER_POINT_VALUES[issuer] || ISSUER_POINT_VALUES.Default) : ISSUER_POINT_VALUES.Default;
    const value = amount * multiplier;

    return {
      value,
      description: `${amount.toLocaleString()} ${type} (≈$${value.toFixed(2)})`
    };
  }
  
  /**
   * Returns tooltip text explaining the point value calculation
   */
  export function getPointValueTooltip(issuer?: string): string {
    if (!issuer || !POINT_MULTIPLIERS[issuer]) {
      return "Points typically worth about 1¢ each when redeemed for statement credits or travel.";
    }
    
    const multiplier = POINT_MULTIPLIERS[issuer];
    const transferMultiplier = TRANSFER_PARTNER_VALUES[issuer];
    
    if (issuer === "Chase") {
      return `Chase Ultimate Rewards points worth ${multiplier * 100}¢ each when redeemed through the Chase travel portal, and potentially up to ${transferMultiplier * 100}¢ each when transferred to travel partners.`;
    }
    
    if (issuer === "American Express") {
      return `American Express Membership Rewards points worth ${multiplier * 100}¢ each for statement credits, and potentially up to ${transferMultiplier * 100}¢ each when transferred to travel partners.`;
    }
    
    if (issuer === "Capital One") {
      return `Capital One miles worth ${multiplier * 100}¢ each when redeemed for travel, and potentially up to ${transferMultiplier * 100}¢ each when transferred to travel partners.`;
    }
    
    return `${issuer} points typically worth ${multiplier * 100}¢ each when redeemed for statement credits or travel.`;
  }
  
  /**
   * Calculates estimated annual reward value based on spending patterns
   */
  export function calculateAnnualRewardValue(
    monthlySpending: Record<string, number>,
    card: {
      rewardRates: Record<string, number>;
      issuer: string;
    },
    useTransferValue: boolean = false
  ): number {
    // Calculate annual spending by category
    const annualSpending = Object.entries(monthlySpending).reduce(
      (acc, [category, amount]) => {
        acc[category] = amount * 12;
        return acc;
      },
      {} as Record<string, number>
    );
    
    // Calculate points earned annually
    let totalPoints = 0;
    
    Object.entries(annualSpending).forEach(([category, amount]) => {
      const rate = card.rewardRates[category as keyof typeof card.rewardRates] || card.rewardRates.other || 1;
      totalPoints += amount * (rate / 100);
    });
    
    // Convert points to dollar value
    const multipliers = useTransferValue ? TRANSFER_PARTNER_VALUES : POINT_MULTIPLIERS;
    const multiplier = multipliers[card.issuer] || multipliers.default;
    
    return totalPoints * multiplier;
  }