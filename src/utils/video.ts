import { VIDEO_ID_REGEX } from '@/constants';

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();

  if (VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
      const v = url.searchParams.get('v');
      if (v && VIDEO_ID_REGEX.test(v)) return v;
    }

    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1);
      if (VIDEO_ID_REGEX.test(id)) return id;
    }

    if (url.hostname.includes('youtube.com') && url.pathname.startsWith('/embed/')) {
      const id = url.pathname.split('/embed/')[1]?.split('/')[0];
      if (id && VIDEO_ID_REGEX.test(id)) return id;
    }
  } catch {
    // Not a valid URL
  }

  return null;
}
