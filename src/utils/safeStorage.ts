/**
 * A safe wrapper around localStorage with memory fallback
 */

// Memory fallback when localStorage is not available
const memoryStorage = new Map<string, string>();

export const safeStorage = {
    getItem: (key: string): string | null => {
      if (typeof window === 'undefined') {
        return memoryStorage.get(key) || null;
      }
      
      try {
        // Try localStorage first
        const value = localStorage.getItem(key);
        if (value !== null) {
          return value;
        }
        
        // Fallback to memory storage
        return memoryStorage.get(key) || null;
      } catch (error) {
        console.warn('localStorage not available, using memory storage:', error);
        return memoryStorage.get(key) || null;
      }
    },
    
    setItem: (key: string, value: string): void => {
      if (typeof window === 'undefined') {
        memoryStorage.set(key, value);
        return;
      }
      
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('localStorage not available, using memory storage:', error);
        memoryStorage.set(key, value);
      }
    },
    
    removeItem: (key: string): void => {
      if (typeof window === 'undefined') {
        memoryStorage.delete(key);
        return;
      }
      
      try {
        localStorage.removeItem(key);
        memoryStorage.delete(key);
      } catch (error) {
        console.warn('localStorage not available, using memory storage:', error);
        memoryStorage.delete(key);
      }
    },

    // Helper method to check if storage is available
    isAvailable: (): boolean => {
      if (typeof window === 'undefined') {
        return false;
      }
      
      try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
      } catch (error) {
        return false;
      }
    }
  };
  
  export default safeStorage;