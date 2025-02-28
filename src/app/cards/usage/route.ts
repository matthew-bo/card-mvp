export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const API_KEY = process.env.REWARDS_API_KEY;
const API_HOST = 'rewards-credit-card-api.p.rapidapi.com';
const API_BASE_URL = 'https://rewards-credit-card-api.p.rapidapi.com';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/creditcard-apiusage/${API_KEY}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY || '',
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching API usage data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API usage data' },
      { status: 500 }
    );
  }
}