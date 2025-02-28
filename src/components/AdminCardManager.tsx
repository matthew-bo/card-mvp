'use client';

import { useState } from 'react';
import { SimpleMonitor } from '@/utils/monitoring/simpleMonitor';

export default function AdminCardManager() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    cardCount?: number;
    error?: string;
  } | null>(null);

  const handlePopulateCards = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setResult(null);

      // Make API request to populate cards
      const response = await fetch('/api/admin/populate-cards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'admin-key'}`
        }
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        SimpleMonitor.logEvent(
          'cards_populated',
          `Successfully populated ${data.cardCount} cards from API to Firestore`,
          { cardCount: data.cardCount }
        );
      } else {
        SimpleMonitor.logEvent(
          'cards_population_failed',
          `Failed to populate cards: ${data.error}`,
          { error: data.error }
        );
      }
    } catch (error) {
      console.error('Error populating cards:', error);
      setResult({
        success: false,
        error: 'An unexpected error occurred'
      });
      SimpleMonitor.trackError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Card Database Management</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">Populate Firestore with cards from the API</p>
            <p className="text-xs text-gray-500 mt-1">
              This will fetch all available cards from the credit card API and store them in Firestore
            </p>
          </div>
          
          <button
            onClick={handlePopulateCards}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Populate Cards'}
          </button>
        </div>
        
        {result && (
          <div className={`mt-4 p-4 rounded-md ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {result.success ? (
              <p>Successfully added {result.cardCount} cards to the database! {result.message}</p>
            ) : (
              <p>Error: {result.error}</p>
            )}
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Important Notes</h3>
          <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1">
            <li>This operation may take up to a minute to complete</li>
            <li>Only administrators can perform this action</li>
            <li>Existing cards will not be duplicated</li>
            <li>API rate limits may apply</li>
          </ul>
        </div>
      </div>
    </div>
  );
}