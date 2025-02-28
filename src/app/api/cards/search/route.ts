// src/app/api/cards/search/route.ts
import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('q');
    
    if (!searchTerm || searchTerm.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Search term must be at least 3 characters' },
        { status: 400 }
      );
    }
    
    // Query Firestore for cards matching the search term
    const cardsRef = collection(db, 'credit_cards');
    
    // This is a simple search - you may need to implement more sophisticated searching
    // based on your data structure and Firebase plan
    const q = query(
      cardsRef,
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    
    const results = snapshot.docs.map(doc => ({
      cardKey: doc.id,
      cardName: doc.data().name,
      cardIssuer: doc.data().issuer
    }));
    
    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in card search API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search cards' },
      { status: 500 }
    );
  }
}