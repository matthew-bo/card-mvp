import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('q');
    
    console.log(`Search request for: "${searchTerm}"`);
    
    if (!searchTerm || searchTerm.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Search term must be at least 3 characters' },
        { status: 400 }
      );
    }
    
    // Get all cards from Firebase
    const cardsRef = collection(db, 'credit_cards');
    const snapshot = await getDocs(cardsRef);
    
    console.log(`Searching ${snapshot.size} cards`);
    
    // Find matches
    const matches = snapshot.docs.filter(doc => {
      const data = doc.data();
      const name = data.name || '';
      const issuer = data.issuer || '';
      const searchLower = searchTerm.toLowerCase();
      
      return name.toLowerCase().includes(searchLower) || 
             issuer.toLowerCase().includes(searchLower);
    });
    
    console.log(`Found ${matches.length} matches`);
    
    // Transform to expected format for CardSearch component
    const results = matches.map(doc => {
      const data = doc.data();
      
      // Important: Map the id field to cardKey
      return {
        cardKey: data.id, // This is the critical mapping
        cardName: data.name || '',
        cardIssuer: data.issuer || ''
      };
    });
    
    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search cards' },
      { status: 500 }
    );
  }
}