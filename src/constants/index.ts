import type { SummaryLength } from '@/types';

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 10;

// Transcript
export const MAX_TRANSCRIPT_LENGTH = 100_000;
export const PREFERRED_LANGUAGE = 'en';

// Anthropic defaults
export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
export const DEFAULT_TEMPERATURE = 0.7;

// Summary length configuration
export const SUMMARY_LENGTH_CONFIG: Record<SummaryLength, { maxTokens: number; label: string; description: string }> = {
  short:  { maxTokens: 1024,  label: 'Short',  description: 'Key takeaways' },
  medium: { maxTokens: 2048,  label: 'Medium', description: 'Balanced summary' },
  long:   { maxTokens: 4096,  label: 'Long',   description: 'Full detail' },
};

export const LENGTH_OPTIONS = (Object.entries(SUMMARY_LENGTH_CONFIG) as [SummaryLength, typeof SUMMARY_LENGTH_CONFIG[SummaryLength]][]).map(
  ([value, config]) => ({ value, label: config.label, description: config.description })
);

export const DEFAULT_SUMMARY_LENGTH: SummaryLength = 'medium';
export const VALID_LENGTHS: SummaryLength[] = ['short', 'medium', 'long'];

// Validation messages
export const VALIDATION_MESSAGES = {
  INVALID_YOUTUBE_URL: 'Please enter a valid YouTube URL or video ID.',
} as const;

// UI
export const COPY_FEEDBACK_DURATION_MS = 2000;
export const DOWNLOAD_FILENAME_PREFIX = 'yt-summary';

// API
export const API_SUMMARIZE_ENDPOINT = '/api/summarize';

// YouTube
export const VIDEO_ID_LENGTH = 11;
export const VIDEO_ID_REGEX = new RegExp(`^[a-zA-Z0-9_-]{${VIDEO_ID_LENGTH}}$`);
