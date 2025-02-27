import { NextResponse } from 'next/server';
import { getCacheTimestamp } from '@/utils/server/cardCache';

export async function GET() {
  try {
    const timestamp = getCacheTimestamp();
    
    return NextResponse.json({
      success: true,
      timestamp: timestamp ? timestamp.toISOString() : null,
      exists: !!timestamp
    });
  } catch (error) {
    console.error('Error fetching cache info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cache information' },
      { status: 500 }
    );
  }
}