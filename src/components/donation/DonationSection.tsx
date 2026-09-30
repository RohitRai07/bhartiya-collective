import React, { useState } from 'react';
import { createDonation } from '../../services/donationService';
import { featureConfig } from '../../config/featureConfig';
import { 
  DonationData, 
  DonationFrequency, 
  DonationCause, 
  DonationIntentResponse 
} from '../../types/donation';
import { 
  Heart, 
  ShieldCheck, 
  IndianRupee, 
  CheckCircle2, 
  Lock, 
  Info, 
  Loader2, 
  ArrowRight,
  BookOpen,
  Award,
  Users
} from 'lucide-react';

const SUGGESTED_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

const CAUSE_OPTIONS: { id: DonationCause; title: string; desc: string }[] = [
  { id: 'general_research', title: 'Foundational Research Corpus', desc: 'Sustaining high-impact civilizational inquiry and institutional independence.' },
  { id: 'visiting_fellowships', title: 'Visiting Scholar Fellowships', desc: 'Direct residential grants for doctoral and post-doctoral researchers.' },
  { id: 'indic_monographs', title: 'Open-Access Monographs', desc: 'Publishing and distributing authoritative scholarly volumes globally.' },
  { id: 'national_symposium', title: 'Annual National Symposia', desc: 'Conferences convening thinkers, jurists, and policy formulators.' },
  { id: 'youth_scholar_grants', title: 'Young Scholar Travel Grants', desc: 'Supporting student presenters at international conferences.' },
];

export const DonationSection: React.FC = () => {
  const [frequency, setFrequency] = useState<DonationFrequency>('one_time');
  const [selectedAmount, setSelectedAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedCause, setSelectedCause] = useState<DonationCause>('general_research');
  
  // Donor details
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [isIndianTaxResident, setIsIndianTaxResident] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<DonationIntentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (finalAmount <= 0) {
      setErrorMessage('Contribution amount must be greater than ₹0.');
      return;
    }
    if (customAmount && !/^\d+(\.\d{1,2})?$/.test(customAmount)) {
      setErrorMessage('Contribution amount can have at most two decimal places and must be positive.');
      return;
    }
    if (finalAmount < 10) {
      setErrorMessage('Contribution amount must be at least ₹10.');
      return;
    }
    if (!donorName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: DonationData = {
        amount: finalAmount,
        frequency,
        cause: selectedCause,
        donorName: donorName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        isIndianTaxResident,
      };

      // Call strictly decoupled service boundary
      const result = await createDonation(payload);
      setSubmissionResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to record donation intent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmissionResult(null);
    setErrorMessage(null);
  };

  return (
    <section className="relative overflow-hidden py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* If donation intent is prepared (Clean Phase 1 Service Boundary) */}
        {submissionResult ? (
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-amber-900/10 shadow-lg text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Donation Intent Registered
            </h3>

            <p className="text-slate-600 text-sm max-w-lg mx-auto mb-6">
              Thank you, <strong className="text-slate-800">{donorName}</strong>. Your commitment to fostering civilizational research has been recorded.
            </p>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-6 text-left max-w-lg mx-auto mb-6 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-amber-200/60">
                <span className="text-xs font-semibold uppercase text-amber-900">Intent Reference</span>
                <span className="font-mono text-sm font-bold text-amber-950 bg-amber-200/60 px-2 py-0.5 rounded">
                  {submissionResult.donationId}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Pledged Amount:</span>
                <span className="font-bold text-slate-900">₹{submissionResult.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Frequency:</span>
                <span className="capitalize font-semibold text-slate-800">{frequency.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Contribution Purpose:</span>
                <span className="font-medium text-slate-800">
                  Independent Research, Legal, Events & Workshops
                </span>
              </div>
            </div>

            {/* Official Confirmation Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 max-w-lg mx-auto mb-8 text-left space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Official Patronage Confirmation</span>
              </div>
              <p>
                Our finance secretariat has logged your intent and will reach out with the 80G tax-exemption receipt and contribution schedule.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Back to Support Form
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-amber-900/10 shadow-sm p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Frequency Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                  Contribution Frequency
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl max-w-md">
                  {(['one_time', 'monthly', 'annually'] as DonationFrequency[]).map(freq => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFrequency(freq)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        frequency === freq
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {freq === 'one_time' ? 'One-Time' : freq === 'monthly' ? 'Monthly' : 'Annual'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                  Select Amount (INR)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                  {SUGGESTED_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                        selectedAmount === amt && !customAmount
                          ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Other Amount (e.g. 500)"
                    value={customAmount}
                    onChange={e => {
                      const val = e.target.value.trim();
                      if (val === '') {
                        setCustomAmount('');
                        return;
                      }
                      // Strictly reject negative values, allow only positive numbers with at most 2 decimal places
                      if (/^\d+(\.\d{0,2})?$/.test(val)) {
                        setCustomAmount(val);
                        setSelectedAmount(0);
                      }
                    }}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:border-amber-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Positive values only. Maximum 2 decimal places accepted.
                </p>
              </div>

              {/* Donor Information */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-4">
                  Donor Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Dr. Rajeshwari Varma"
                      value={donorName}
                      onChange={e => setDonorName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@domain.org"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">PAN Number (For 80G Tax Exemption)</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={e => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm uppercase font-mono focus:border-amber-600"
                    />
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Submit CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Transparent Non-Profit Financial Stewardship</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Intent...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Support (₹{finalAmount.toLocaleString('en-IN')})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </section>
  );
};
