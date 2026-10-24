/**
 * YouTube Utility Functions
 * Supports standard watch URLs, short URLs, embed URLs, and YouTube Live URLs.
 */

export type LiveStreamStatus = 'upcoming' | 'live' | 'ended';

/**
 * Extract an 11-character YouTube video / stream ID from various URL formats
 * Handles:
 * - https://www.youtube.com/live/<id>
 * - https://youtube.com/live/<id>
 * - https://www.youtube.com/watch?v=<id>
 * - https://youtu.be/<id>
 * - https://www.youtube.com/embed/<id>
 * - Raw 11-character ID
 */
export function extractYouTubeId(url: string): string {
  if (!url) return '';
  const cleanUrl = url.trim();

  // Match youtube.com/live/<id>
  const liveMatch = cleanUrl.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch && liveMatch[1]) return liveMatch[1];

  // Match youtu.be/<id>
  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // Match youtube.com/watch?v=<id>
  const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // Match youtube.com/embed/<id>
  const embedMatch = cleanUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // Match youtube.com/v/<id>
  const vMatch = cleanUrl.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
  if (vMatch && vMatch[1]) return vMatch[1];

  // Match raw 11 char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;

  return '';
}

/**
 * Return high quality YouTube thumbnail URL for an ID
 */
export function getYouTubeThumbnail(youtubeId: string): string {
  if (!youtubeId) return '';
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

/**
 * Return embed player URL with safe parameters
 */
export function getYouTubeEmbedUrl(youtubeId: string, autoplay: boolean = true): string {
  if (!youtubeId) return '';
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&rel=0`;
}

/**
 * Return direct watch URL on YouTube
 */
export function getYouTubeWatchUrl(youtubeId: string): string {
  if (!youtubeId) return '';
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/**
 * Dynamically compute live event status based on explicit setting or scheduled date/time
 */
export function computeLiveEventStatus(event: {
  date?: string;
  time?: string;
  liveStatus?: LiveStreamStatus;
}): LiveStreamStatus {
  if (event.liveStatus && ['upcoming', 'live', 'ended'].includes(event.liveStatus)) {
    return event.liveStatus;
  }

  if (!event.date) return 'upcoming';

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const eventDateStr = event.date.trim();

    if (eventDateStr === todayStr) {
      return 'live';
    } else if (eventDateStr < todayStr) {
      return 'ended';
    } else {
      return 'upcoming';
    }
  } catch {
    return 'upcoming';
  }
}
