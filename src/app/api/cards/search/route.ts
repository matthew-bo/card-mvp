import { NextResponse } from 'next/server';
import { searchCardsByName } from '@/services/cardApiService';

export const dynamic = 'force-dynamic';

// Cache search results for 1 day (very unlikely for card names to change)
const CACHE = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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
    
    // Check cache
    const cacheKey = `search_${searchTerm.toLowerCase()}`;
    const cachedData = CACHE.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        cached: true
      });
    }
    
    // Fetch from API
    const cards = await searchCardsByName(searchTerm);
    
    // Update cache
    CACHE.set(cacheKey, {
      timestamp: Date.now(),
      data: cards
    });
    
    return NextResponse.json({
      success: true,
      data: cards,
      cached: false
    });
  } catch (error) {
    console.error('Error in card search API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search cards' },
      { status: 500 }
    );
  }
}