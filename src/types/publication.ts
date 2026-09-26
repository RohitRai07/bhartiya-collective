export type PublicationCategory = 
  | 'Monograph' 
  | 'Policy Paper' 
  | 'Occasional Paper' 
  | 'Journal Article' 
  | 'Civilizational Brief';

export type ContentStatus = 'published' | 'draft' | 'archived';

export interface Publication {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  abstract: string;
  category: PublicationCategory;
  publishedDate: string;
  pages: number;
  isbn?: string;
  doi?: string;
  downloadUrl?: string;
  imageUrl?: string;
  tags: string[];
  featured?: boolean;
  status?: ContentStatus;
}
