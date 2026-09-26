import { ContentStatus } from './publication';

export interface ResearchDomain {
  id: string;
  name: string;
  sanskritName: string;
  slug: string;
  description: string;
  leadFellow: string;
  keyThemes: string[];
  activeProjectsCount: number;
  publishedPapersCount: number;
  iconName: string;
  status?: ContentStatus;
}

export interface ResearchProject {
  id: string;
  domainId: string;
  title: string;
  description: string;
  principalInvestigator: string;
  status: 'active' | 'completed' | 'in_review';
  timeline: string;
}
