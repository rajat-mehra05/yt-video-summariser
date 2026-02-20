'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { SummaryLength, SummaryLanguage } from '@/types';
import { extractVideoId } from '@/utils/video';
import { VALIDATION_MESSAGES, DEFAULT_SUMMARY_LENGTH, DEFAULT_SUMMARY_LANGUAGE, VALID_LANGUAGES, LANGUAGE_STORAGE_KEY } from '@/constants';
import { useSummarize } from '@/hooks/useSummarize';
import { VideoIcon, SpinnerIcon } from '@/components/Icons';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SummaryCard } from '@/components/SummaryCard';
import { VideoInfo } from '@/components/VideoInfo';
import { LengthSelector } from '@/components/LengthSelector';
import { LanguageSelector } from '@/components/LanguageSelector';
import styles from './SummarizerForm.module.css';

interface SummarizerFormProps {
  initialVideoId?: string;
  initialLength?: SummaryLength;
  initialLanguage?: SummaryLanguage;
}

function getStoredLanguage(): SummaryLanguage {
  if (typeof window === 'undefined') return DEFAULT_SUMMARY_LANGUAGE;
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && VALID_LANGUAGES.includes(stored as SummaryLanguage)) {
    return stored as SummaryLanguage;
  }
  return DEFAULT_SUMMARY_LANGUAGE;
}

export default function SummarizerForm({ initialVideoId, initialLength, initialLanguage }: SummarizerFormProps) {
  const [input, setInput] = useState(initialVideoId ?? '');
  const [length, setLength] = useState<SummaryLength>(initialLength ?? DEFAULT_SUMMARY_LENGTH);
  const [validationError, setValidationError] = useState<string | null>(null);
  const resolvedInitialVideoId = initialVideoId ? extractVideoId(initialVideoId) : null;
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(resolvedInitialVideoId);
  const [currentLength, setCurrentLength] = useState<SummaryLength>(initialLength ?? DEFAULT_SUMMARY_LENGTH);
  const [language, setLanguage] = useState<SummaryLanguage>(initialLanguage ?? getStoredLanguage);
  const [currentLanguage, setCurrentLanguage] = useState<SummaryLanguage>(initialLanguage ?? DEFAULT_SUMMARY_LANGUAGE);
  const { summary, isLoading, error, metadata, submitUrl } = useSummarize();
  const resultRef = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef(false);

  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      resultRef.current?.focus();
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  const handleLanguageChange = (lang: SummaryLanguage) => {
    setLanguage(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  // Auto-submit when valid initial params are provided via URL
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (resolvedInitialVideoId && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      submitUrl(resolvedInitialVideoId, initialLength ?? DEFAULT_SUMMARY_LENGTH, initialLanguage ?? DEFAULT_SUMMARY_LANGUAGE);
    }
  }, [resolvedInitialVideoId, initialLength, initialLanguage, submitUrl]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const videoId = extractVideoId(trimmed);
    if (!videoId) {
      setValidationError(VALIDATION_MESSAGES.INVALID_YOUTUBE_URL);
      return;
    }
    setValidationError(null);
    setCurrentVideoId(videoId);
    setCurrentLength(length);
    setCurrentLanguage(language);
    submitUrl(videoId, length, language);
  };

  const displayError = validationError || error;

  return (
    <div className="w-full">
      <LengthSelector value={length} onChange={setLength} disabled={isLoading} />
      <LanguageSelector value={language} onChange={handleLanguageChange} disabled={isLoading} />

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

      {displayError ? <ErrorBanner message={displayError} /> : null}

      {metadata ? <VideoInfo metadata={metadata} /> : null}

      {(summary || isLoading) ? (
        <div ref={resultRef} tabIndex={-1} className="outline-none">
          <SummaryCard summary={summary} isLoading={isLoading} videoId={currentVideoId ?? undefined} length={currentLength} language={currentLanguage} />
        </div>
      ) : !displayError ? (
        <p className={styles.emptyHint}>Enter a YouTube URL above to get started</p>
      ) : null}
    </div>
  );
}
