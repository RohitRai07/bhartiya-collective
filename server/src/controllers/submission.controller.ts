import { Request, Response } from 'express';
import { 
  validateAbstractSubmissionEmail, 
  validateIndianMobile 
} from '../middleware/validation.middleware';

export interface BackendSubmissionRecord {
  id: string;
  submissionCode: string;
  candidateName: string;
  authorName: string;
  authorEmail: string;
  phone: string;
  mobileNumber: string;
  organization: string;
  affiliation: string;
  qualification: string;
  paperTitle: string;
  abstract: string;
  status: 'submitted' | 'under_peer_review' | 'accepted' | 'declined';
  submittedAt: string;
}

// In-memory submissions store for backend
const storedSubmissions: BackendSubmissionRecord[] = [];

/**
 * Handle Call for Papers / Abstract Submissions
 * Enforces strict approved email domain whitelist, 10-digit Indian mobile validation,
 * and 300-500 words extended abstract length.
 */
export const submitPaper = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawEmail = (req.body?.authorEmail || req.body?.email || '').trim();
    const candidateName = (req.body?.candidateName || req.body?.authorName || '').trim();
    const phone = (req.body?.mobileNumber || req.body?.phone || '').trim();
    const organization = (req.body?.organization || req.body?.affiliation || '').trim();
    const qualification = (req.body?.qualification || '').trim();
    const abstract = (req.body?.abstract || '').trim();
    const paperTitle = (req.body?.paperTitle || '').trim();

    // 1. Candidate Full Name *
    if (!candidateName || candidateName.length < 2) {
      res.status(400).json({
        success: false,
        error: 'Please enter your full name.',
        code: 'INVALID_NAME',
      });
      return;
    }

    // 2. Email Address * (Strict Whitelist: only approved providers)
    const emailVal = validateAbstractSubmissionEmail(rawEmail);
    if (!emailVal.isValid) {
      res.status(400).json({
        success: false,
        error: emailVal.error || 'Please enter a valid email address.',
        code: 'INVALID_EMAIL',
      });
      return;
    }

    // 3. Mobile Number (India) * (10-digit starting with 6-9)
    const phoneVal = validateIndianMobile(phone);
    if (!phoneVal.isValid) {
      res.status(400).json({
        success: false,
        error: phoneVal.error || 'Please enter a valid 10-digit Indian mobile number.',
        code: 'INVALID_PHONE',
      });
      return;
    }

    // 4. Organization *
    if (!organization) {
      res.status(400).json({
        success: false,
        error: 'Please enter your college, university, or organization.',
        code: 'INVALID_ORGANIZATION',
      });
      return;
    }

    // 5. Qualification *
    if (!qualification) {
      res.status(400).json({
        success: false,
        error: 'Please enter your qualification or current year of study.',
        code: 'INVALID_QUALIFICATION',
      });
      return;
    }

    // 6. Extended Abstract (300-500 words) *
    const words = abstract.split(/\s+/).filter(Boolean).length;
    if (words < 300 || words > 500) {
      res.status(400).json({
        success: false,
        error: words < 300 
          ? `Extended abstract is too short (${words} words). Minimum requirement is 300 words.`
          : `Extended abstract exceeds limit (${words} words). Maximum limit is 500 words.`,
        code: 'INVALID_ABSTRACT_LENGTH',
      });
      return;
    }

    const submissionCode = `BC-CFP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: BackendSubmissionRecord = {
      id: `cfp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      submissionCode,
      candidateName,
      authorName: candidateName,
      authorEmail: emailVal.formatted,
      phone: phoneVal.formatted,
      mobileNumber: phoneVal.formatted,
      organization,
      affiliation: organization,
      qualification,
      paperTitle: paperTitle || `Scholarly Abstract - ${candidateName}`,
      abstract,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    storedSubmissions.unshift(newRecord);

    res.status(201).json({
      success: true,
      data: newRecord,
      message: 'Abstract submitted successfully.',
    });
  } catch (error: any) {
    console.error('Submit Paper Controller Error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while submitting your paper abstract.',
    });
  }
};

export const getSubmissions = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: storedSubmissions,
  });
};
