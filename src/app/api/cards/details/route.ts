import { NextResponse } from 'next/server';
import { mapApiCardToAppFormat } from '@/services/cardApiService';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    
    // Try to get cardKey from query parameter first
    let cardKey = url.searchParams.get('cardKey');
    
    // If not found in query, try to get it from the URL path
    if (!cardKey) {
      const pathParts = url.pathname.split('/');
      cardKey = pathParts[pathParts.length - 1];
    }
    
    if (!cardKey) {
      return NextResponse.json(
        { success: false, error: 'Card key is required' },
        { status: 400 }
      );
    }
    
    // Try to get the card from the API first
    try {
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
    } catch (apiError) {
      console.log('API request failed, using fallback data:', apiError);
      
      // Try to find the card in our fallback database
      const fallbackCard = fallbackCards.find(card => card.id === cardKey);
      
      if (fallbackCard) {
        return NextResponse.json({
          success: true,
          data: fallbackCard,
          source: 'fallback'
        });
      } else {
        throw new Error('Card not found in fallback database');
      }
    }
  } catch (error) {
    console.error('Error getting card details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get card details' },
      { status: 500 }
    );
  }
}