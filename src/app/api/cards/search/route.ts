import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('q');
    
    console.log(`Card search request for term: "${searchTerm}"`);
    
    if (!searchTerm || searchTerm.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Search term must be at least 3 characters' },
        { status: 400 }
      );
    }
    
    // Fetch all cards from Firebase
    const cardsRef = collection(db, 'credit_cards');
    const snapshot = await getDocs(cardsRef);
    
    console.log(`Searching through ${snapshot.size} cards for: "${searchTerm}"`);
    
    // Perform a case-insensitive search
    const matches = snapshot.docs.filter(doc => {
      const data = doc.data();
      const name = data.name || '';
      const issuer = data.issuer || '';
      const searchLower = searchTerm.toLowerCase();
      
      return name.toLowerCase().includes(searchLower) || 
             issuer.toLowerCase().includes(searchLower);
    });
    
    console.log(`Found ${matches.length} matching cards`);
    
    // Map to the structure expected by CardSearch component
    const results = matches.map(doc => {
      const data = doc.data();
      // Log the exact structure to help debugging
      if (matches.length > 0 && doc === matches[0]) {
        console.log('Sample match data:', data);
      }
      
      return {
        cardKey: data.id,  // IMPORTANT: Using data.id field, not doc.id
        cardName: data.name || '',
        cardIssuer: data.issuer || ''
      };
    });
    
    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in card search:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search cards' },
      { status: 500 }
    );
  }
}