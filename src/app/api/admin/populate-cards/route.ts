import { NextRequest, NextResponse } from 'next/server';
import { populateFirestoreWithCards } from '@/utils/populateFirestoreCards';
import { isAdmin } from '@/utils/adminConfig';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Get auth information
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check admin authorization (via token or admin email)
    const token = authHeader.split('Bearer ')[1];
    const isAuthorized = token === process.env.ADMIN_API_KEY;
    
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Begin population
    const cardCount = await populateFirestoreWithCards();
    
    return NextResponse.json({
      success: true,
      message: `Successfully populated Firestore with ${cardCount} cards`,
      cardCount
    });
  } catch (error) {
    console.error('Error in populate-cards API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to populate cards' },
      { status: 500 }
    );
  }
}