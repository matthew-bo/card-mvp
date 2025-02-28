import { NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';
import { fetchAllCards } from '@/services/cardApiService';
import { CreditCardDetails } from '@/types/cards';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('API Request: /api/cards/all');
    
    // Try to get cards from Firestore
    const cardsRef = collection(db, 'credit_cards');
    const cardsSnapshot = await getDocs(cardsRef);
    
    // If we have cards in Firestore, return them
    if (!cardsSnapshot.empty) {
      console.log(`Retrieved ${cardsSnapshot.size} cards from Firestore`);
      
      const cards = cardsSnapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        } as CreditCardDetails;
      });
      
      return NextResponse.json({
        success: true,
        data: cards,
        cached: true,
        count: cards.length
      });
    }
    
    // If Firestore is empty, try to fetch from API
    console.log('No cards in Firestore, fetching from API');
    try {
      const apiCards = await fetchAllCards();
      console.log(`Fetched ${apiCards.length} cards from API`);
      
      // Store cards in Firestore for future use
      // Note: This should ideally be done in a batch or separate function
      // to avoid timeouts on the request
      
      return NextResponse.json({
        success: true,
        data: apiCards,
        cached: false,
        fromApi: true,
        count: apiCards.length
      });
    } catch (apiError) {
      console.error('API fetch failed, using fallback data:', apiError);
      return NextResponse.json({
        success: true,
        data: fallbackCards,
        fallback: true,
        error: 'API error, using fallback data',
        count: fallbackCards.length
      });
    }
  } catch (error) {
    console.error('Error loading card database:', error);
    
    // Return fallback data on error
    return NextResponse.json({
      success: true,
      data: fallbackCards,
      fallback: true,
      error: 'Error loading database, using fallback data',
      count: fallbackCards.length
    });
  }
}