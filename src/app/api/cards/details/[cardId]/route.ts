import { NextRequest, NextResponse } from 'next/server';
import { mapApiCardToAppFormat } from '@/services/cardApiService';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest, 
  { params }: { params: { cardId: string } }
) {
  try {
    const cardKey = params.cardId;
    
    console.log('Received card request for ID:', cardKey);
    
    if (!cardKey) {
      return NextResponse.json(
        { success: false, error: 'Card key is required' },
        { status: 400 }
      );
    }
    
    // Try to find the card in our fallback database first
    const fallbackCard = fallbackCards.find(card => card.id === cardKey);
    
    console.log('Looking for card in fallback database:', cardKey);
    console.log('Available fallback cards:', fallbackCards.map(card => card.id));
    console.log('Found fallback card:', fallbackCard ? 'yes' : 'no');
    
    if (fallbackCard) {
      return NextResponse.json({
        success: true,
        data: fallbackCard,
        source: 'fallback'
      });
    }
    
    // If not in fallback database and in development, return 404
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }
    
    // Try to get the card from the API
    try {
      const API_KEY = process.env.REWARDS_API_KEY;
      const API_HOST = 'rewards-credit-card-api.p.rapidapi.com';
      const API_BASE_URL = 'https://rewards-credit-card-api.p.rapidapi.com';
      
      console.log('Attempting to fetch from API for card:', cardKey);
      
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
      const mappedCard = mapApiCardToAppFormat(apiCard);
      
      return NextResponse.json({
        success: true,
        data: mappedCard
      });
    } catch (apiError) {
      console.log('API request failed:', apiError);
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error getting card details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get card details' },
      { status: 500 }
    );
  }
} 