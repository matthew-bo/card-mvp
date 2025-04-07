import { useEffect, useState } from 'react';
import cardSearchIndex from '@/services/cardSearchIndex';

/**
 * Component to preload the card search index
 * This should be included in _app.tsx or a layout component
 * to ensure the search index is loaded as early as possible
 */
export default function SearchIndexPreloader() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  useEffect(() => {
    const loadSearchIndex = async () => {
      // Don't block page load - wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        setStatus('loading');
        const success = await cardSearchIndex.initialize();
        setStatus(success ? 'success' : 'error');
      } catch (error) {
        console.error('Failed to initialize search index:', error);
        setStatus('error');
      }
    };
    
    loadSearchIndex();
  }, []);
  
  // This component doesn't render anything visible
  return null;
} 