import React from 'react';
import { LoadedExpense } from '@/types/cards';

interface ExpensesListProps {
  expenses: LoadedExpense[];
  onDelete: (id: string) => void;
  totalExpenses: number;
}

const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  onDelete,
  totalExpenses
}) => {
  const hasMultipleExpenses = expenses.length > 8;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Your Expenses</h3>
        <div className="text-sm text-gray-600">
          Total: ${totalExpenses.toFixed(2)}
        </div>
      </div>
      
      {/* Scrollable container with improved styling */}
      <div className={`
        relative overflow-hidden rounded-lg border border-gray-200
        ${hasMultipleExpenses ? 'max-h-[400px]' : ''}
      `}>
        {/* Top shadow indicator for scrollability */}
        {hasMultipleExpenses && (
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
        )}
        
        {/* Bottom shadow indicator for scrollability */}
        {hasMultipleExpenses && (
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
        )}
        
        {/* Actual scrollable content */}
        <div className={`
          overflow-y-auto
          ${hasMultipleExpenses ? 'max-h-[400px] overscroll-contain' : ''}
          scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
        `}>
          {expenses.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No expenses added yet.</p>
              <p className="text-sm mt-1">Add an expense to get personalized card recommendations.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <div className="font-medium">
                        ${expense.amount.toFixed(2)}
                        <span className="ml-2 text-sm text-gray-600 capitalize">{expense.category}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                    aria-label="Delete expense"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                      strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesList; 