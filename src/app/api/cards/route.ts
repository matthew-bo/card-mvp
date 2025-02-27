import { NextResponse } from 'next/server';
import { fetchAllCards, fetchCardById } from '@/services/cardApiService';
import { getCachedCards, setCachedCards, getCacheTimestamp } from '@/utils/server/cardCache';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';

export async function GET(request: Request) {
  try {
    // Check if an ID is provided in the URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // For single card requests
    if (id) {
      // For individual cards, we might want to always fetch fresh data
      // since these requests should be rare (only when viewing card details)
      const card = await fetchCardById(id);
      return NextResponse.json({ success: true, data: card });
    }
    
    // For all cards requests (the common case)
    // Check cache first unless forceRefresh is true
    if (!forceRefresh) {
      const cachedCards = getCachedCards();
      if (cachedCards) {
        // If we have cached data, return it
        return NextResponse.json({ 
          success: true, 
          data: cachedCards,
          cached: true,
          cacheTimestamp: getCacheTimestamp()
        });
      }
    }
    
    // If no cache or force refresh, fetch from API
    try {
      const cards = await fetchAllCards();
      // Save to cache
      setCachedCards(cards);
      
      return NextResponse.json({ 
        success: true, 
        data: cards,
        cached: false,
        cacheTimestamp: new Date()
      });
    } catch (apiError) {
      console.error('API fetch failed, using fallback data:', apiError);
      // If API fails, use fallback data
      return NextResponse.json({ 
        success: true, 
        data: fallbackCards,
        cached: false,
        fallback: true,
        error: 'API error, using fallback data'
      });
    }
  } catch (error) {
    console.error('Error in cards API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch card data' },
      { status: 500 }
    );
  }
}