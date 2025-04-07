import { useState, useEffect } from 'react';

/**
 * Check if code is running in a browser environment
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Hook that returns whether the code is running in a browser environment
 */
export const useIsBrowser = (): boolean => {
  const [browser, setBrowser] = useState(false);
  
  useEffect(() => {
    setBrowser(isBrowser());
  }, []);
  
  return browser;
};

/**
 * Hook that returns the current window dimensions
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0
  });
  
  useEffect(() => {
    // Only run on client side
    if (!isBrowser()) return;
    
    // Handler to call on window resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures effect only runs once
  
  return windowSize;
};

/**
 * Hook that returns whether a media query matches
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (!isBrowser()) return;
    
    const mediaQuery = window.matchMedia(query);
    
    // Update the state initially
    setMatches(mediaQuery.matches);
    
    // Define a callback for when the media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add the callback as a listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Remove the listener on cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);
  
  return matches;
};

export default {
  useIsBrowser,
  useWindowSize,
  useMediaQuery
}; 