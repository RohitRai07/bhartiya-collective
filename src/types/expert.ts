export type ExpertRole = 'advisory_council' | 'senior_fellow' | 'visiting_fellow';

export interface ScholarExpert {
  id: string;
  name: string;
  designation: string;
  institution: string;
  biography: string;
  focusAreas: string[];
  photoUrl: string;
  publicationsCount: number;
  councilRole?: ExpertRole;
  status?: 'active' | 'archived';
}
