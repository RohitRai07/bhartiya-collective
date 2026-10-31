/**
 * YouTube Utility Functions
 * Supports standard watch URLs, short URLs, embed URLs, and YouTube Live URLs.
 */

import { calculateEventTimingWindow } from './timeValidation';

export type LiveStreamStatus = 'upcoming' | 'live' | 'ended';

/**
 * Extract an 11-character YouTube video / stream ID from various URL formats
 * Handles:
 * - https://www.youtube.com/live/<id>
 * - https://youtube.com/live/<id>?si=...
 * - https://m.youtube.com/live/<id>
 * - https://www.youtube.com/watch?v=<id>
 * - https://www.youtube.com/watch?feature=shared&v=<id>
 * - https://youtu.be/<id>
 * - https://www.youtube.com/embed/<id>
 * - https://www.youtube.com/shorts/<id>
 * - https://www.youtube.com/v/<id>
 * - Raw 11-character ID
 */
export function extractYouTubeId(url: string): string {
  if (!url) return '';
  const cleanUrl = url.trim();

  // Match youtube.com/live/<id> (handles www., m., or bare domain, plus query params)
  const liveMatch = cleanUrl.match(/(?:youtube\.com|youtube-nocookie\.com)\/live\/([a-zA-Z0-9_-]{11})/i);
  if (liveMatch && liveMatch[1]) return liveMatch[1];

  // Match youtu.be/<id>
  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // Match youtube.com/watch?v=<id> or with other params e.g. ?feature=share&v=<id>
  const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // Match youtube.com/embed/<id>
  const embedMatch = cleanUrl.match(/(?:youtube\.com|youtube-nocookie\.com)\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // Match youtube.com/shorts/<id>
  const shortsMatch = cleanUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // Match youtube.com/v/<id>
  const vMatch = cleanUrl.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i);
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
 * Return embed player URL with standard parameters for live streams and videos
 * Uses enablejsapi=1, playsinline=1, rel=0, and modestbranding=1.
 * Omits origin query parameter to avoid YouTube player rejecting IP origins (e.g. 127.0.0.1:3000).
 */
export function getYouTubeEmbedUrl(youtubeId: string, autoplay: boolean = true): string {
  if (!youtubeId) return '';

  // Use standard www.youtube.com embed with playsinline and JS API enabled
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&playsinline=1&rel=0&enablejsapi=1&modestbranding=1`;
}

/**
 * Return direct watch URL on YouTube
 */
export function getYouTubeWatchUrl(youtubeId: string): string {
  if (!youtubeId) return '';
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/**
 * Dynamically compute live event status based on explicit setting or scheduled date/time.
 * 
 * Timing rules:
 * - Before start time: 'upcoming' (Scheduled Stream)
 * - Start time breach up to (End time + 30 minutes grace): 'live' (Ongoing / Live Now)
 * - After (End time + 30 minutes grace): 'ended' (Stream Ended / Replay)
 */
export function computeLiveEventStatus(
  event: {
    date?: string;
    time?: string;
    liveStatus?: LiveStreamStatus;
  },
  now: Date = new Date()
): LiveStreamStatus {
  // If explicitly called with no date and no time (unit tests or explicit call without event schedule)
  if (!event.date && !event.time) {
    if (event.liveStatus && ['upcoming', 'live', 'ended'].includes(event.liveStatus)) {
      return event.liveStatus;
    }
    return 'upcoming';
  }

  // Calculate dynamic status using scheduled start, end, and +30 min grace window
  return calculateEventTimingWindow(event, now).status;
}
