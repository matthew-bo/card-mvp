// src/app/api/reviews/[cardId]/route.ts
import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(
  request: Request
): Promise<NextResponse> {
  try {
    // Get cardId from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const cardId = pathParts[pathParts.length - 1];
    
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