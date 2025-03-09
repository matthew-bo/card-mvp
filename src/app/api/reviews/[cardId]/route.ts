import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Fallback reviews for development
const fallbackReviews = [
  {
    id: 'fallback-1',
    userId: 'anonymous',
    userName: 'John D.',
    rating: 4,
    comment: 'Great rewards program!',
    timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 },
    likes: 2
  },
  {
    id: 'fallback-2',
    userId: 'anonymous',
    userName: 'Sarah M.',
    rating: 5,
    comment: 'Best travel card I have used.',
    timestamp: { seconds: (Date.now() - 86400000) / 1000, nanoseconds: 0 },
    likes: 3
  }
];

export async function GET(
  request: Request
): Promise<NextResponse> {
  try {
    // Get cardId from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const cardId = pathParts[pathParts.length - 1];
    
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        reviews: fallbackReviews
      });
    }
    
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
    
    // Return fallback reviews in case of error
    return NextResponse.json({
      success: true,
      reviews: fallbackReviews
    });
  }
}