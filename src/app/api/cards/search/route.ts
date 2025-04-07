import { NextResponse } from 'next/server';
import cardDataService from '@/services/cardDataService';

// Define an interface for the card data structure
interface CardSearchResult {
  cardKey: string;
  cardName: string;
  cardIssuer: string;
}

export const dynamic = 'force-dynamic';

// Set a reasonable timeout for search operations
const SEARCH_TIMEOUT = 15000; // 15 seconds

// Helper function to implement a timeout
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    promise.then(
      (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('q');
    
    console.log(`Search request for: "${searchTerm}"`);
    
    if (!searchTerm || searchTerm.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Search term must be at least 3 characters' },
        { status: 400 }
      );
    }
    
    // Use the timeout wrapper for search operation
    const result = await withTimeout(
      cardDataService.searchCards(searchTerm),
      SEARCH_TIMEOUT
    );
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Search failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to search cards';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}