import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
      const url = new URL(request.url);
      const searchTerm = url.searchParams.get('q');
      
      console.log(`API Request: /api/cards/search?q=${searchTerm}`);
      
      if (!searchTerm || searchTerm.length < 3) {
        return NextResponse.json(
          { success: false, error: 'Search term must be at least 3 characters' },
          { status: 400 }
        );
      }
      
      // Query Firestore
      const cardsRef = collection(db, 'credit_cards');
      const snapshot = await getDocs(cardsRef);
      
      console.log(`Searching ${snapshot.size} cards for term: ${searchTerm}`);
      
      // Manual filtering since Firestore doesn't support complex text search
      const results = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          const name = data.name || '';
          const issuer = data.issuer || '';
          
          return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 issuer.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .map(doc => {
          const data = doc.data();
          return {
            cardKey: data.id, // Use data.id instead of doc.id
            cardName: data.name || '',
            cardIssuer: data.issuer || ''
          };
        });
      
      console.log(`Found ${results.length} matches for "${searchTerm}"`);
      
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