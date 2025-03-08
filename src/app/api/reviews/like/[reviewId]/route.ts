import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  try {
    const reviewId = params.reviewId;
    
    // Get the review document
    const reviewRef = doc(db, 'card_reviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Increment the likes count using Firestore's atomic increment
    await updateDoc(reviewRef, {
      likes: increment(1)
    });
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error liking review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to like review' },
      { status: 500 }
    );
  }
}