import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db, FIREBASE_COLLECTIONS } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    // Get the card key from the query parameters
    const { searchParams } = new URL(request.url);
    const cardKey = searchParams.get('cardKey');
    
    if (!cardKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'Card key is required' 
      }, { status: 400 });
    }
    
    // Use the correct collection name from constants
    const cardRef = doc(db, FIREBASE_COLLECTIONS.CREDIT_CARDS, cardKey);
    console.log(`Attempting to fetch card with ID ${cardKey} from ${FIREBASE_COLLECTIONS.CREDIT_CARDS} collection`);
    
    const cardSnapshot = await getDoc(cardRef);
    
    if (!cardSnapshot.exists()) {
      console.warn(`Card with ID ${cardKey} not found in Firestore`);
      return NextResponse.json({ 
        success: false, 
        message: 'Card not found' 
      }, { status: 404 });
    }
    
    // Get the card data
    const cardData = {
      id: cardSnapshot.id,
      ...cardSnapshot.data()
    };
    
    console.log(`Successfully fetched card: ${cardKey}`);
    
    return NextResponse.json({ 
      success: true, 
      data: cardData 
    }, { 
      status: 200,
      headers: {
        // Add cache headers to enable browser caching
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'CDN-Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Vercel-CDN-Cache-Control': 'public, max-age=86400, s-maxage=86400',
      }
    });
  } catch (error) {
    console.error('Error fetching card details:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch card details',
      error: (error as Error).message
    }, { status: 500 });
  }
}

// Add batch endpoint to fetch multiple cards at once for preloading
export async function POST(request: NextRequest) {
  try {
    // Get the card keys from the request body
    const body = await request.json();
    const { cardKeys } = body;
    
    if (!cardKeys || !Array.isArray(cardKeys) || cardKeys.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Card keys array is required' 
      }, { status: 400 });
    }
    
    // Limit the number of cards to fetch at once
    const limitedCardKeys = cardKeys.slice(0, 20);
    
    console.log(`Batch fetching ${limitedCardKeys.length} cards from ${FIREBASE_COLLECTIONS.CREDIT_CARDS} collection`);
    
    // Fetch all cards in parallel
    const cardPromises = limitedCardKeys.map(async (cardKey) => {
      const cardRef = doc(db, FIREBASE_COLLECTIONS.CREDIT_CARDS, cardKey);
      const cardSnapshot = await getDoc(cardRef);
      
      if (!cardSnapshot.exists()) {
        console.warn(`Batch card ${cardKey} not found`);
        return null;
      }
      
      return {
        id: cardSnapshot.id,
        ...cardSnapshot.data()
      };
    });
    
    // Wait for all card fetches to complete
    const cards = await Promise.all(cardPromises);
    
    // Filter out null values and create a map of card id to card data
    const cardMap = cards
      .filter(card => card !== null)
      .reduce((acc, card) => {
        if (card) {
          acc[card.id] = card;
        }
        return acc;
      }, {} as Record<string, unknown>);
    
    console.log(`Successfully batch fetched ${Object.keys(cardMap).length} cards`);
    
    return NextResponse.json({ 
      success: true, 
      data: cardMap 
    }, { 
      status: 200,
      headers: {
        // Add cache headers to enable browser caching
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'CDN-Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Vercel-CDN-Cache-Control': 'public, max-age=86400, s-maxage=86400',
      }
    });
  } catch (error) {
    console.error('Error fetching batch card details:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch batch card details',
      error: (error as Error).message
    }, { status: 500 });
  }
}