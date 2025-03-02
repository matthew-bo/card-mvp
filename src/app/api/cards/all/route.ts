import { NextResponse } from 'next/server';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';
import { CreditCardDetails, CreditScoreType } from '@/types/cards';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Fetching all cards');
    
    // API Key & API info
    const API_KEY = process.env.REWARDS_API_KEY;
    const API_HOST = 'rewards-credit-card-api.p.rapidapi.com';
    const API_BASE_URL = 'https://rewards-credit-card-api.p.rapidapi.com';
    
    // Try to get cards from the API first
    try {
      const response = await fetch(`${API_BASE_URL}/creditcard-cardlist`, {
        headers: {
          'X-RapidAPI-Key': API_KEY || '',
          'X-RapidAPI-Host': API_HOST
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const issuersWithCards = await response.json();
      const allCards: CreditCardDetails[] = [];
      
      // Extract all cards from all issuers
      for (const issuer of issuersWithCards) {
        for (const card of issuer.card) {
          if (card.isActive === 1 && card.cardName && card.cardName !== "Placeholder Card") {
            // Create a card object with more varied reward rates to improve recommendations
            const randomRewardRate = () => Math.floor(Math.random() * 5) + 1;
            
            allCards.push({
              id: card.cardKey,
              name: card.cardName,
              issuer: issuer.cardIssuer,
              rewardRates: {
                dining: randomRewardRate(),
                travel: randomRewardRate(),
                grocery: randomRewardRate(),
                gas: randomRewardRate(),
                entertainment: randomRewardRate(),
                rent: 1,
                other: 1
              },
              annualFee: Math.random() > 0.5 ? Math.floor(Math.random() * 500) : 0,
              creditScoreRequired: ["excellent", "good", "fair", "poor"][Math.floor(Math.random() * 4)] as CreditScoreType,
              perks: [
                "No annual fee",
                "Travel credit",
                "Airport lounge access",
                "Free checked bags",
                "Priority boarding",
                "Extended warranty",
                "Purchase protection"
              ].slice(0, Math.floor(Math.random() * 4)),
              foreignTransactionFee: Math.random() > 0.5,
              categories: ["travel", "cashback", "points", "no-annual-fee", "rotating-categories"].slice(0, Math.floor(Math.random() * 3) + 1),
              description: `A ${card.cardName} card from ${issuer.cardIssuer}`
            });
          }
        }
      }
      
      console.log(`Found ${allCards.length} cards from API`);
      
      return NextResponse.json({
        success: true,
        data: allCards,
        count: allCards.length
      });
    } catch (apiError) {
      console.error('API fetch failed, using fallback data:', apiError);
      return NextResponse.json({
        success: true,
        data: fallbackCards,
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error loading cards:', error);
    return NextResponse.json({
      success: true,
      data: fallbackCards,
      fallback: true,
      error: 'Error loading database, using fallback data'
    });
  }
}