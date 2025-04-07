import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SearchResultCard } from '@/types/cards';

// Set a long cache header (1 hour)
export const dynamic = 'force-dynamic';

// This endpoint returns a lightweight version of card data
// optimized for search, not the full card details
export async function GET() {
  try {
    // Fetch cards from Firestore
    const cardsRef = collection(db, 'credit_cards');
    const snapshot = await getDocs(cardsRef);
    
    if (snapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        data: [] 
      }, { 
        headers: {
          'Cache-Control': 'public, max-age=3600' // 1 hour cache
        }
      });
    }
    
    // Extract only the fields needed for search
    const searchCards: SearchResultCard[] = snapshot.docs.map(doc => ({
      cardKey: doc.id,
      cardName: doc.data().name || 'Unknown Card',
      cardIssuer: doc.data().issuer || 'Unknown Issuer'
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: searchCards 
    }, { 
      headers: {
        'Cache-Control': 'public, max-age=3600' // 1 hour cache
      }
    });
  } catch (error) {
    console.error('Error fetching search index:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load search index' 
    }, { 
      status: 500 
    });
  }
} 