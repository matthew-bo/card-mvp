export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { clearCardCache, setCachedCards } from '@/utils/server/cardCache';
import { fetchAllCards } from '@/services/cardApiService';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';
import { SimpleMonitor } from '@/utils/monitoring/simpleMonitor';

export async function POST() {
  try {
    // Clear existing cache
    clearCardCache();
    
    // Fetch new data
    try {
      const cards = await fetchAllCards();
      // Save to cache
      setCachedCards(cards);
      
      SimpleMonitor.logEvent(
        'card_cache_refreshed',
        `Card database refreshed from API with ${cards.length} cards`,
        { source: 'admin', cardCount: cards.length }
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Card database refreshed successfully',
        cardCount: cards.length,
        source: 'api'
      });
    } catch (apiError) {
      console.error('API fetch failed during refresh:', apiError);
      SimpleMonitor.trackError(apiError as Error);
      
      // If API fails, use fallback data
      setCachedCards(fallbackCards);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Card database refresh failed, used fallback data',
        cardCount: fallbackCards.length,
        source: 'fallback',
        error: 'API error, using fallback data'
      });
    }
  } catch (error) {
    console.error('Error refreshing card cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh card database' },
      { status: 500 }
    );
  }
}