import { NextResponse } from 'next/server';
import { clearCardCache, setCachedCards, getCachedCards, getCacheTimestamp } from '@/utils/server/cardCache';
import { fetchAllCards } from '@/services/cardApiService';
import { SimpleMonitor } from '@/utils/monitoring/simpleMonitor';

// This ensures the route is recognized as a scheduled job by Vercel
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for longer running operations

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the cache needs refreshing (older than 24 hours)
    const cachedCards = getCachedCards();
    const cacheTimestamp = getCacheTimestamp();
    
    if (cachedCards && cacheTimestamp) {
      // Cache exists, check if it's recent (less than 12 hours old)
      const cacheAge = Date.now() - cacheTimestamp.getTime();
      if (cacheAge < 12 * 60 * 60 * 1000) { // 12 hours
        return NextResponse.json({ 
          success: true, 
          message: 'Cache is still fresh, skipping refresh',
          cacheAge: `${Math.round(cacheAge / (60 * 60 * 1000))} hours` 
        });
      }
    }
    
    // Clear existing cache
    clearCardCache();
    
    // Fetch new data
    const cards = await fetchAllCards();
    
    // Save to cache
    setCachedCards(cards);
    
    SimpleMonitor.logEvent(
      'scheduled_refresh',
      `Scheduled card database refresh completed with ${cards.length} cards`,
      { source: 'cron', cardCount: cards.length }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Card database refreshed via scheduled job',
      cardCount: cards.length
    });
  } catch (error) {
    console.error('Error in scheduled card refresh:', error);
    SimpleMonitor.trackError(error as Error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to refresh card database' },
      { status: 500 }
    );
  }
}