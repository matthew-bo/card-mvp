import { NextResponse } from 'next/server';
import { getCardDetails } from '@/services/cardApiService';

export const dynamic = 'force-dynamic';

// Cache card details for 1 week (they rarely change)
const CACHE = new Map();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cardKey = url.searchParams.get('cardKey');
    
    if (!cardKey) {
      return NextResponse.json(
        { success: false, error: 'Card key is required' },
        { status: 400 }
      );
    }
    
    // Check cache
    const cacheKey = `details_${cardKey}`;
    const cachedData = CACHE.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        cached: true
      });
    }
    
    // Fetch from API
    const cardDetails = await getCardDetails(cardKey);
    
    // Update cache
    CACHE.set(cacheKey, {
      timestamp: Date.now(),
      data: cardDetails
    });
    
    return NextResponse.json({
      success: true,
      data: cardDetails,
      cached: false
    });
  } catch (error) {
    console.error('Error in card details API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch card details' },
      { status: 500 }
    );
  }
}