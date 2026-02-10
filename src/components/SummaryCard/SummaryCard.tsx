import ReactMarkdown from 'react-markdown';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocumentIcon } from '@/components/Icons';
import styles from './SummaryCard.module.css';

export function SummaryCard({ summary }: { summary: string }) {
  return (
    <div className={styles.summaryCard} aria-live="polite">
      <div className={styles.summaryCardHeader}>
        <DocumentIcon />
        Summary
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
