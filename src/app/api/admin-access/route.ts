import { NextResponse } from 'next/server';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchAllCards } from '@/services/cardApiService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Starting direct admin card population');
    
    // Fetch cards from API
    const cards = await fetchAllCards();
    console.log(`Fetched ${cards.length} cards from API`);
    
    // Add to Firebase
    let addedCount = 0;
    for (const card of cards) {
      await addDoc(collection(db, 'credit_cards'), {
        ...card,
        createdAt: new Date()
      });
      addedCount++;
      
      // Log progress every 10 cards
      if (addedCount % 10 === 0) {
        console.log(`Added ${addedCount}/${cards.length} cards...`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Added ${addedCount} cards to Firebase`,
      cardCount: addedCount
    });
  } catch (error) {
    console.error('Error in admin population:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to populate cards'
    }, { status: 500 });
  }
}