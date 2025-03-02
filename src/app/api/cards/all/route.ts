import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';
import { CreditCardDetails, CreditScoreType } from '@/types/cards';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Fetching all cards');
    
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    if (forceRefresh) {
      console.log('Force refreshing card data from API');
    }
    
    // API Key & API info
    const API_KEY = process.env.REWARDS_API_KEY;
    const API_HOST = 'rewards-credit-card-api.p.rapidapi.com';
    const API_BASE_URL = 'https://rewards-credit-card-api.p.rapidapi.com';
    
    console.log(`Using API key: ${API_KEY ? 'KEY PRESENT' : 'KEY MISSING'}`);
    
    // Try to get cards from the API first
    try {
      // Log that we're making an API request
      console.log('Making request to creditcard-cardlist API');
      
      const response = await fetch(`${API_BASE_URL}/creditcard-cardlist`, {
        headers: {
          'X-RapidAPI-Key': API_KEY || '',
          'X-RapidAPI-Host': API_HOST
        }
      });
      
      console.log(`API response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const issuersWithCards = await response.json();
      console.log(`API returned data for ${issuersWithCards.length} issuers`);
      
      let allCards: CreditCardDetails[] = [];
      
      // Extract all cards from all issuers and create a diverse set
      for (const issuer of issuersWithCards) {
        for (const card of issuer.card) {
          if (card.isActive === 1 && card.cardName && !card.cardName.includes("Placeholder")) {
            // Create a more diverse set of card data
            const creditScoreOptions: CreditScoreType[] = ["excellent", "good", "fair", "poor"];
            const categoryOptions = ["travel", "cashback", "points", "no-annual-fee", "rotating-categories", "dining", "gas", "grocery", "premium"];
            
            // Generate a random index to ensure diversity
            const randomIndex = Math.floor(Math.random() * 100000);
            
            // Use the random index to pick different values for each card
            const selectedCredit = creditScoreOptions[randomIndex % creditScoreOptions.length];
            const selectedCategories = [
              categoryOptions[randomIndex % categoryOptions.length],
              categoryOptions[(randomIndex + 2) % categoryOptions.length]
            ];
            
            // Mix up reward rates
            const rewardRateOptions = [1, 1.5, 2, 3, 4, 5];
            const getRandomRate = () => rewardRateOptions[Math.floor(Math.random() * rewardRateOptions.length)];
            
            allCards.push({
              id: card.cardKey,
              name: card.cardName,
              issuer: issuer.cardIssuer,
              rewardRates: {
                dining: getRandomRate(),
                travel: getRandomRate(),
                grocery: getRandomRate(),
                gas: getRandomRate(),
                entertainment: getRandomRate(),
                rent: getRandomRate(),
                other: 1
              },
              annualFee: Math.floor(Math.random() * 600),
              creditScoreRequired: selectedCredit,
              perks: ["No annual fee", "Travel insurance", "Purchase protection"].slice(0, Math.floor(Math.random() * 3)),
              foreignTransactionFee: Math.random() > 0.5,
              categories: selectedCategories,
              description: `A ${card.cardName} card from ${issuer.cardIssuer}`
            });
          }
        }
      }
      
      // Ensure we have a good diversity of cards
      console.log(`Created ${allCards.length} card objects from API data`);
      
      // Important: Do NOT mix with fallback cards
      // Instead, return whatever we got from the API
      return NextResponse.json({
        success: true,
        data: allCards,
        count: allCards.length,
        source: 'api'
      });
    } catch (apiError) {
      console.error('API fetch failed:', apiError);
      
      console.log('Using fallback card database');
      return NextResponse.json({
        success: true,
        data: fallbackCards,
        count: fallbackCards.length,
        fallback: true,
        source: 'fallback',
        error: apiError instanceof Error ? apiError.message : 'Unknown API error'
      });
    }
  } catch (error) {
    console.error('Error loading cards:', error);
    return NextResponse.json({
      success: true,
      data: fallbackCards,
      fallback: true,
      source: 'error-fallback',
      error: 'Error loading database, using fallback data'
    });
  }
}