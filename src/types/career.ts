export type CareerApplicationType = 'internship' | 'job';

export type CareerApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'rejected';

export interface CareerApplicationInput {
  type: CareerApplicationType;
  fullName: string;
  email: string;
  phone: string;
  currentInstitution: string; // College / University / Organization
  qualification: string;      // Highest qualification / Year of study
  areaOfInterest: string;     // Legal Research, Public Policy, etc.
  coverLetter?: string;
  cvFileName?: string;
  cvFileSize?: number;        // bytes (optional)
  cvDataUrl?: string;         // base64 data URL (optional)
}

export interface CareerApplicationRecord extends CareerApplicationInput {
  id: string;
  applicationCode: string;    // e.g. BC-CAR-2026-1042
  status: CareerApplicationStatus;
  submittedAt: string;
  updatedAt: string;
}

export const MAX_CV_SIZE_BYTES = 1024 * 1024; // 1 MB strictly per specification
