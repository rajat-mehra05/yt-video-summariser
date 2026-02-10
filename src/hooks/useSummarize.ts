'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { API_SUMMARIZE_ENDPOINT } from '@/constants';

interface UseSummarizeReturn {
  summary: string;
  isLoading: boolean;
  error: string | null;
  submitUrl: (url: string) => void;
}

export function useSummarize(): UseSummarizeReturn {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const submitUrl = useCallback(async (url: string) => {
    setSummary('');
    setError(null);
    setIsLoading(true);

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(API_SUMMARIZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: url }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const data = await response.json();
          if (data.error) errorMessage = data.error;
        } catch {
          // Response wasn't JSON — use the status-based message
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setSummary((prev) => prev + chunk);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { summary, isLoading, error, submitUrl };
}
