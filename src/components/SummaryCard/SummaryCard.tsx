'use client';

import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { COPY_FEEDBACK_DURATION_MS, DOWNLOAD_FILENAME_PREFIX } from '@/constants';
import { DocumentIcon, CopyIcon, CheckIcon, DownloadIcon } from '@/components/Icons';
import styles from './SummaryCard.module.css';

const TIMESTAMP_REGEX = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;

function parseTimestampToSeconds(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

function renderTimestampLinks(text: string, videoId?: string): ReactNode[] {
  if (!videoId) return [text];

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(TIMESTAMP_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const ts = match[1];
    const seconds = parseTimestampToSeconds(ts);
    parts.push(
      <a
        key={`${match.index}-${ts}`}
        href={`https://www.youtube.com/watch?v=${videoId}&t=${seconds}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.timestamp}
      >
        {match[0]}
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function stripTimestamps(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    return children.replace(TIMESTAMP_REGEX, '').replace(/\s{2,}/g, ' ').trim();
  }
  if (Array.isArray(children)) {
    return children
      .map((child) =>
        typeof child === 'string'
          ? child.replace(TIMESTAMP_REGEX, '').replace(/\s{2,}/g, ' ').trim()
          : child
      )
      .filter((child) => child !== '');
  }
  return children;
}

function processChildren(children: ReactNode, videoId?: string): ReactNode {
  if (!videoId || !children) return children;

  if (typeof children === 'string') {
    const result = renderTimestampLinks(children, videoId);
    return result.length === 1 && typeof result[0] === 'string' ? result[0] : <>{result}</>;
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        const result = renderTimestampLinks(child, videoId);
        return result.length === 1 && typeof result[0] === 'string'
          ? result[0]
          : <span key={i}>{result}</span>;
      }
      return child;
    });
  }

  return children;
}

interface SummaryCardProps {
  summary: string;
  isLoading: boolean;
  videoId?: string;
}

export function SummaryCard({ summary, isLoading, videoId }: SummaryCardProps) {
  const [copied, setCopied] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
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
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setCopied(true);
    setShowPulse(true);
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      setShowPulse(false);
    }, COPY_FEEDBACK_DURATION_MS);
  }, [summary]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([summary], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = videoId ? `${DOWNLOAD_FILENAME_PREFIX}-${videoId}.md` : `${DOWNLOAD_FILENAME_PREFIX}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [summary, videoId]);

  const showActions = summary && !isLoading;

  const markdownComponents = useMemo(() => ({
    h1: ({ children }: { children?: ReactNode }) => (
      <h1>{stripTimestamps(children)}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2>{stripTimestamps(children)}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3>{stripTimestamps(children)}</h3>
    ),
    p: ({ children }: { children?: ReactNode }) => (
      <p>{processChildren(children, videoId)}</p>
    ),
    li: ({ children }: { children?: ReactNode }) => (
      <li>{processChildren(children, videoId)}</li>
    ),
    strong: ({ children }: { children?: ReactNode }) => (
      <strong>{processChildren(children, videoId)}</strong>
    ),
  }), [videoId]);

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
              className={`${styles.actionButton} ${showPulse ? styles.copyPulse : ''}`}
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
            <ReactMarkdown components={markdownComponents}>{summary}</ReactMarkdown>
          </ErrorBoundary>
        </div>
      ) : (
        <div className={styles.loadingState}>
          <span className={styles.loadingText}>Generating summary...</span>
          <div className={styles.skeletonLines}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </div>
        </div>
      )}
    </div>
  );
}
