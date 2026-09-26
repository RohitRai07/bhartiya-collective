import { ContentStatus } from './publication';

export type EventType = 'Symposium' | 'Roundtable' | 'Public Lecture' | 'Colloquium' | 'Workshop' | (string & {});
export type EventMode = 'In-Person' | 'Online Webinar' | 'Hybrid';

export interface EventSpeaker {
  name: string;
  affiliation: string;
  role: string;
  avatarUrl?: string;
}

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
}
