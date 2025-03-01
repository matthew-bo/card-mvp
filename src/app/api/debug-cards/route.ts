import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Debugging card API');
    
    // Fetch all cards from Firebase
    const cardsRef = collection(db, 'credit_cards');
    const snapshot = await getDocs(cardsRef);
    
    // Get sample of the data
    const sampleCards = snapshot.docs.slice(0, 3).map(doc => {
      const data = doc.data();
      return {
        documentId: doc.id,
        fields: data
      };
    });
    
    return NextResponse.json({
      success: true,
      totalCards: snapshot.size,
      sampleCards: sampleCards
    });
  } catch (error) {
    console.error('Error debugging cards:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}