'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocumentIcon, CopyIcon, CheckIcon, DownloadIcon } from '@/components/Icons';
import styles from './SummaryCard.module.css';

interface SummaryCardProps {
  summary: string;
  isLoading: boolean;
  videoId?: string;
}

export function SummaryCard({ summary, isLoading, videoId }: SummaryCardProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = summary;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [summary]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([summary], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = videoId ? `yt-summary-${videoId}.md` : 'yt-summary.md';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [summary, videoId]);

  const showActions = summary && !isLoading;

  return (
    <div className={styles.summaryCard} aria-live="polite">
      <div className={styles.summaryCardHeader}>
        <div className={styles.headerTitle}>
          <DocumentIcon />
          Summary
        </div>
        {showActions ? (
          <div className={styles.headerActions}>
            <button
              onClick={handleCopy}
              className={styles.actionButton}
              aria-label={copied ? 'Copied to clipboard' : 'Copy summary'}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className={styles.actionButton}
              aria-label="Download summary as markdown"
            >
              <DownloadIcon />
              Download
            </button>
          </div>
        ) : null}
      </div>
      {summary ? (
        <div className={styles.proseSummary}>
          <ErrorBoundary>
            <ReactMarkdown>{summary}</ReactMarkdown>
          </ErrorBoundary>
        </div>
      ) : (
        <div className={styles.loadingState}>
          <div className={styles.loadingDots}>
            <span /><span /><span />
          </div>
          Fetching transcript and generating summary...
        </div>
      )}
    </div>
  );
}
