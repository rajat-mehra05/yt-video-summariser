'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { extractVideoId } from '@/utils/video';
import { useSummarize } from '@/hooks/useSummarize';
import { VideoIcon, SpinnerIcon } from '@/components/Icons';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SummaryCard } from '@/components/SummaryCard';
import styles from './SummarizerForm.module.css';

export default function SummarizerForm() {
  const [input, setInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { summary, isLoading, error, submitUrl } = useSummarize();
  const resultRef = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef(false);

  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      resultRef.current?.focus();
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const videoId = extractVideoId(trimmed);
    if (!videoId) {
      setValidationError('Please enter a valid YouTube URL or video ID.');
      return;
    }
    setValidationError(null);
    submitUrl(videoId);
  };

  const displayError = validationError || error;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className={styles.inputGroup}>
          <VideoIcon className={styles.inputIcon} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className={styles.input}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={styles.button}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <SpinnerIcon />
                Summarizing
              </span>
            ) : (
              'Summarize'
            )}
          </button>
        </div>
      </form>

      {displayError && <ErrorBanner message={displayError} />}

      {(summary || isLoading) && (
        <div ref={resultRef} tabIndex={-1} className="outline-none">
          <SummaryCard summary={summary} />
        </div>
      )}
    </div>
  );
}
