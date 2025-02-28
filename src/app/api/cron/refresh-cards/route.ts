import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CreditCardDetails } from '@/types/cards';
import { mapApiCardToAppFormat } from '@/services/cardApiService';
import { SimpleMonitor } from '@/utils/monitoring/simpleMonitor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum allowed on hobby plan (60 seconds)

interface ApiCardBasic {
  cardKey: string;
  cardName: string;
  cardIssuer: string;
  isActive?: number;
}

// Path to our card database file
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'card-database.json');

export async function GET(request: Request) {
  try {
    // Verify the request is authorized
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Set up API credentials
    const API_KEY = process.env.REWARDS_API_KEY || '';
    const API_HOST = 'rewards-credit-card-api.p.rapidapi.com';
    const API_BASE_URL = 'https://rewards-credit-card-api.p.rapidapi.com';
    
    // Create headers for API requests
    const apiHeaders = {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': API_HOST
    };
    
    // Fetch issuers with cards from the API
    const response = await fetch(`${API_BASE_URL}/creditcard-cardlist`, {
      headers: apiHeaders
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const issuersWithCards = await response.json();
    
    // Process 50 cards at a time to avoid overwhelming the API
    const allCards: CreditCardDetails[] = [];
    const allCardBasics: ApiCardBasic[] = [];
    
    // Collect all cards first
    for (const issuer of issuersWithCards) {
      for (const card of issuer.card) {
        if (card.isActive === 1) {
          allCardBasics.push({
            cardKey: card.cardKey,
            cardName: card.cardName,
            cardIssuer: issuer.cardIssuer
          });
        }
      }
    }
    
    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < allCardBasics.length; i += batchSize) {
      const batch = allCardBasics.slice(i, i + batchSize);
      
      // Process batch in parallel
      const cardPromises = batch.map(async (cardBasic) => {
        try {
          const cardDetailsResponse = await fetch(`${API_BASE_URL}/creditcard-detail-bycard/${cardBasic.cardKey}`, {
            headers: apiHeaders
          });
          
          if (cardDetailsResponse.ok) {
            const details = await cardDetailsResponse.json();
            if (details && details.length > 0) {
              return mapApiCardToAppFormat(details[0]);
            }
          }
          return null;
        } catch (error) {
          console.error(`Error fetching details for ${cardBasic.cardName}:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(cardPromises);
      allCards.push(...batchResults.filter(Boolean) as CreditCardDetails[]);
      
      // Add a small delay between batches to avoid rate limits
      if (i + batchSize < allCardBasics.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Save to file
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify({
      timestamp: Date.now(),
      cards: allCards
    }, null, 2));
    
    SimpleMonitor.logEvent(
      'card_database_refresh',
      `Refreshed card database with ${allCards.length} cards`,
      { source: 'cron', cardCount: allCards.length }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Card database refreshed successfully',
      cardCount: allCards.length
    });
  } catch (error) {
    console.error('Error refreshing card database:', error);
    SimpleMonitor.trackError(error as Error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to refresh card database' },
      { status: 500 }
    );
  }
}