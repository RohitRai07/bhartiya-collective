import React, { useState } from 'react';
import { newsletterService } from '../../services/newsletterService';
import { NewsletterState } from '../../types/newsletter';
import { Mail, CheckCircle2, AlertCircle, Info, Loader2, ArrowRight } from 'lucide-react';

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
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 space-y-2 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-sm text-emerald-900">Subscription Confirmed!</p>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Thank you for subscribing to Bharat Collective Research Digest.
                </p>
              </div>
            </div>
            <div className="pt-1 text-xs">
              <button
                type="button"
                onClick={handleReset}
                className="font-medium text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                ← Subscribe another address
              </button>
            </div>
          </div>
        )}

        {/* Already Subscribed State */}
        {state.status === 'already_subscribed' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-2 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-sm text-amber-900">Already Subscribed</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  This email is already subscribed to the Bharat Collective digest.
                </p>
              </div>
            </div>
            <div className="pt-1 text-xs">
              <button
                type="button"
                onClick={handleReset}
                className="font-medium text-amber-800 hover:text-amber-950 underline cursor-pointer"
              >
                Enter another address
              </button>
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
    </div>
  );
};
