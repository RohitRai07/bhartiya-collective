export type EventType = 'Symposium' | 'Roundtable' | 'Public Lecture' | 'Panel Discussion' | 'Workshop' | 'Live Stream' | 'Webinar Live' | (string & {});
export type EventMode = 'In-Person' | 'Online Webinar' | 'Hybrid';

export type LiveStreamStatus = 'upcoming' | 'live' | 'ended';

export interface EventSpeaker {
  name: string;
  affiliation: string;
  role: string;
  avatarUrl?: string;
}

export type ContentStatus = 'published' | 'draft';

export interface EventItem {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  location: string;
  mode: EventMode;
  description: string;
  speakers: EventSpeaker[];
  registrationOpen: boolean;
  seatsLeft?: number;
  bannerImage?: string;
  status?: ContentStatus;

  // YouTube Live Event additions
  isLive?: boolean;
  youtubeUrl?: string;
  youtubeId?: string;
  liveStatus?: LiveStreamStatus;
  customThumbnailUrl?: string;
}

export interface LiveEventInput {
  title: string;
  description: string;
  youtubeUrl: string;
  date: string;
  time: string;
  location?: string;
  thumbnailUrl?: string;
  liveStatus?: LiveStreamStatus;
  status?: ContentStatus;
  speakers?: EventSpeaker[];
  registrationOpen?: boolean;
}
