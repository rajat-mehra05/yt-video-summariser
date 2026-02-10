// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 10;

// Transcript
export const MAX_TRANSCRIPT_LENGTH = 100_000;
export const PREFERRED_LANGUAGE = 'en';

// Anthropic defaults
export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
export const DEFAULT_TEMPERATURE = 0.7;
export const MAX_TOKENS = 4096;

// API
export const API_SUMMARIZE_ENDPOINT = '/api/summarize';

// YouTube
export const VIDEO_ID_LENGTH = 11;
export const VIDEO_ID_REGEX = new RegExp(`^[a-zA-Z0-9_-]{${VIDEO_ID_LENGTH}}$`);
