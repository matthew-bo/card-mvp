import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const API_KEY = process.env.REWARDS_API_KEY;
    const API_HOST = 'rewards-credit-card-api.p.rapidapi.com';
    const API_BASE_URL = 'https://rewards-credit-card-api.p.rapidapi.com';
    
    if (!API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'API key is missing'
      }, { status: 500 });
    }
    
    // Test with a simple endpoint
    const response = await fetch(`${API_BASE_URL}/creditcard-apiusage/${API_KEY}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    const status = response.status;
    const statusText = response.statusText;
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status,
        statusText,
        error: 'API test failed'
      }, { status: 500 });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      status,
      statusText,
      apiCallsRemaining: data[0]?.statusCode.find((sc: any) => sc.statusCode === 200)?.apiCallsRemaining,
      data: data
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}