// src/app/api/admin-access/route.ts
import { NextResponse } from 'next/server';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { creditCards } from '@/lib/cardDatabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Starting population with local fallback data');
    console.log(`Using ${creditCards.length} cards from fallback data`);
    
    // Use batched writes for better performance
    const BATCH_SIZE = 100; // Firestore has a limit of 500 operations per batch
    let addedCount = 0;
    
    for (let i = 0; i < creditCards.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const currentBatch = creditCards.slice(i, i + BATCH_SIZE);
      
      for (const card of currentBatch) {
        const cardRef = doc(collection(db, 'credit_cards'));
        batch.set(cardRef, {
          ...card,
          createdAt: new Date()
        });
        addedCount++;
      }
      
      await batch.commit();
      console.log(`Committed batch of ${currentBatch.length} cards to Firestore (${addedCount}/${creditCards.length} total)`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Added ${addedCount} cards to Firebase`,
      cardCount: addedCount
    });
  } catch (error) {
    console.error('Error in admin population:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`;
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to populate cards',
      errorDetails: errorMessage
    }, { status: 500 });
  }
}