import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';

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
      const allCards = [];
      
      // Extract all cards from all issuers
      for (const issuer of issuersWithCards) {
        for (const card of issuer.card) {
          if (card.isActive === 1) {
            // Create a simplified card object
            allCards.push({
              id: card.cardKey,
              name: card.cardName,
              issuer: issuer.cardIssuer,
              rewardRates: {
                dining: 1,
                travel: 1,
                grocery: 1,
                gas: 1,
                entertainment: 1,
                rent: 1,
                other: 1
              },
              annualFee: 0, // Default, would need details API for actual value
              creditScoreRequired: "good",
              perks: [],
              foreignTransactionFee: false,
              categories: ["other"],
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
      console.error('API fetch failed, trying Firebase fallback:', apiError);
      
      // Get cards from Firebase if API fails
      const cardsRef = collection(db, 'credit_cards');
      const snapshot = await getDocs(cardsRef);
      
      console.log(`Found ${snapshot.size} cards in Firebase`);
      
      if (snapshot.empty) {
        console.log('No cards found in Firebase, using fallback data');
        return NextResponse.json({
          success: true,
          data: fallbackCards,
          fallback: true
        });
      }
      
      // Transform to expected format for app
      const cards = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Return data with id field as the card ID
        return {
          id: data.id,  // Keep the id field from the document
          name: data.name || '',
          issuer: data.issuer || '',
          rewardRates: data.rewardRates || {},
          annualFee: data.annualFee || 0,
          creditScoreRequired: data.creditScoreRequired || 'good',
          perks: data.perks || [],
          foreignTransactionFee: data.foreignTransactionFee === false ? false : true,
          categories: data.categories || [],
          description: data.description || '',
          signupBonus: data.signupBonus || null
        };
      });
      
      return NextResponse.json({
        success: true,
        data: cards,
        count: cards.length
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