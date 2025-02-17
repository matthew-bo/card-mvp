import { CreditCardDetails } from '@/types/cards';

export const creditCards: CreditCardDetails[] = [
  {
    id: "chase-sapphire-preferred",
    name: "Chase Sapphire Preferred",
    issuer: "Chase",
    rewards: {
      dining: 3,
      travel: 2.5,
      grocery: 1,
      gas: 1,
      other: 1
    },
    annualFee: 95,
    creditScoreRequired: "good",
    perks: [
      "Trip Cancellation/Interruption Insurance",
      "Primary Auto Rental Coverage",
      "No Foreign Transaction Fees",
      "1:1 Point Transfer to Travel Partners"
    ],
    signupBonus: {
      amount: 60000,
      type: "points",
      spendRequired: 4000,
      timeframe: 3
    },
    foreignTransactionFee: false,
    categories: ["travel", "dining", "points"],
    description: "Best mid-tier travel card with great transfer partners and travel protection benefits."
  },
  {
    id: "amex-gold",
    name: "American Express Gold Card",
    issuer: "American Express",
    rewards: {
      dining: 4,
      travel: 3,
      grocery: 4,
      gas: 1,
      other: 1
    },
    annualFee: 250,
    creditScoreRequired: "good",
    perks: [
      "$120 Dining Credit",
      "$120 Uber Cash",
      "No Foreign Transaction Fees",
      "Transfer Points to Travel Partners"
    ],
    signupBonus: {
      amount: 60000,
      type: "points",
      spendRequired: 4000,
      timeframe: 3
    },
    foreignTransactionFee: false,
    categories: ["dining", "grocery", "points", "travel"],
    description: "Excellent for foodies and grocery shoppers with strong dining and grocery rewards."
  },
  {
    id: "citi-double-cash",
    name: "Citi Double Cash",
    issuer: "Citi",
    rewards: {
      dining: 2,
      travel: 2,
      grocery: 2,
      gas: 2,
      other: 2
    },
    annualFee: 0,
    creditScoreRequired: "good",
    perks: [
      "0% Intro APR on Balance Transfers",
      "Simple Rewards Structure"
    ],
    foreignTransactionFee: true,
    categories: ["cashback", "no-annual-fee"],
    description: "Simple but effective 2% cashback on everything - 1% when you buy, 1% when you pay."
  },
  {
    id: "capital-one-venture",
    name: "Capital One Venture",
    issuer: "Capital One",
    rewards: {
      dining: 2,
      travel: 5,
      grocery: 2,
      gas: 2,
      other: 2
    },
    annualFee: 95,
    creditScoreRequired: "good",
    perks: [
      "Global Entry/TSA PreCheck Credit",
      "No Foreign Transaction Fees",
      "Transfer Miles to Travel Partners"
    ],
    signupBonus: {
      amount: 75000,
      type: "points",
      spendRequired: 4000,
      timeframe: 3
    },
    foreignTransactionFee: false,
    categories: ["travel", "points"],
    description: "Flexible travel rewards card with straightforward earning structure."
  },
  {
    id: "discover-it",
    name: "Discover it Cash Back",
    issuer: "Discover",
    rewards: {
      dining: 1,
      travel: 1,
      grocery: 1,
      gas: 1,
      other: 1
    },
    annualFee: 0,
    creditScoreRequired: "fair",
    perks: [
      "Cashback Match for First Year",
      "5% Rotating Quarterly Categories",
      "No Foreign Transaction Fees"
    ],
    foreignTransactionFee: false,
    categories: ["cashback", "rotating-categories", "build-credit"],
    description: "Great starter card with rotating 5% categories and first-year cashback match."
  },
  {
    id: "chase-freedom-unlimited",
    name: "Chase Freedom Unlimited",
    issuer: "Chase",
    rewards: {
      dining: 3,
      travel: 5,
      grocery: 1.5,
      gas: 1.5,
      other: 1.5
    },
    annualFee: 0,
    creditScoreRequired: "good",
    perks: [
      "No Annual Fee",
      "0% Intro APR Period",
      "Purchase Protection"
    ],
    signupBonus: {
      amount: 200,
      type: "cashback",
      spendRequired: 500,
      timeframe: 3
    },
    foreignTransactionFee: true,
    categories: ["cashback", "no-annual-fee"],
    description: "Solid no-annual-fee card with great everyday earning rates."
  },
  {
    id: "amex-platinum",
    name: "American Express Platinum",
    issuer: "American Express",
    rewards: {
      dining: 1,
      travel: 5,
      grocery: 1,
      gas: 1,
      other: 1
    },
    annualFee: 695,
    creditScoreRequired: "excellent",
    perks: [
      "$200 Airline Fee Credit",
      "$200 Hotel Credit",
      "$200 Uber Cash",
      "Airport Lounge Access",
      "Global Entry/TSA PreCheck Credit",
      "Platinum Concierge"
    ],
    signupBonus: {
      amount: 80000,
      type: "points",
      spendRequired: 6000,
      timeframe: 6
    },
    foreignTransactionFee: false,
    categories: ["travel", "premium", "points", "lounge-access"],
    description: "Premium travel card with extensive benefits and airport lounge access."
  },
  {
    id: "chase-sapphire-reserve",
    name: "Chase Sapphire Reserve",
    issuer: "Chase",
    rewards: {
      dining: 3,
      travel: 3,
      grocery: 1,
      gas: 1,
      other: 1
    },
    annualFee: 550,
    creditScoreRequired: "excellent",
    perks: [
      "$300 Travel Credit",
      "Priority Pass Lounge Access",
      "Global Entry/TSA PreCheck Credit",
      "Primary Rental Car Insurance",
      "Trip Delay Insurance"
    ],
    signupBonus: {
      amount: 60000,
      type: "points",
      spendRequired: 4000,
      timeframe: 3
    },
    foreignTransactionFee: false,
    categories: ["travel", "premium", "points", "lounge-access"],
    description: "Premium travel card with strong travel credits and superior travel protection."
  },
  {
    id: "capital-one-quicksilver",
    name: "Capital One Quicksilver",
    issuer: "Capital One",
    rewards: {
      dining: 1.5,
      travel: 1.5,
      grocery: 1.5,
      gas: 1.5,
      other: 1.5
    },
    annualFee: 0,
    creditScoreRequired: "good",
    perks: [
      "No Annual Fee",
      "Simple Rewards Structure",
      "0% Intro APR Period"
    ],
    signupBonus: {
      amount: 200,
      type: "cashback",
      spendRequired: 500,
      timeframe: 3
    },
    foreignTransactionFee: false,
    categories: ["cashback", "no-annual-fee"],
    description: "Simple flat-rate cashback card with no annual fee."
  },
  {
    id: "capital-one-secured",
    name: "Capital One Secured Mastercard",
    issuer: "Capital One",
    rewards: {
      dining: 0,
      travel: 0,
      grocery: 0,
      gas: 0,
      other: 0
    },
    annualFee: 0,
    creditScoreRequired: "poor",
    perks: [
      "No Annual Fee",
      "Path to Credit Building",
      "Automatic Credit Line Review"
    ],
    foreignTransactionFee: false,
    categories: ["secured", "build-credit", "no-annual-fee"],
    description: "Excellent secured card for building credit with no annual fee."
  },
  {
    id: "discover-secured",
    name: "Discover it Secured",
    issuer: "Discover",
    rewards: {
      dining: 2,
      travel: 1,
      grocery: 2,
      gas: 2,
      other: 1
    },
    annualFee: 0,
    creditScoreRequired: "poor",
    perks: [
      "No Annual Fee",
      "Cashback Match First Year",
      "Free FICO Score",
      "Path to Unsecured Card"
    ],
    foreignTransactionFee: false,
    categories: ["secured", "build-credit", "cashback", "no-annual-fee"],
    description: "Best secured card with cashback rewards and no annual fee."
  }
];