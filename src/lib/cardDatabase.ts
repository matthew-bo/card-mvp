import { CreditCardDetails } from '@/types/cards';

export const creditCards: CreditCardDetails[] = [
  // Chase Cards
  {
    id: "chase-sapphire-reserve",
    name: "Chase Sapphire Reserve",
    issuer: "Chase",
    rewardRates: {
      dining: 3,
      travel: 5,
      grocery: 1,
      gas: 1,
      entertainment: 1,
      rent: 1,
      other: 1
    },
    annualFee: 550,
    creditScoreRequired: "excellent",
    perks: [
      "$300 Annual Travel Credit",
      "Priority Pass™ Select Lounge Access",
      "Global Entry/TSA PreCheck Credit",
      "10x Points on Hotels and Car Rentals through Chase",
      "Primary Rental Car Insurance",
      "Trip Delay/Cancellation Insurance",
      "DoorDash DashPass Membership"
    ],
    signupBonus: {
      amount: 60000,
      type: "points",
      spendRequired: 4000,
      timeframe: 3,
      description: "Earn 60,000 bonus points after spending $4,000 in first 3 months (worth $900 when redeemed for travel)"
    },
    foreignTransactionFee: false,
    categories: ["travel", "premium", "dining", "points"],
    description: "Premium travel card with extensive travel benefits and strong rewards on travel and dining."
  },
  {
    id: "chase-freedom-unlimited",
    name: "Chase Freedom Unlimited",
    issuer: "Chase",
    rewardRates: {
      dining: 3,
      travel: 5,
      grocery: 3,
      gas: 1.5,
      entertainment: 1.5,
      rent: 1.5,
      other: 1.5
    },
    annualFee: 0,
    creditScoreRequired: "good",
    perks: [
      "3% on Dining and Drugstores",
      "5% on Travel through Chase",
      "1.5% on Everything Else",
      "0% Intro APR Period"
    ],
    signupBonus: {
      amount: 200,
      type: "cashback",
      spendRequired: 500,
      timeframe: 3,
      description: "Earn $200 bonus after spending $500 in first 3 months"
    },
    foreignTransactionFee: true,
    categories: ["cashback", "no-annual-fee"],
    description: "No annual fee card with strong everyday rewards and flexible redemption options."
  },
  {
    id: "chase-freedom-flex",
    name: "Chase Freedom Flex",
    issuer: "Chase",
    rewardRates: {
      dining: 3,
      travel: 5,
      grocery: 3,
      gas: 1,
      entertainment: 1,
      rent: 1,
      other: 1
    },
    annualFee: 0,
    creditScoreRequired: "good",
    perks: [
      "5% Rotating Quarterly Categories",
      "3% on Dining and Drugstores",
      "5% on Travel through Chase",
      "Cell Phone Protection",
      "0% Intro APR Period"
    ],
    signupBonus: {
      amount: 200,
      type: "cashback",
      spendRequired: 500,
      timeframe: 3,
      description: "Earn $200 bonus after spending $500 in first 3 months"
    },
    foreignTransactionFee: true,
    categories: ["cashback", "rotating-categories", "no-annual-fee"],
    description: "No annual fee card with rotating 5% categories and strong fixed category rewards."
  },
  // Amex Cards
  {
    id: "amex-blue-cash-preferred",
    name: "American Express Blue Cash Preferred",
    issuer: "American Express",
    rewardRates: {
      dining: 1,
      travel: 1,
      grocery: 6,
      gas: 3,
      entertainment: 6,
      rent: 1,
      other: 1
    },
    annualFee: 95,
    creditScoreRequired: "good",
    perks: [
      "6% at U.S. Supermarkets (up to $6,000 per year)",
      "6% on Select U.S. Streaming Services",
      "3% on Transit and U.S. Gas Stations",
      "Return Protection",
      "Purchase Protection"
    ],
    signupBonus: {
      amount: 250,
      type: "cashback",
      spendRequired: 3000,
      timeframe: 6,
      description: "Earn $250 back after spending $3,000 in first 6 months"
    },
    foreignTransactionFee: true,
    categories: ["cashback", "grocery", "streaming"],
    description: "Strong cash back card for groceries, streaming, and transit expenses."
  },
  {
    id: "amex-green",
    name: "American Express Green Card",
    issuer: "American Express",
    rewardRates: {
      dining: 3,
      travel: 3,
      grocery: 1,
      gas: 1,
      entertainment: 1,
      rent: 1,
      other: 1
    },
    annualFee: 150,
    creditScoreRequired: "good",
    perks: [
      "$100 CLEAR® Credit",
      "$100 LoungeBuddy Credit",
      "Trip Delay Insurance",
      "Purchase Protection",
      "Extended Warranty"
    ],
    signupBonus: {
      amount: 40000,
      type: "points",
      spendRequired: 2000,
      timeframe: 6,
      description: "Earn 40,000 Membership Rewards points after spending $2,000 in first 6 months"
    },
    foreignTransactionFee: false,
    categories: ["travel", "dining", "points"],
    description: "Entry-level travel rewards card with strong earnings on travel and dining."
  },
  // Capital One Cards
  {
    id: "capital-one-savor-one",
    name: "Capital One SavorOne",
    issuer: "Capital One",
    rewardRates: {
      dining: 3,
      travel: 1,
      grocery: 3,
      gas: 1,
      entertainment: 3,
      rent: 1,
      other: 1
    },
    annualFee: 0,
    creditScoreRequired: "good",
    perks: [
      "3% on Dining, Entertainment, Groceries",
      "3% on Streaming Services",
      "No Foreign Transaction Fees",
      "Extended Warranty",
      "Travel Accident Insurance"
    ],
    signupBonus: {
      amount: 200,
      type: "cashback",
      spendRequired: 500,
      timeframe: 3,
      description: "Earn $200 cash bonus after spending $500 in first 3 months"
    },
    foreignTransactionFee: false,
    categories: ["cashback", "dining", "entertainment", "no-annual-fee"],
    description: "No annual fee card with strong rewards on dining, entertainment, and groceries."
  },
  {
    id: "capital-one-quicksilver",
    name: "Capital One Quicksilver",
    issuer: "Capital One",
    rewardRates: {
      dining: 1.5,
      travel: 1.5,
      grocery: 1.5,
      gas: 1.5,
      entertainment: 1.5,
      rent: 1.5,
      other: 1.5
    },
    annualFee: 0,
    creditScoreRequired: "good",
    perks: [
      "1.5% Cash Back on Everything",
      "No Foreign Transaction Fees",
      "Extended Warranty",
      "Travel Accident Insurance"
    ],
    signupBonus: {
      amount: 200,
      type: "cashback",
      spendRequired: 500,
      timeframe: 3,
      description: "Earn $200 cash bonus after spending $500 in first 3 months"
    },
    foreignTransactionFee: false,
    categories: ["cashback", "no-annual-fee"],
    description: "Simple flat-rate cash back card with no annual fee."
  },
  // Discover Cards
  {
    id: "discover-it-cash-back",
    name: "Discover it Cash Back",
    issuer: "Discover",
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
    creditScoreRequired: "fair",
    perks: [
      "5% Rotating Quarterly Categories",
      "Cashback Match First Year",
      "No Foreign Transaction Fees",
      "Free FICO Score"
    ],
    signupBonus: {
      amount: 0,
      type: "cashback",
      spendRequired: 0,
      timeframe: 12,
      description: "Cashback Match: All cash back earned in first year is matched (effectively doubles rewards)"
    },
    foreignTransactionFee: false,
    categories: ["cashback", "rotating-categories", "no-annual-fee"],
    description: "No annual fee card with rotating 5% categories and first-year cashback match."
  },
  {
    id: "discover-it-student",
    name: "Discover it Student Cash Back",
    issuer: "Discover",
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
    creditScoreRequired: "fair",
    perks: [
      "5% Rotating Quarterly Categories",
      "Cashback Match First Year",
      "Good Grade Reward ($20 statement credit each school year)",
      "Free FICO Score"
    ],
    signupBonus: {
      amount: 0,
      type: "cashback",
      spendRequired: 0,
      timeframe: 12,
      description: "Cashback Match: All cash back earned in first year is matched (effectively doubles rewards)"
    },
    foreignTransactionFee: false,
    categories: ["student", "cashback", "rotating-categories", "build-credit"],
    description: "Student card with rotating 5% categories and first-year cashback match."
  }
];