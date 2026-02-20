import { NextRequest } from 'next/server';
import type { SummaryLength, VideoMetadata } from '@/types';
import { extractVideoId } from '@/utils/video';
import { fetchTranscript, fetchVideoMetadata } from '@/lib/transcript';
import { getAnthropicClient } from '@/lib/claude';
import { getSummarizePrompt } from '@/prompts/summarize';
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  MAX_TRANSCRIPT_LENGTH,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  SUMMARY_LENGTH_CONFIG,
  DEFAULT_SUMMARY_LENGTH,
  VALID_LENGTHS,
  CACHE_TTL_MS,
  CACHE_MAX_SIZE,
} from '@/constants';

export const runtime = 'nodejs';

const TRANSCRIPT_ERROR_MAP: Record<string, { message: string; status: number }> = {
  InvalidVideoId:  { message: 'Invalid video ID format.', status: 400 },
  VideoUnavailable: { message: 'This video is unavailable or private.', status: 404 },
  TranscriptsDisabled: { message: 'Transcripts/subtitles are disabled for this video.', status: 404 },
  NoTranscriptFound: { message: 'No transcript found for this video.', status: 404 },
  IpBlocked: { message: 'YouTube is blocking requests from this server. This is a known issue with cloud-hosted services.', status: 503 },
  RequestBlocked: { message: 'YouTube is blocking requests from this server. This is a known issue with cloud-hosted services.', status: 503 },
  RateLimitExceeded: { message: 'YouTube rate limit exceeded. Please try again later.', status: 429 },
  AgeRestricted: { message: 'This video is age-restricted and cannot be summarized.', status: 403 },
  VideoUnplayable: { message: 'This video is unplayable and cannot be summarized.', status: 404 },
};

const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

interface CacheEntry {
  metadata: VideoMetadata | null;
  summary: string;
  createdAt: number;
}

const summaryCache = new Map<string, CacheEntry>();

function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of summaryCache) {
    if (now - entry.createdAt > CACHE_TTL_MS) {
      summaryCache.delete(key);
    }
  }
  // If still over limit after TTL eviction, remove oldest entries
  if (summaryCache.size > CACHE_MAX_SIZE) {
    const sorted = [...summaryCache.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toRemove = sorted.slice(0, summaryCache.size - CACHE_MAX_SIZE);
    for (const [key] of toRemove) {
      summaryCache.delete(key);
    }
  }
}

function parseSummaryLength(raw: unknown): SummaryLength {
  if (typeof raw === 'string' && VALID_LENGTHS.includes(raw as SummaryLength)) {
    return raw as SummaryLength;
  }
  return DEFAULT_SUMMARY_LENGTH;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (isRateLimited(ip)) {
    return Response.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'Service is not configured. Please contact the administrator.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const rawInput = body.videoId;
    const length = parseSummaryLength(body.length);

    if (!rawInput || typeof rawInput !== 'string') {
      return Response.json(
        { error: 'Missing or invalid videoId parameter' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(rawInput);
    if (!videoId) {
      return Response.json(
        { error: 'Invalid YouTube video ID or URL. Please provide a valid video ID or YouTube URL.' },
        { status: 400 }
      );
    }

    // Check cache before fetching transcript or calling Claude
    const cacheKey = `${videoId}:${length}`;
    const cached = summaryCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      // Streaming protocol: first newline-delimited line is JSON metadata,
      // remaining bytes are the summary text (parsed by useSummarize hook)
      const encoder = new TextEncoder();
      const metadataLine = JSON.stringify(cached.metadata ?? {}) + '\n';
      const responseBody = encoder.encode(metadataLine + cached.summary);
      return new Response(responseBody, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    const [transcriptResult, metadata] = await Promise.all([
      fetchTranscript(videoId),
      fetchVideoMetadata(videoId),
    ]);
    const { text: transcriptText } = transcriptResult;

    if (transcriptText.length > MAX_TRANSCRIPT_LENGTH) {
      return Response.json(
        { error: `Transcript is too long (${Math.round(transcriptText.length / 1000)}k chars). Maximum supported length is ${MAX_TRANSCRIPT_LENGTH / 1000}k characters.` },
        { status: 413 }
      );
    }

    const temperature = parseFloat(process.env.ANTHROPIC_TEMPERATURE || String(DEFAULT_TEMPERATURE));

    const response = await getAnthropicClient().messages.create({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: SUMMARY_LENGTH_CONFIG[length].maxTokens,
      temperature: isNaN(temperature) ? DEFAULT_TEMPERATURE : Math.min(1, Math.max(0, temperature)),
      system: getSummarizePrompt(length),
      messages: [
        {
          role: 'user',
          content: `Please summarize the following YouTube video transcript:\n\n${transcriptText}`,
        },
      ],
      stream: true,
    });

    // Streaming protocol: first newline-delimited line is JSON metadata,
    // remaining bytes are the streamed LLM summary text (parsed by useSummarize hook)
    const encoder = new TextEncoder();
    const metadataLine = JSON.stringify(metadata ?? {}) + '\n';
    const summaryChunks: string[] = [];
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(metadataLine));
          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              summaryChunks.push(event.delta.text);
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          // Store completed summary in cache
          summaryCache.set(cacheKey, {
            metadata,
            summary: summaryChunks.join(''),
            createdAt: Date.now(),
          });
          cleanupCache();
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.name : '';
    const knownError = TRANSCRIPT_ERROR_MAP[errorName];

    if (knownError) {
      return Response.json({ error: knownError.message }, { status: knownError.status });
    }

    const errorStr = String(error).toLowerCase();
    if (errorStr.includes('not a bot') || errorStr.includes('sign in')) {
      return Response.json(
        { error: 'YouTube is requiring bot verification. Please try again in a few minutes, or configure a proxy.' },
        { status: 503 }
      );
    }

    console.error('Summarize API error:', error);
    return Response.json({ error: 'An internal error occurred. Please try again later.' }, { status: 500 });
  }
}
