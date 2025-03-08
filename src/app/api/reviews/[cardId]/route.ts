import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type RouteParams = {
  params: {
    cardId: string;
  };
};

export async function GET(
  request: NextRequest, 
  { params }: RouteParams
) {
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