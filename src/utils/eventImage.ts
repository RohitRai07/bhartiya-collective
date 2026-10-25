/**
 * Utility to resolve event poster / banner image paths,
 * supporting data URLs (base64 uploads), remote URLs, and base-path assets.
 */
export const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80';

export const resolveEventImage = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const clean = url.replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${clean}`;
};
