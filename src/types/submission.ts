export type PaperSubmissionStatus = 'submitted' | 'under_peer_review' | 'accepted' | 'revision_requested' | 'rejected';

export interface PaperSubmissionInput {
  authorName: string;
  authorEmail: string;
  affiliation: string;
  paperTitle: string;
  abstract: string;
  researchDomainId: string;
  keywords: string[];
  track?: string;
  fileAttachmentId?: string;
  declarationAgreed: boolean;
}

export interface PaperSubmissionRecord extends PaperSubmissionInput {
  id: string;
  submissionCode: string;
  status: PaperSubmissionStatus;
  submittedAt: string;
}
