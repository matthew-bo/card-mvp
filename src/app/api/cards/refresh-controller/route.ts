export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  try {
    const allCards = [];
    let batchIndex = 0;
    let isComplete = false;
    
    while (!isComplete && batchIndex < 20) { // Safety limit of 20 batches
      const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron/refresh-cards?batch=${batchIndex}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Batch ${batchIndex} failed: ${response.status}`);
      }
      
      const data = await response.json();
      isComplete = data.isComplete;
      batchIndex++;
      
      // Wait a bit between batches to avoid rate limits
      if (!isComplete) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Card database refresh completed',
      batchesProcessed: batchIndex
    });
  } catch (error) {
    console.error('Error in refresh controller:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete card database refresh' },
      { status: 500 }
    );
  }
}