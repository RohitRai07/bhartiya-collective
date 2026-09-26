import { ContentStatus } from './publication';

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorTitle: string;
  category: 'Discourse' | 'Press Release' | 'Announcement' | 'Perspective';
  publishedDate: string;
  readTime: string;
  imageUrl?: string;
  status?: ContentStatus;
}
