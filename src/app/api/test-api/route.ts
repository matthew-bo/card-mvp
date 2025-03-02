import { NextResponse } from 'next/server';

// Define a type for the status code object in the API response
interface ApiStatusCode {
  statusCode: number;
  apiCalls: number;
  apiCallsLimit: number;
  apiCallsRemaining: number;
  lastUpdated: string;
}

interface ApiUsageResponse {
  yearMonth: string;
  statusCode: ApiStatusCode[];
}

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
    
    const data = await response.json() as ApiUsageResponse[];
    
    // Find the API calls remaining in a type-safe way
    const apiCallsRemaining = data[0]?.statusCode.find((sc: ApiStatusCode) => sc.statusCode === 200)?.apiCallsRemaining;
    
    return NextResponse.json({
      success: true,
      status,
      statusText,
      apiCallsRemaining,
      data
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}