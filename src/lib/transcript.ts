import { YouTubeTranscriptApi, WebshareProxyConfig, FetchedTranscript, FetchedTranscriptSnippet } from 'youtube-transcript-api-js';
import { PREFERRED_LANGUAGE } from '@/constants';
import type { VideoMetadata } from '@/types';

const proxyConfig =
  process.env.WEBSHARE_PROXY_USERNAME && process.env.WEBSHARE_PROXY_PASSWORD
    ? new WebshareProxyConfig(
        process.env.WEBSHARE_PROXY_USERNAME,
        process.env.WEBSHARE_PROXY_PASSWORD,
      )
    : undefined;

// Skip proxy for local development — residential proxies often get blocked by YouTube
const useProxy = proxyConfig && process.env.NODE_ENV === 'production';
const api = new YouTubeTranscriptApi(useProxy ? proxyConfig : undefined);

const CHUNK_INTERVAL_SECONDS = 30;

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTranscriptWithTimestamps(snippets: FetchedTranscriptSnippet[]): string {
  if (snippets.length === 0) return '';

  const chunks: string[] = [];
  let currentTexts: string[] = [];
  let chunkStart = snippets[0].start;

  for (const snippet of snippets) {
    if (snippet.start - chunkStart >= CHUNK_INTERVAL_SECONDS && currentTexts.length > 0) {
      chunks.push(`[${formatTimestamp(chunkStart)}] ${currentTexts.join(' ')}`);
      currentTexts = [];
      chunkStart = snippet.start;
    }
    currentTexts.push(snippet.text.trim());
  }

  if (currentTexts.length > 0) {
    chunks.push(`[${formatTimestamp(chunkStart)}] ${currentTexts.join(' ')}`);
  }

  return chunks.join('\n');
}

export async function fetchTranscript(videoId: string): Promise<{
  text: string;
  language: string;
  isGenerated: boolean;
}> {
  const transcriptList = await api.list(videoId);
  const allTranscripts = transcriptList.getAllTranscripts();

  if (allTranscripts.length === 0) {
    throw new Error('No transcripts available for this video');
  }

  // Prefer manual over auto-generated, and English over other languages
  const manual = allTranscripts.filter(t => !t.isGenerated);
  const generated = allTranscripts.filter(t => t.isGenerated);
  const ranked = [...manual, ...generated];

  // 1. Look for a direct English transcript (manual first, then generated)
  const englishDirect = ranked.find(t => t.languageCode === PREFERRED_LANGUAGE);
  if (englishDirect) {
    const fetched = await englishDirect.fetch();
    return formatResult(fetched);
  }

  // 2. No direct English — pick the best transcript and translate to English
  const translatable = ranked.find(t => t.isTranslatable);
  if (translatable) {
    const fetched = await translatable.translate(PREFERRED_LANGUAGE).fetch();
    return formatResult(fetched);
  }

  // 3. Nothing translatable — fetch whatever is available as-is
  const fetched = await ranked[0].fetch();
  return formatResult(fetched);
}

function formatResult(fetched: FetchedTranscript) {
  const text = formatTranscriptWithTimestamps(fetched.snippets);

  if (!text || text.trim().length === 0) {
    throw new Error('Transcript is empty');
  }

  return {
    text,
    language: fetched.language,
    isGenerated: fetched.isGenerated,
  };
}

const OEMBED_URL = 'https://www.youtube.com/oembed';

export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
  try {
    const url = `${OEMBED_URL}?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: videoId,
      title: data.title ?? '',
      author: data.author_name ?? '',
      lengthSeconds: 0,
      viewCount: 0,
    };
  } catch {
    return null;
  }
}
