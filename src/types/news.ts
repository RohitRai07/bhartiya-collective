import { ContentStatus } from './publication';

export type NewsCategory = 'Discourse' | 'Press Release' | 'Announcement' | 'Perspective' | (string & {});

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorTitle: string;
  category: NewsCategory;
  publishedDate: string;
  readTime: string;
  imageUrl?: string;
  status?: ContentStatus;
}
