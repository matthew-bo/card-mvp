const safeStorage = {
  getItem(key: string): string | null {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting localStorage:', error);
      return false;
    }
  },

  removeItem(key: string): boolean {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
};

export default safeStorage; 