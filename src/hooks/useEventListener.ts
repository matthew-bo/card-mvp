'use client';

import { useEffect, useRef } from 'react';

type EventTarget = Window | Document | HTMLElement | null;

export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: EventTarget = typeof window !== 'undefined' ? window : null,
  options?: boolean | AddEventListenerOptions
) {
  // Create a ref that stores the handler
  const savedHandler = useRef(handler);
  
  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    // Make sure element supports addEventListener
    const targetElement = element;
    if (!targetElement || !targetElement.addEventListener) return;
    
    // Create event listener that calls handler function stored in ref
    const eventListener: typeof handler = (event) => savedHandler.current(event);
    
    targetElement.addEventListener(eventName, eventListener as EventListener, options);
    
    // Remove event listener on cleanup
    return () => {
      targetElement.removeEventListener(eventName, eventListener as EventListener, options);
    };
  }, [eventName, element, options]);
}