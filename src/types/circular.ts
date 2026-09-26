/**
 * Circular and Legal Materials Types
 * 
 * Supports Indian Constitutional frameworks, statutory enactments, administrative circulars,
 * legal guidelines, gazettes, and model legislative frameworks.
 */

export type CircularCategory = 
  | 'constitution'     // Constitutional Frameworks & Amendments
  | 'acts_statutes'    // Central Acts & Statutory Codes
  | 'circulars_rules'  // Administrative Circulars & Rules
  | 'guidelines'       // Legal Guidelines & Advisories
  | 'model_bills';     // Model Legislative Bills & Civilizational Frameworks

export type CircularStatus = 'published' | 'draft' | 'archived';

export interface Circular {
  id: string;
  title: string;
  shortTitle: string;
  circularNumber: string; // e.g. "Act No. 45 of 2023", "Gazette Ext. Part II-Sec 1"
  category: CircularCategory;
  issuingAuthority: string; // e.g. "Ministry of Law & Justice, Govt. of India", "Supreme Court of India"
  releaseDate: string;
  effectiveDate?: string;
  summary: string;
  keyProvisions: string[];
  pdfUrl?: string; // External web link or internal link
  pdfDataUrl?: string; // Base64 data URL from drag-and-drop file upload
  fileName?: string;
  fileSize?: string;
  pageCount?: number;
  language: 'English' | 'Hindi' | 'Bilingual';
  tags: string[];
  important?: boolean;
  status: CircularStatus;
  downloadsCount?: number;
  contentPreview?: string; // Rich legal text or bare act excerpt for in-modal preview
}

export interface CircularCategoryOption {
  id: CircularCategory | 'all';
  label: string;
  description: string;
  count?: number;
}
