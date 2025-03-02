import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
    
    // Use the API directly for searching
    const API_KEY = process.env.REWARDS_API_KEY;
    const API_HOST = 'rewards-credit-card-api.p.rapidapi.com';
    const API_BASE_URL = 'https://rewards-credit-card-api.p.rapidapi.com';
    
    const response = await fetch(`${API_BASE_URL}/creditcard-detail-namesearch/${encodeURIComponent(searchTerm)}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY || '',
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`API search error: ${response.status}`);
    }
    
    const searchResults = await response.json();
    
    // Map the search results to the expected format
    // and ensure no duplicates
    const uniqueResults = Array.from(
      new Map(searchResults.map((card: any) => [card.cardKey, card])).values()
    );
    
    const formattedResults = uniqueResults.map((card: any) => ({
      cardKey: card.cardKey,
      cardName: card.cardName,
      cardIssuer: card.cardIssuer
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search cards' },
      { status: 500 }
    );
  }
}