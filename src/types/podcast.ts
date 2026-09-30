export interface PodcastEpisode {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  speaker: string;
  speakerRole?: string;
  topic: string;
  duration: string;
  date: string;
  description: string;
  featured?: boolean;
}

export interface PodcastInput {
  title: string;
  youtubeUrl: string;
  speaker: string;
  speakerRole?: string;
  topic: string;
  duration?: string;
  date?: string;
  description: string;
  customThumbnailUrl?: string;
  featured?: boolean;
}
