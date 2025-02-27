import fs from 'fs';
import path from 'path';
import { CreditCardDetails } from '@/types/cards';

const CACHE_FILE_PATH = path.join(process.cwd(), '.card-cache.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CardCache {
  timestamp: number;
  cards: CreditCardDetails[];
}

export function getCachedCards(): CreditCardDetails[] | null {
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      return null;
    }
    
    const cacheJson = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
    const cache: CardCache = JSON.parse(cacheJson);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - cache.timestamp < CACHE_DURATION) {
      return cache.cards;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading card cache:', error);
    return null;
  }
}

export function setCachedCards(cards: CreditCardDetails[]): void {
  try {
    const cache: CardCache = {
      timestamp: Date.now(),
      cards
    };
    
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Error saving card cache:', error);
  }
}

export function clearCardCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      fs.unlinkSync(CACHE_FILE_PATH);
    }
  } catch (error) {
    console.error('Error clearing card cache:', error);
  }
}

export function getCacheTimestamp(): Date | null {
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      return null;
    }
    
    const cacheJson = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
    const cache: CardCache = JSON.parse(cacheJson);
    return new Date(cache.timestamp);
  } catch (error) {
    console.error('Error reading cache timestamp:', error);
    return null;
  }
}