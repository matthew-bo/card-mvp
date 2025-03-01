// src/app/api/admin-access/route.ts
import { NextResponse } from 'next/server';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchAllCards } from '@/services/cardApiService';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Starting direct admin card population');
    
    // Try fetching cards from API
    try {
      const cards = await fetchAllCards();
      console.log(`Fetched ${cards.length} cards from API`);
      
      // Add to Firebase
      let addedCount = 0;
      for (const card of cards) {
        try {
          await addDoc(collection(db, 'credit_cards'), {
            ...card,
            createdAt: new Date()
          });
          addedCount++;
        } catch (addError) {
          console.error('Error adding card to Firebase:', addError);
          // Continue with next card
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Added ${addedCount} cards to Firebase`,
        cardCount: addedCount
      });
    } catch (apiError) {
      console.error('API fetch failed, using fallback data:', apiError);
      
      // Use fallback data instead
      console.log('Falling back to sample data');
      
      let addedCount = 0;
      for (const card of fallbackCards) {
        try {
          await addDoc(collection(db, 'credit_cards'), {
            ...card,
            createdAt: new Date()
          });
          addedCount++;
        } catch (addError) {
          console.error('Error adding fallback card to Firebase:', addError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Added ${addedCount} fallback cards to Firebase`,
        cardCount: addedCount,
        source: 'fallback'
      });
    }
  } catch (error) {
    // Log the full error details
    console.error('Error in admin population:', error);
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`;
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to populate cards',
      errorDetails: errorMessage
    }, { status: 500 });
  }
}