import { CreditCardDetails } from '@/types/cards';

/**
 * Fetches all credit cards from the API
 * @returns Array of credit card details
 */
export async function fetchCards(): Promise<CreditCardDetails[]> {
  try {
    const response = await fetch('/api/cards/all');
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }
}

/**
 * Fetches a single credit card by ID
 * @param cardId The ID of the card to fetch
 * @returns Card details
 */
export async function fetchCardById(cardId: string): Promise<CreditCardDetails> {
  try {
    const response = await fetch(`/api/cards/details?cardKey=${cardId}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching card ${cardId}:`, error);
    throw error;
  }
}

/**
 * Fetches reviews for a specific card
 * @param cardId The ID of the card
 * @returns Array of reviews
 */
export async function fetchReviews(cardId: string) {
  try {
    const response = await fetch(`/api/reviews/${cardId}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.reviews || [];
  } catch (error) {
    console.error(`Error fetching reviews for card ${cardId}:`, error);
    throw error;
  }
}

/**
 * Submits a new review
 * @param reviewData The review data to submit
 * @returns Response from the API
 */
export async function submitReview(reviewData: {
  cardId: string;
  userName: string;
  rating: number;
  comment: string;
}) {
  try {
    const response = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}

/**
 * Likes a review
 * @param reviewId The ID of the review to like
 * @returns Response from the API
 */
export async function likeReview(reviewId: string) {
  try {
    const response = await fetch(`/api/reviews/like/${reviewId}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error liking review ${reviewId}:`, error);
    throw error;
  }
}