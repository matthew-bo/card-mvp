import { NextResponse } from 'next/server';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardId, userName, rating, comment } = body;
    
    if (!cardId || !rating) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create a new review in Firestore
    const reviewData = {
      cardId,
      userId: 'anonymous', // In a real app with auth, this would be the user's ID
      userName: userName || 'Anonymous User',
      rating: Number(rating),
      comment: comment || '',
      timestamp: Timestamp.now(),
      likes: 0
    };
    
    const docRef = await addDoc(collection(db, 'card_reviews'), reviewData);
    
    return NextResponse.json({
      success: true,
      reviewId: docRef.id
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}