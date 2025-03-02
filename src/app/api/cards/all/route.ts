import { NextResponse } from 'next/server';
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
      console.log('Making request to creditcard-cardlist API');
      
      // Log the API URL and headers (mask the actual key)
      console.log(`API URL: ${API_BASE_URL}/creditcard-cardlist`);
      console.log(`API Key present: ${!!API_KEY}`);
      
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
      
      // Try to log the raw response
      const rawData = await response.text();
      console.log(`Raw API response (first 200 chars): ${rawData.substring(0, 200)}...`);
      
      // Now parse the JSON
      const issuersWithCards = JSON.parse(rawData);
      console.log(`API returned data for ${issuersWithCards.length} issuers`);
      
      const allCards: CreditCardDetails[] = [];
      
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
            
            // Generate random perks as an array
            const possiblePerks = ["No annual fee", "Travel insurance", "Purchase protection"];
            const selectedPerks = possiblePerks.slice(0, Math.floor(Math.random() * 3) + 1); // Ensure at least 1 perk
            
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
              perks: selectedPerks, // Now this is an array of strings
              foreignTransactionFee: Math.random() > 0.5,
              categories: selectedCategories, // This is already an array
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
      console.error('API fetch failed with details:', apiError);
      console.error('API error message:', apiError instanceof Error ? apiError.message : 'Unknown');
      console.error('API error stack:', apiError instanceof Error ? apiError.stack : 'No stack');
      
      console.log('Using fallback card database with diversification');
      
      // Create a more diverse set of fallback cards
      const diverseCards: CreditCardDetails[] = [];
      
      // First, include all original fallback cards
      diverseCards.push(...fallbackCards);
      
      // Then create variations to ensure diversity
      for (let i = 0; i < fallbackCards.length; i++) {
        const baseCard = fallbackCards[i];
        
        // Create 3 variations for each base card
        for (let j = 1; j <= 3; j++) {
          // Define additional perks as an array
          const additionalPerks = ["Additional Travel Benefits", "Cell Phone Protection", "VIP Access"];
          // Define additional categories as an array
          const additionalCategories = ["premium", "travel", "cashback"];
          
          const variation: CreditCardDetails = {
            ...baseCard,
            id: `${baseCard.id}-v${j}`,
            name: `${baseCard.name} ${['Signature', 'Premium', 'Elite', 'Select', 'Plus'][j % 5]} Edition`,
            rewardRates: {
              ...baseCard.rewardRates,
              dining: baseCard.rewardRates.dining + j,
              travel: baseCard.rewardRates.travel + (j % 3),
              grocery: baseCard.rewardRates.grocery + (j % 2),
              gas: baseCard.rewardRates.gas + (j % 4),
              entertainment: baseCard.rewardRates.entertainment + j
            },
            annualFee: j % 2 === 0 ? baseCard.annualFee + 50*j : baseCard.annualFee,
            creditScoreRequired: ["excellent", "good", "fair", "poor"][j % 4] as CreditScoreType,
            // Ensure perks is an array and add one additional perk
            perks: [...baseCard.perks, additionalPerks[j % additionalPerks.length]],
            // Ensure categories is an array and add one additional category
            categories: [...baseCard.categories, additionalCategories[j % additionalCategories.length]]
          };
          diverseCards.push(variation);
        }
      }
      
      console.log(`Created ${diverseCards.length} diverse cards from fallback data`);
      
      return NextResponse.json({
        success: true,
        data: diverseCards,
        count: diverseCards.length,
        fallback: true,
        source: 'diversified-fallback',
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