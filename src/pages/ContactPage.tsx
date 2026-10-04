import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';
import { submissionService } from '../services/submissionService';
import { featureConfig } from '../config/featureConfig';
import { Mail, MapPin, Phone, Send, CheckCircle2, Loader2, FileText } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [isCfpActive, setIsCfpActive] = useState(featureConfig.isEnabled('callForPapers'));

  useEffect(() => {
    const handleUpdate = () => setIsCfpActive(featureConfig.isEnabled('callForPapers'));
    window.addEventListener('bhartiya:feature-change', handleUpdate);
    return () => window.removeEventListener('bhartiya:feature-change', handleUpdate);
  }, []);

  // Call for Papers form state
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [paperTitle, setPaperTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessCode, setSubmissionSuccessCode] = useState<string | null>(null);

  const handleCfpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName || !authorEmail || !paperTitle || !abstract) return;

    setIsSubmitting(true);
    try {
      const record = await submissionService.submitPaper({
        authorName,
        authorEmail,
        affiliation,
        paperTitle,
        abstract,
        researchDomainId: 'res-domain-1',
        keywords: ['Policy', 'Indic Governance'],
        declarationAgreed: true,
      });

      setSubmissionSuccessCode(record.submissionCode);
    } catch (err) {
      alert('Failed to submit abstract.');
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Direct Secretariat Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-serif text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              Secretariat Details
            </h3>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-800 text-sm">Postal Address</strong>
                  <span>{siteConfig.contact.address}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-800 text-sm">General Inquiries</strong>
                  <span>{siteConfig.contact.email}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-800 text-sm">Press & Editorial</strong>
                  <span>{siteConfig.contact.pressEmail}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-800 text-sm">Telephone</strong>
                  <div className="space-y-0.5">
                    <span className="block">{siteConfig.contact.phone}</span>
                    <span className="block">{siteConfig.contact.phoneSecondary}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Call for Papers Intake */}
        <div id="papers" className="lg:col-span-7">
          <div className="bg-white rounded-2xl p-7 sm:p-9 border border-slate-200 shadow-sm">
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
                  className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Another Abstract
                </button>
              </div>
            ) : (
              <form onSubmit={handleCfpSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Author Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. / Prof. / Scholar Name"
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Author Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="author@university.edu"
                      value={authorEmail}
                      onChange={e => setAuthorEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Affiliation *</label>
                  <input
                    type="text"
                    required
                    placeholder="University or Research Institute"
                    value={affiliation}
                    onChange={e => setAffiliation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Paper Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Title of paper or monograph"
                    value={paperTitle}
                    onChange={e => setPaperTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Extended Abstract (300-500 words) *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Summarize the core hypothesis, methodology, primary sources consulted, and policy relevance..."
                    value={abstract}
                    onChange={e => setAbstract(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-amber-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center space-x-2"
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
              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
