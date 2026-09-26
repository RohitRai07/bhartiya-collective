import React, { useState } from 'react';
import { newsletterService } from '../../services/newsletterService';
import { notificationService } from '../../services/notificationService';
import { NewsletterState } from '../../types/newsletter';
import { Mail, CheckCircle2, AlertCircle, Info, Loader2, ArrowRight, ExternalLink, X, Eye } from 'lucide-react';

interface NewsletterFormProps {
  source?: string;
  variant?: 'inline' | 'card' | 'compact';
}

export const NewsletterForm: React.FC<NewsletterFormProps> = ({ 
  source = 'website', 
  variant = 'card' 
}) => {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [state, setState] = useState<NewsletterState>({ status: 'idle' });
  const [clientError, setClientError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    // 1. Client-side validation via newsletterService
    const validation = newsletterService.validateEmail(email);
    if (!validation.isValid) {
      setClientError(validation.error || 'Please enter a valid email address.');
      return;
    }

    const targetEmail = email.trim();
    // 2. Set Loading State
    setState({ status: 'loading' });

    try {
      // 3. Delegate exclusively to service boundary
      const result = await newsletterService.subscribe({
        email: targetEmail,
        source,
      });

      if (result.status === 'success') {
        setSubmittedEmail(targetEmail);
        setState({
          status: 'success',
          message: result.message,
          email: targetEmail,
        });
        setEmail('');
      } else if (result.status === 'already_subscribed') {
        setSubmittedEmail(targetEmail);
        setState({
          status: 'already_subscribed',
          message: result.message,
          email: targetEmail,
        });
      } else {
        setState({
          status: 'error',
          message: result.message,
        });
      }
    } catch (err: any) {
      setState({
        status: 'error',
        message: err.message || 'An unexpected error occurred. Please try again.',
      });
    }
  };

  const handleReset = () => {
    setState({ status: 'idle' });
    setClientError(null);
    setSubmittedEmail('');
  };

  const activeEmailForPreview = submittedEmail || state.email || 'scholar@bharatcollective.org';
  const previewData = notificationService.getWelcomeEmailPreview(activeEmailForPreview);

  return (
    <div className={`w-full ${variant === 'card' ? 'bg-white rounded-2xl p-6 sm:p-8 border border-amber-900/10 shadow-sm' : ''}`}>
      <div className="max-w-xl">
        {variant !== 'compact' && (
          <>
            <div className="flex items-center space-x-2 text-amber-700 font-semibold text-xs tracking-wider uppercase mb-2">
              <Mail className="w-4 h-4" />
              <span>Bhartiya Collective Policy Digest</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
              Stay Engaged with Foundational Indic Thought
            </h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Subscribe to receive our monthly peer-reviewed monographs, symposium notifications, and civilizational policy briefs. Zero spam.
            </p>
          </>
        )}

        {/* Success State */}
        {state.status === 'success' && (
          <div className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-sm text-emerald-900">Subscription Confirmed!</p>
                <p className="text-xs text-emerald-800 leading-relaxed">{state.message}</p>
              </div>
            </div>

            {/* Email Dispatch Details Card */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span>Dispatched to: <strong className="font-mono text-slate-900">{activeEmailForPreview}</strong></span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Delivered
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Received Welcome Email</span>
                </button>

                <a
                  href={notificationService.generateMailtoLink(
                    activeEmailForPreview,
                    'Welcome to the Bharat Collective Research Digest',
                    'Namaste,\n\nI have subscribed to Bharat Collective Foundation Research Digest.'
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 border border-slate-300"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open in Mail App</span>
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={handleReset}
                className="font-medium text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                ← Subscribe another address
              </button>
              <span className="text-[11px] text-slate-500">
                Logged in Secretariat Communications & Audit Trail
              </span>
            </div>
          </div>
        )}

        {/* Already Subscribed State */}
        {state.status === 'already_subscribed' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Already Subscribed</p>
                <p className="text-xs text-amber-800 mt-1">{state.message}</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-3 text-xs font-semibold text-amber-900 underline hover:text-amber-950"
                >
                  Enter another address
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Subscription Failed</p>
                <p className="text-xs text-red-700 mt-1">{state.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Form (Idle, Loading, or Post-Error) */}
        {state.status !== 'success' && state.status !== 'already_subscribed' && (
          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (clientError) setClientError(null);
                  }}
                  disabled={state.status === 'loading'}
                  placeholder="Enter your academic or personal email"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 transition-all ${
                    clientError 
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-slate-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                  }`}
                  aria-label="Email address"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={state.status === 'loading'}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed group flex-shrink-0"
              >
                {state.status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Client Validation Error */}
            {clientError && (
              <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{clientError}</span>
              </p>
            )}

            <p className="text-[11px] text-slate-500">
              We respect scholarly privacy. You can unsubscribe at any time in one click.
            </p>
          </form>
        )}
      </div>

      {/* Modal: View Delivered Welcome Email Letterhead */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Window Topbar */}
            <div className="bg-slate-950 px-4 py-3 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-xs font-mono font-medium text-slate-300 pl-2">
                  Mail Delivery Preview • Bharat Collective Secretariat
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Metadata Headers */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 text-xs space-y-1.5 font-sans">
              <div className="flex items-start justify-between">
                <span className="text-slate-500 w-16">From:</span>
                <span className="font-semibold text-slate-800 flex-1 text-right">{previewData.sender}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 w-16">To:</span>
                <span className="font-mono font-semibold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300/60 text-right">
                  {activeEmailForPreview}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 w-16">Subject:</span>
                <span className="font-bold text-slate-900 flex-1 text-right">{previewData.subject}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 w-16">Date:</span>
                <span className="text-slate-600 flex-1 text-right">{previewData.date}</span>
              </div>
            </div>

            {/* Letterhead Body */}
            <div className="p-6 bg-white space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="border-b border-amber-900/10 pb-4 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-amber-700 text-amber-100 font-serif font-bold text-lg flex items-center justify-center mx-auto shadow-sm">
                  भ
                </div>
                <p className="text-xs font-bold tracking-widest uppercase text-amber-800 font-sans">
                  Bharat Collective Foundation
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  Centre for Indic Thought, Civilizational Policy & Research
                </p>
              </div>

              <p className="text-sm font-semibold text-slate-800 font-serif">{previewData.salutation}</p>

              {previewData.bodyParagraphs.map((paragraph, idx) => (
                <p key={idx} className="text-xs leading-relaxed text-slate-700 font-sans">
                  {paragraph}
                </p>
              ))}

              <div className="pt-4 border-t border-slate-100 font-sans text-xs text-slate-600 space-y-1">
                <p>{previewData.closing}</p>
                <p className="font-semibold text-slate-900 whitespace-pre-line">{previewData.signatory}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-sans flex flex-wrap justify-between items-center gap-2">
                <span>Security Reference: <code className="font-mono text-slate-600">{previewData.unsubscribeToken}</code></span>
                <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Delivered via Secretariat Dispatch</span>
                </span>
              </div>
            </div>

            {/* Sandbox Notice & Action footer */}
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <p className="text-[11px] text-slate-500 leading-tight">
                Simulated in local browser mode. Live delivery available via Webhook in Admin Settings.
              </p>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <a
                  href={notificationService.generateMailtoLink(
                    activeEmailForPreview,
                    previewData.subject,
                    `${previewData.salutation}\n\n${previewData.bodyParagraphs.join('\n\n')}\n\n${previewData.closing}\n${previewData.signatory}`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors flex items-center space-x-1 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Send to Email App</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
