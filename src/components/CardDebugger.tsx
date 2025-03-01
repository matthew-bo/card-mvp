'use client';

import { useState, useEffect } from 'react';

export default function CardDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch debug info
  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        const response = await fetch('/api/debug-cards');
        const data = await response.json();
        setDebugInfo(data);
      } catch (error) {
        console.error('Debug fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDebugInfo();
  }, []);
  
  // Test search function
  const handleTestSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/cards/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setSearchResult(data);
    } catch (error) {
      console.error('Search test error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !debugInfo) {
    return <div className="p-4 bg-gray-100 text-gray-700">Loading debug info...</div>;
  }
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg max-w-4xl mx-auto my-8">
      <h2 className="text-lg font-medium mb-4">Card System Debugger</h2>
      
      {debugInfo && (
        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">Database Info</h3>
          <div className="bg-white p-3 rounded border">
            <p>Total cards in database: {debugInfo.totalCards}</p>
            
            {debugInfo.sampleCards && debugInfo.sampleCards.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Sample Card Structure:</p>
                <pre className="text-xs mt-1 p-2 bg-gray-50 overflow-auto max-h-60">
                  {JSON.stringify(debugInfo.sampleCards[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Test Search</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter search term (min 3 chars)"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleTestSearch}
            disabled={!searchTerm || searchTerm.length < 3 || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Test Search
          </button>
        </div>
        
        {searchResult && (
          <div className="mt-3 bg-white p-3 rounded border">
            <p>Search results: {searchResult.data?.length || 0} cards found</p>
            
            {searchResult.data && searchResult.data.length > 0 ? (
              <div className="mt-2">
                <p className="font-medium">Search Result Structure:</p>
                <pre className="text-xs mt-1 p-2 bg-gray-50 overflow-auto max-h-60">
                  {JSON.stringify(searchResult.data[0], null, 2)}
                </pre>
                
                <p className="font-medium mt-3">All Results:</p>
                <ul className="mt-1 text-sm">
                  {searchResult.data.map((card: any, i: number) => (
                    <li key={i} className="py-1 border-b last:border-0">
                      {card.cardName} ({card.cardIssuer}) - Key: {card.cardKey}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-red-500 mt-2">No results found</p>
            )}
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-md font-medium mb-2">Next Steps</h3>
        <ul className="text-sm space-y-1">
          <li>• Check that the search response has the correct structure</li>
          <li>• Verify that your CardSearch component matches this structure</li>
          <li>• Test the recommendation system separately</li>
        </ul>
      </div>
    </div>
  );
}