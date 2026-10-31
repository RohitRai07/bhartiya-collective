export type PaperSubmissionStatus = 'submitted' | 'under_peer_review' | 'under_review' | 'accepted' | 'revision_requested' | 'rejected' | (string & {});

export interface PaperSubmissionInput {
  candidateName?: string;
  authorName: string;
  authorEmail: string;
  mobileNumber?: string;
  phone?: string;
  organization?: string;
  affiliation: string;
  qualification?: string;
  currentYearOfStudy?: string;
  paperTitle?: string;
  abstract: string;
  researchDomainId?: string;
  keywords?: string[];
  track?: string;
  fileAttachmentId?: string;
  declarationAgreed?: boolean;
}

export interface PaperSubmissionRecord extends PaperSubmissionInput {
  id: string;
  submissionCode: string;
  status: PaperSubmissionStatus;
  submittedAt: string;
}
