/**
 * A safe wrapper around localStorage to prevent SSR issues
 */
export const safeStorage = {
    getItem: (key: string): string | null => {
      if (typeof window === 'undefined') {
        return null;
      }
      
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
      }
    },
    
    setItem: (key: string, value: string): void => {
      if (typeof window === 'undefined') {
        return;
      }
      
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    
    removeItem: (key: string): void => {
      if (typeof window === 'undefined') {
        return;
      }
      
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    }
  };
  
  export default safeStorage;