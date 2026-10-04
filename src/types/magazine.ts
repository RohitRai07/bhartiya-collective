export interface MagazineIssue {
  id: string;
  title: string;
  issueNumber: string;        // e.g. "Volume I • Issue 1 (Quarterly)"
  theme: string;              // e.g. "Civilizational Jurisprudence & National Reconstruction"
  publicationDate: string;
  price: number;              // strictly ₹100 per specification
  pageCount: number;
  coverImageUrl: string;
  fileUrl?: string;
  originalFileName?: string;
  originalFileType?: 'pdf' | 'docx' | 'doc';
  fileSizeBytes?: number;
  description: string;
  editorialLead: string;
  tableOfContents: string[];
  downloadCount: number;
  status?: 'published' | 'draft';
}

export interface MagazineIssueInput {
  title: string;
  issueNumber: string;
  theme: string;
  publicationDate: string;
  price?: number;             // Default 100
  pageCount: number;
  coverImageUrl: string;
  fileUrl?: string;
  originalFileName?: string;
  originalFileType?: 'pdf' | 'docx' | 'doc';
  fileSizeBytes?: number;
  description: string;
  editorialLead: string;
  tableOfContents: string[];
  status?: 'published' | 'draft';
}
