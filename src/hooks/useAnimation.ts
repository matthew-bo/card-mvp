'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimationOptions {
  once?: boolean;
  delay?: number;
  amount?: number; 
}

export function useAnimation(ref: React.RefObject<HTMLElement>, options: AnimationOptions = {}) {
  const { once = true, delay = 0, amount = 0.1 } = options;
  const isInView = useInView(ref, { once, amount }); 
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, delay * 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (!once && !isInView) {
      setShouldAnimate(false);
    }
  }, [isInView, delay, once]);

  return shouldAnimate;
}