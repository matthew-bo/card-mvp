import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';

export const dynamic = 'force-dynamic';

// Path to our card database file
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'card-database.json');

export async function GET() {
  try {
    // Check if the database file exists
    if (!fs.existsSync(DB_FILE_PATH)) {
      // Return fallback data if file doesn't exist
      return NextResponse.json({
        success: true,
        data: fallbackCards,
        fallback: true
      });
    }
    
    // Read and parse the database file
    const dbJson = fs.readFileSync(DB_FILE_PATH, 'utf8');
    const dbData = JSON.parse(dbJson);
    
    // Check if the data is recent enough (within 14 days)
    const now = Date.now();
    const dataAge = now - dbData.timestamp;
    const isFresh = dataAge < 14 * 24 * 60 * 60 * 1000; // 14 days
    
    return NextResponse.json({
      success: true,
      data: dbData.cards,
      cached: true,
      dataAge: Math.round(dataAge / (24 * 60 * 60 * 1000)), // in days
      fresh: isFresh
    });
  } catch (error) {
    console.error('Error loading card database:', error);
    
    // Return fallback data on error
    return NextResponse.json({
      success: true,
      data: fallbackCards,
      fallback: true,
      error: 'Error loading database, using fallback data'
    });
  }
}