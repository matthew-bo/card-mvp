import { useState, useCallback } from 'react';

export type LoadingState = 'initializing' | 'loading-cards' | 'loading' | 'ready' | 'error';

export const useLoadingState = (initialState: LoadingState = 'initializing') => {
  const [loading, setLoading] = useState<LoadingState>(initialState);
  const [error, setError] = useState<string | null>(null);

  const setLoadingState = useCallback((state: LoadingState, errorMessage?: string) => {
    setLoading((prevState) => {
      if (prevState === state) return prevState;
      return state;
    });
    
    setError((prevError) => {
      if (state === 'error' && errorMessage && prevError !== errorMessage) {
        return errorMessage;
      } else if (state === 'ready' && prevError !== null) {
        return null;
      }
      return prevError;
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    setLoadingState,
    clearError,
    isLoading: loading !== 'ready' && loading !== 'error',
    isError: loading === 'error',
    isReady: loading === 'ready',
  };
};

export default useLoadingState; 