'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SummaryLength, VideoMetadata } from '@/types';
import { API_SUMMARIZE_ENDPOINT } from '@/constants';

interface UseSummarizeReturn {
  summary: string;
  isLoading: boolean;
  error: string | null;
  metadata: VideoMetadata | null;
  submitUrl: (url: string, length: SummaryLength) => void;
}

function parseMetadataLine(line: string): VideoMetadata | null {
  try {
    const parsed = JSON.parse(line);
    if (parsed && parsed.id && parsed.title) return parsed as VideoMetadata;
  } catch {
    // Not valid metadata JSON
  }
  return null;
}

export function useSummarize(): UseSummarizeReturn {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const submitUrl = useCallback(async (url: string, length: SummaryLength) => {
    setSummary('');
    setError(null);
    setMetadata(null);
    setIsLoading(true);

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(API_SUMMARIZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: url, length }),
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
      let metadataParsed = false;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        if (!metadataParsed) {
          buffer += chunk;
          const newlineIdx = buffer.indexOf('\n');
          if (newlineIdx !== -1) {
            const jsonLine = buffer.slice(0, newlineIdx);
            const remaining = buffer.slice(newlineIdx + 1);
            metadataParsed = true;
            setMetadata(parseMetadataLine(jsonLine));
            if (remaining) {
              setSummary((prev) => prev + remaining);
            }
          }
        } else {
          setSummary((prev) => prev + chunk);
        }
      }

      // Flush buffer if stream ended before metadata newline delimiter
      if (!metadataParsed && buffer) {
        const parsed = parseMetadataLine(buffer);
        if (parsed) {
          setMetadata(parsed);
        } else {
          setSummary((prev) => prev + buffer);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { summary, isLoading, error, metadata, submitUrl };
}
