import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { creditCards as fallbackCards } from '@/lib/cardDatabase';
import { fetchAllCards } from '@/services/cardApiService';
import { CreditCardDetails } from '@/types/cards';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
      console.log('API Request: /api/cards/all');
      
      // Check if cards collection exists in Firebase
      const cardsRef = collection(db, 'credit_cards');
      const cardsSnapshot = await getDocs(cardsRef);
      
      console.log(`Found ${cardsSnapshot.size} cards in Firebase`);
      
      if (cardsSnapshot.empty) {
        console.log('No cards found in Firebase, returning fallback data');
        return NextResponse.json({
          success: true,
          data: fallbackCards,
          fallback: true
        });
      }
      
      // Convert Firebase docs to expected format
      const cards = cardsSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Map the document data to the expected format
        return {
          // Use the 'id' field from the document data, not the document ID
          id: data.id,
          name: data.name,
          issuer: data.issuer,
          rewardRates: data.rewardRates || {},
          annualFee: data.annualFee || 0,
          creditScoreRequired: data.creditScoreRequired || 'good',
          perks: data.perks || [],
          foreignTransactionFee: data.foreignTransactionFee || false,
          categories: data.categories || [],
          description: data.description || '',
          signupBonus: data.signupBonus || null
        };
      });
      
      console.log(`Returning ${cards.length} cards from Firebase`);
      
      return NextResponse.json({
        success: true,
        data: cards,
        cached: true,
        count: cards.length
      });
    } catch (error) {
      console.error('Error loading card database:', error);
      
      // Return fallback data on error
      return NextResponse.json({
        success: true,
        data: fallbackCards,
        fallback: true,
        error: 'Error loading database, using fallback data'
      });
    }
  }