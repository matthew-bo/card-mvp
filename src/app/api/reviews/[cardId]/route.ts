// src/app/api/reviews/[cardId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the interface according to Next.js App Router expectations
interface RouteContext {
  params: {
    cardId: string;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const cardId = params.cardId;
    
    const reviewsRef = collection(db, 'card_reviews');
    const q = query(
      reviewsRef, 
      where('cardId', '==', cardId),
      orderBy('timestamp', 'desc')
    );
    
    const reviewsSnapshot = await getDocs(q);
    
    // Convert to array of reviews
    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}