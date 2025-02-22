interface Expense {
    amount: number;
    category: string;
    date: Date;
    userId: string;
  }
  
  export function validateExpense(data: Partial<Expense>): boolean {
    // Amount validation
    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
      return false;
    }
  
    // Category validation
    const validCategories = ['dining', 'travel', 'grocery', 'gas', 'entertainment', 'rent', 'other'];
    if (!data.category || !validCategories.includes(data.category)) {
      return false;
    }
  
    // User validation
    if (!data.userId) {
      return false;
    }
  
    // Date validation
    if (!data.date || !(data.date instanceof Date) || isNaN(data.date.getTime())) {
      return false;
    }
  
    return true;
  }