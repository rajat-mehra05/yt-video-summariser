export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }

    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1);
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    if (url.hostname.includes('youtube.com') && url.pathname.startsWith('/embed/')) {
      const id = url.pathname.split('/embed/')[1]?.split('/')[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
  } catch {
    // Not a valid URL
  }

  return null;
}
