import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';
import { submissionService } from '../services/submissionService';
import { featureConfig } from '../config/featureConfig';
import { 
  validateEmailAddress, 
  validateIndianMobile, 
  validateExtendedAbstract, 
  countWords 
} from '../services/contactValidation';
import { Send, CheckCircle2, Loader2, FileText, AlertCircle } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [isCfpActive, setIsCfpActive] = useState(featureConfig.isEnabled('callForPapers'));

  useEffect(() => {
    const handleUpdate = () => setIsCfpActive(featureConfig.isEnabled('callForPapers'));
    window.addEventListener('bhartiya:feature-change', handleUpdate);
    return () => window.removeEventListener('bhartiya:feature-change', handleUpdate);
  }, []);

  // Call for Papers Application Form State (6 Mandatory Fields)
  const [candidateName, setCandidateName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [qualification, setQualification] = useState('');
  const [abstract, setAbstract] = useState('');

  // Field-specific validation errors
  const [errors, setErrors] = useState<{
    candidateName?: string;
    email?: string;
    mobileNumber?: string;
    organization?: string;
    qualification?: string;
    abstract?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessCode, setSubmissionSuccessCode] = useState<string | null>(null);

  const wordCount = countWords(abstract);

  // Mailto link for office submission
  const mailtoSubject = encodeURIComponent('Call for Papers - Bharat Collective Foundation');
  const mailtoHref = `mailto:${siteConfig.contact.officeEmail}?subject=${mailtoSubject}`;

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // 1. Candidate Full Name *
    if (!candidateName.trim()) {
      newErrors.candidateName = 'Please enter your full name.';
    } else if (candidateName.trim().length < 2) {
      newErrors.candidateName = 'Full name must be at least 2 characters.';
    }

    // 2. Email Address *
    const emailVal = validateEmailAddress(email);
    if (!emailVal.isValid) {
      newErrors.email = emailVal.error || 'Please enter a valid email address.';
    }

    // 3. Mobile Number (India) *
    const phoneVal = validateIndianMobile(mobileNumber);
    if (!phoneVal.isValid) {
      newErrors.mobileNumber = phoneVal.error || 'Please enter a valid 10-digit Indian mobile number.';
    }

    // 4. College / University / Organization *
    if (!organization.trim()) {
      newErrors.organization = 'Please enter your college, university, or organization.';
    }

    // 5. Qualification / Current Year of Study *
    if (!qualification.trim()) {
      newErrors.qualification = 'Please enter your qualification or current year of study.';
    }

    // 6. Extended Abstract (300-500 words) *
    const abstractVal = validateExtendedAbstract(abstract);
    if (!abstractVal.isValid) {
      newErrors.abstract = abstractVal.error || 'Please provide an extended abstract (300–500 words).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCfpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const record = await submissionService.submitPaper({
        candidateName: candidateName.trim(),
        authorName: candidateName.trim(),
        authorEmail: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        phone: mobileNumber.trim(),
        organization: organization.trim(),
        affiliation: organization.trim(),
        qualification: qualification.trim(),
        paperTitle: `Scholarly Abstract - ${candidateName.trim()}`,
        abstract: abstract.trim(),
        researchDomainId: 'res-domain-1',
        keywords: ['Call for Papers', 'Scholarly Abstract'],
        declarationAgreed: true,
      });

      setSubmissionSuccessCode(record.submissionCode);
      setCandidateName('');
      setEmail('');
      setMobileNumber('');
      setOrganization('');
      setQualification('');
      setAbstract('');
      setErrors({});
    } catch (err) {
      alert('Failed to submit abstract. Please try sending your abstract directly to ' + siteConfig.contact.officeEmail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          Institutional Engagement
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          Connect with the Secretariat
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Inquiries regarding research collaborations, visiting fellowships, media interviews, and academic manuscript submissions.
        </p>
      </div>

      {/* Centered Call for Papers Application Section */}
      <div className="max-w-3xl mx-auto w-full">
        <div id="papers" className="w-full">
          <div className="bg-white rounded-2xl p-7 sm:p-10 border border-slate-200 shadow-sm">
            <h3 className="font-serif text-2xl font-bold text-slate-900 mb-1">
              Call for Papers & Scholarly Abstracts
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Submit your abstract for consideration in the Magazine & News Letter
            </p>

            {!isCfpActive ? (
              <div className="p-8 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-3">
                <FileText className="w-10 h-10 text-amber-700 mx-auto" />
                <h4 className="font-serif text-lg font-bold text-amber-950">Call for Papers Window Closed</h4>
                <p className="text-xs text-amber-800 leading-relaxed max-w-md mx-auto">
                  Academic manuscript abstract submissions are currently deactivated via administrative configuration (<code className="font-mono">featureConfig.callForPapers = false</code>). Please check back for our next symposium CFP cycle.
                </p>
              </div>
            ) : submissionSuccessCode ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-serif text-lg font-bold">Manuscript Abstract Received</h4>
                <p className="text-xs text-emerald-800">
                  Tracking Code: <strong className="font-mono">{submissionSuccessCode}</strong>
                </p>
                <p className="text-xs text-emerald-700">
                  Our academic editorial committee will review your submission and communicate peer-review feedback within 14 working days.
                </p>
                <button
                  onClick={() => setSubmissionSuccessCode(null)}
                  className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Submit Another Abstract
                </button>
              </div>
            ) : (
              <form onSubmit={handleCfpSubmit} noValidate className="space-y-4">
                
                {/* 1. Candidate Full Name * */}
                <div>
                  <label htmlFor="candidateName" className="block text-xs font-semibold text-slate-700 mb-1">
                    Candidate Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="candidateName"
                    type="text"
                    required
                    placeholder="e.g. Dr. / Prof. / Full Name"
                    value={candidateName}
                    onChange={e => {
                      setCandidateName(e.target.value);
                      if (errors.candidateName) setErrors(prev => ({ ...prev, candidateName: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
                      errors.candidateName 
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:outline-none' 
                        : 'border-slate-200 focus:border-amber-600 focus:outline-none'
                    }`}
                  />
                  {errors.candidateName && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.candidateName}</span>
                    </p>
                  )}
                </div>

                {/* 2. Email Address * and 3. Mobile Number (India) * */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 2. Email Address * */}
                  <div>
                    <label htmlFor="authorEmail" className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="authorEmail"
                      type="email"
                      required
                      placeholder="e.g. scholar@university.edu"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
                        errors.email 
                          ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:outline-none' 
                          : 'border-slate-200 focus:border-amber-600 focus:outline-none'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* 3. Mobile Number (India) * */}
                  <div>
                    <label htmlFor="mobileNumber" className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number (India) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="mobileNumber"
                      type="tel"
                      required
                      placeholder="e.g. 98765 43210 or +91 9876543210"
                      value={mobileNumber}
                      onChange={e => {
                        setMobileNumber(e.target.value);
                        if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: undefined }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
                        errors.mobileNumber 
                          ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:outline-none' 
                          : 'border-slate-200 focus:border-amber-600 focus:outline-none'
                      }`}
                    />
                    {errors.mobileNumber && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{errors.mobileNumber}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. College / University / Organization * */}
                <div>
                  <label htmlFor="organization" className="block text-xs font-semibold text-slate-700 mb-1">
                    College / University / Organization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="organization"
                    type="text"
                    required
                    placeholder="e.g. Delhi University / NLU / Research Institute"
                    value={organization}
                    onChange={e => {
                      setOrganization(e.target.value);
                      if (errors.organization) setErrors(prev => ({ ...prev, organization: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
                      errors.organization 
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:outline-none' 
                        : 'border-slate-200 focus:border-amber-600 focus:outline-none'
                    }`}
                  />
                  {errors.organization && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.organization}</span>
                    </p>
                  )}
                </div>

                {/* 5. Qualification / Current Year of Study * */}
                <div>
                  <label htmlFor="qualification" className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualification / Current Year of Study <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="qualification"
                    type="text"
                    required
                    placeholder="e.g. Ph.D Scholar / LL.M (Final Year) / Assistant Professor"
                    value={qualification}
                    onChange={e => {
                      setQualification(e.target.value);
                      if (errors.qualification) setErrors(prev => ({ ...prev, qualification: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
                      errors.qualification 
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:outline-none' 
                        : 'border-slate-200 focus:border-amber-600 focus:outline-none'
                    }`}
                  />
                  {errors.qualification && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.qualification}</span>
                    </p>
                  )}
                </div>

                {/* 6. Extended Abstract (300-500 words) * */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="extendedAbstract" className="block text-xs font-semibold text-slate-700">
                      Extended Abstract (300–500 words) <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[11px] font-mono font-semibold ${
                      wordCount === 0 
                        ? 'text-slate-400' 
                        : wordCount < 300 
                        ? 'text-amber-600' 
                        : wordCount <= 500 
                        ? 'text-emerald-600' 
                        : 'text-rose-600'
                    }`}>
                      {wordCount} words {wordCount >= 300 && wordCount <= 500 ? '✓' : ''}
                    </span>
                  </div>
                  <textarea
                    id="extendedAbstract"
                    rows={6}
                    required
                    placeholder="Summarize the core hypothesis, research methodology, primary Indic/classical sources consulted, constitutional or legal arguments, and policy relevance (minimum 300 words, maximum 500 words)..."
                    value={abstract}
                    onChange={e => {
                      setAbstract(e.target.value);
                      if (errors.abstract) setErrors(prev => ({ ...prev, abstract: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-colors leading-relaxed ${
                      errors.abstract 
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:outline-none' 
                        : 'border-slate-200 focus:border-amber-600 focus:outline-none'
                    }`}
                  />
                  {errors.abstract ? (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.abstract}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Abstracts must contain between 300 and 500 words for academic peer review.
                    </p>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Abstract</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Email Submission Information */}
                <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <p className="leading-relaxed">
                    Please send your abstract to{' '}
                    <a
                      href={mailtoHref}
                      className="font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2 transition-colors inline-flex items-center space-x-1"
                      title="Open default email application or Gmail compose"
                    >
                      <span>{siteConfig.contact.officeEmail}</span>
                    </a>
                    .
                  </p>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

    </div>
  );
};
