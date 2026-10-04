export type TeamPublishStatus = 'published' | 'draft';

export interface NationalTeamMember {
  id: string;
  name: string;
  role: string;
  affiliation: string;
  desc: string;
  photoUrl?: string;
  status: TeamPublishStatus;
  order?: number;
}

export interface StateChapter {
  id: string;
  state: string;
  convener: string;
  city: string;
  focus: string;
  status: TeamPublishStatus;
  order?: number;
}
