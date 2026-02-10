import { YouTubeTranscriptApi, TextFormatter, FetchedTranscript } from 'youtube-transcript-api-js';
import { PREFERRED_LANGUAGE } from '@/constants';

const api = new YouTubeTranscriptApi();
const formatter = new TextFormatter();

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
  const text = formatter.formatTranscript(fetched);

  if (!text || text.trim().length === 0) {
    throw new Error('Transcript is empty');
  }

  return {
    text,
    language: fetched.language,
    isGenerated: fetched.isGenerated,
  };
}
