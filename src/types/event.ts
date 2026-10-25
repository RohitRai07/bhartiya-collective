export type EventType = 'Symposium' | 'Roundtable' | 'Public Lecture' | 'Panel Discussion' | 'Workshop' | 'Live Stream' | 'Webinar Live' | (string & {});
export type EventMode = 'In-Person' | 'Online Webinar' | 'Hybrid';

export type LiveStreamStatus = 'upcoming' | 'live' | 'ended';

export interface EventSpeaker {
  name: string;
  affiliation: string;
  role: string;
  avatarUrl?: string;
}

export const STANDARD_SPEAKER_ROLES = [
  'Keynote Speaker',
  'Plenary Panelist',
  'Featured Panelist',
  'Speaker / Panelist',
  'Session Chair & Moderator',
  'Distinguished Jurist',
  'Constitutional Scholar',
  'Research Fellow & Discussant',
  'Guest Speaker',
  'Guest of Honour',
  'Special Address',
  'Broadcasting Host',
];

export const COMMON_AFFILIATIONS = [
  'Supreme Court of India',
  'High Court of Delhi',
  'National Law School of India University (NLSIU)',
  'The Bharat Collective Advisory Council',
  'Faculty of Law, University of Delhi',
  'Indian Institute of Public Administration (IIPA)',
  'NALSAR University of Law, Hyderabad',
  'Centre for Policy Studies & Legal Research',
  'National Judicial Academy',
  'Independent Constitutional Jurist',
];

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
