import { NextRequest } from 'next/server';
import { extractVideoId } from '@/lib/utils';
import { fetchTranscript } from '@/lib/transcript';
import { anthropic, SYSTEM_PROMPT } from '@/lib/claude';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'Anthropic API key is not configured. Set ANTHROPIC_API_KEY in .env.local.' },
        { status: 500 }
      );
    }

    const { text: transcriptText } = await fetchTranscript(videoId);

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.5'),
      system: SYSTEM_PROMPT,
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
      },
    });
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.constructor.name : '';
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

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
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
