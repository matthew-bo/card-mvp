import { NextResponse } from 'next/server';
import { mapApiCardToAppFormat } from '@/services/cardApiService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cardKey = url.searchParams.get('cardKey');
    
    if (!cardKey) {
      return NextResponse.json(
        { success: false, error: 'Card key is required' },
        { status: 400 }
      );
    }
    
    // Use the API directly for getting card details
    const API_KEY = process.env.REWARDS_API_KEY;
    const API_HOST = 'rewards-credit-card-api.p.rapidapi.com';
    const API_BASE_URL = 'https://rewards-credit-card-api.p.rapidapi.com';
    
    const response = await fetch(`${API_BASE_URL}/creditcard-detail-bycard/${cardKey}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY || '',
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const cardData = await response.json();
    
    if (!cardData || !Array.isArray(cardData) || cardData.length === 0) {
      throw new Error('Invalid API response format');
    }
    
    const apiCard = cardData[0];
    
    // Map API response to our app's card format
    const mappedCard = mapApiCardToAppFormat(apiCard);
    
    return NextResponse.json({
      success: true,
      data: mappedCard
    });
  } catch (error) {
    console.error('Error getting card details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get card details' },
      { status: 500 }
    );
  }
}