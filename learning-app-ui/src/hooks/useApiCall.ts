"use client";
import { useEffect, useRef } from "react";

interface UseApiCallOptions {
  enabled?: boolean;
  skipFirstCall?: boolean;
}

export const useApiCall = (
  apiFunction: () => Promise<void>,
  dependencies: any[],
  options: UseApiCallOptions = {}
) => {
  const { enabled = true, skipFirstCall = false } = options;
  const hasCalledRef = useRef(false);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // Skip if not enabled
    if (!enabled) {
      return;
    }

    // Skip first call if requested
    if (skipFirstCall && isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // Prevent duplicate calls in development mode (React Strict Mode)
    if (hasCalledRef.current) {
      return;
    }

    hasCalledRef.current = true;
    
    // Reset the flag after a short delay to allow for legitimate re-calls
    const timeoutId = setTimeout(() => {
      hasCalledRef.current = false;
    }, 100);

    apiFunction();

    return () => {
      clearTimeout(timeoutId);
    };
  }, dependencies);

  // Reset flags when dependencies change
  useEffect(() => {
    hasCalledRef.current = false;
    isFirstRenderRef.current = true;
  }, dependencies);
}; 