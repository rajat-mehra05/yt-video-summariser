import { NextRequest } from 'next/server';
import { extractVideoId } from '@/utils/video';
import { fetchTranscript } from '@/lib/transcript';
import { getAnthropicClient } from '@/lib/claude';
import { SUMMARIZE_SYSTEM_PROMPT } from '@/prompts/summarize';
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  MAX_TRANSCRIPT_LENGTH,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  MAX_TOKENS,
} from '@/constants';

export const runtime = 'nodejs';

const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
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

    const { text: transcriptText } = await fetchTranscript(videoId);

    if (transcriptText.length > MAX_TRANSCRIPT_LENGTH) {
      return Response.json(
        { error: `Transcript is too long (${Math.round(transcriptText.length / 1000)}k chars). Maximum supported length is ${MAX_TRANSCRIPT_LENGTH / 1000}k characters.` },
        { status: 413 }
      );
    }

    const temperature = parseFloat(process.env.ANTHROPIC_TEMPERATURE || String(DEFAULT_TEMPERATURE));

    const response = await getAnthropicClient().messages.create({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: isNaN(temperature) ? DEFAULT_TEMPERATURE : Math.min(1, Math.max(0, temperature)),
      system: SUMMARIZE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please summarize the following YouTube video transcript:\n\n${transcriptText}`,
        },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
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
    const errorName = error instanceof Error ? error.constructor.name : '';

    if (errorName === 'InvalidVideoId') {
      return Response.json({ error: 'Invalid video ID format.' }, { status: 400 });
    }
    if (errorName === 'VideoUnavailable') {
      return Response.json({ error: 'This video is unavailable or private.' }, { status: 404 });
    }
    if (errorName === 'TranscriptsDisabled') {
      return Response.json({ error: 'Transcripts/subtitles are disabled for this video.' }, { status: 404 });
    }
    if (errorName === 'NoTranscriptFound') {
      return Response.json({ error: 'No transcript found for this video.' }, { status: 404 });
    }

    console.error('Summarize API error:', error);
    return Response.json({ error: 'An internal error occurred. Please try again later.' }, { status: 500 });
  }
}
