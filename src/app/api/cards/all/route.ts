import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Fetching all cards');
    
    // Get all cards from Firebase
    const cardsRef = collection(db, 'credit_cards');
    const snapshot = await getDocs(cardsRef);
    
    console.log(`Found ${snapshot.size} cards in Firebase`);
    
    if (snapshot.empty) {
      console.log('No cards found, using fallback data');
      return NextResponse.json({
        success: true,
        data: fallbackCards,
        fallback: true
      });
    }
    
    // Transform to expected format for app
    const cards = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Return data with id field as the card ID
      return {
        id: data.id,  // Keep the id field from the document
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
      };
    });
    
    return NextResponse.json({
      success: true,
      data: cards,
      count: cards.length
    });
  } catch (error) {
    console.error('Error loading cards:', error);
    return NextResponse.json({
      success: true,
      data: fallbackCards,
      fallback: true,
      error: 'Error loading database, using fallback data'
    });
  }
}