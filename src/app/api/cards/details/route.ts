import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cardKey = url.searchParams.get('cardKey');
    
    if (!cardKey) {
      return NextResponse.json(
        { success: false, error: 'Card key is required' },
        { status: 400 }
      );
    }
    
    // Get all cards from Firebase
    const cardsRef = collection(db, 'credit_cards');
    const snapshot = await getDocs(cardsRef);
    
    // Find the card with the matching ID field
    const cardDoc = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.id === cardKey;
    });
    
    if (!cardDoc) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }
    
    const data = cardDoc.data();
    
    // Return the card in the expected format
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name || '',
        issuer: data.issuer || '',
        rewardRates: data.rewardRates || {},
        annualFee: data.annualFee || 0,
        creditScoreRequired: data.creditScoreRequired || 'good',
        perks: data.perks || [],
        foreignTransactionFee: data.foreignTransactionFee === false ? false : true,
        categories: data.categories || [],
        description: data.description || '',
        signupBonus: data.signupBonus || null
      }
    });
  } catch (error) {
    console.error('Error getting card details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get card details' },
      { status: 500 }
    );
  }
}