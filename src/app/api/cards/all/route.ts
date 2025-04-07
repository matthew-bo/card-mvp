import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FIREBASE_COLLECTIONS } from '@/lib/firebase';

export async function GET() {
  try {
    const cardsCollection = collection(db, FIREBASE_COLLECTIONS.CREDIT_CARDS); // Use the correct collection name
    const snapshot = await getDocs(cardsCollection);
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const cards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: cards
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cards'
    }, { status: 500 });
  }
}