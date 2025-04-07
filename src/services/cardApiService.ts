import { creditCards as fallbackCards } from '@/lib/cardDatabase';

/**
 * Fetches all cards from the API or returns fallback data if the API is unavailable
 * @returns {Promise<Array<Object>>} Array of card objects
 */
export async function fetchAllCards() {
  try {
    // In a real implementation, this would fetch from an external API
    // For now, we'll use the fallback data
    return fallbackCards;
  } catch (error) {
    console.error('Error fetching cards from API:', error);
    return fallbackCards;
  }
}

/**
 * Fetches a single card by ID from the API or returns fallback data if the API is unavailable
 * @param {string} id - The ID of the card to fetch
 * @returns {Promise<Object>} The card object
 */
export async function fetchCardById(id: string) {
  try {
    // In a real implementation, this would fetch from an external API
    // For now, we'll use the fallback data
    const card = fallbackCards.find(card => card.id === id);
    if (!card) {
      throw new Error(`Card with ID ${id} not found`);
    }
    return card;
  } catch (error) {
    console.error('Error fetching card from API:', error);
    const fallbackCard = fallbackCards.find(card => card.id === id);
    if (!fallbackCard) {
      throw new Error(`Card with ID ${id} not found in fallback data`);
    }
    return fallbackCard;
  }
} 