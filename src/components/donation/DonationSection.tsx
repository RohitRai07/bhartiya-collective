import React, { useState } from 'react';
import { 
  createDonation, 
  validateDonationAmount, 
  validateDonationPhone, 
  SUGGESTED_AMOUNTS 
} from '../../services/donationService';
import { 
  launchRazorpayCheckout, 
  verifyRazorpayPayment 
} from '../../services/razorpayService';
import { 
  DonationData, 
  DonationFrequency, 
  DonationCause, 
  DonationIntentResponse 
} from '../../types/donation';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Loader2, 
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  Info
} from 'lucide-react';

const CAUSE_OPTIONS: { id: DonationCause; title: string; desc: string }[] = [
  { id: 'general_research', title: 'Foundational Research Corpus', desc: 'Sustaining high-impact civilizational inquiry and institutional independence.' },
  { id: 'visiting_fellowships', title: 'Visiting Scholar Fellowships', desc: 'Direct residential grants for doctoral and post-doctoral researchers.' },
  { id: 'indic_monographs', title: 'Open-Access Monographs', desc: 'Publishing and distributing authoritative scholarly volumes globally.' },
  { id: 'national_symposium', title: 'Annual National Symposia', desc: 'Conferences convening thinkers, jurists, and policy formulators.' },
  { id: 'youth_scholar_grants', title: 'Young Scholar Travel Grants', desc: 'Supporting student presenters at international conferences.' },
];

export const DonationSection: React.FC = () => {
  const [frequency, setFrequency] = useState<DonationFrequency>('one_time');
  const [amountInput, setAmountInput] = useState<string>('2500');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(2500);
  const [selectedCause] = useState<DonationCause>('general_research');
  
  // Donor details
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [isIndianTaxResident] = useState(true);

  // Submission & Checkout state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<DonationIntentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedAmount = parseFloat(amountInput) || 0;

  const handlePresetSelect = (amt: number) => {
    setSelectedPreset(amt);
    setAmountInput(amt.toString());
    if (errorMessage === 'Minimum donation amount is ₹500.') {
      setErrorMessage(null);
    }
    setStatusNotice(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (errorMessage === 'Minimum donation amount is ₹500.') {
      setErrorMessage(null);
    }
    setStatusNotice(null);

    if (val === '') {
      setAmountInput('');
      setSelectedPreset(null);
      return;
    }
    // Strictly reject negative values, allow only positive numbers with at most 2 decimal places
    if (/^\d+(\.\d{0,2})?$/.test(val)) {
      setAmountInput(val);
      const num = parseFloat(val);
      // Synchronize preset button highlight if entered value exactly matches a preset
      if (!isNaN(num) && SUGGESTED_AMOUNTS.includes(num) && val === num.toString()) {
        setSelectedPreset(num);
      } else {
        setSelectedPreset(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusNotice(null);

    // 1. Minimum donation & amount validation (server and client enforced)
    const amountVal = validateDonationAmount(amountInput);
    if (!amountVal.isValid) {
      setErrorMessage(amountVal.error || 'Minimum donation amount is ₹500.');
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

    // 2. Mandatory mobile number validation
    const phoneVal = validateDonationPhone(phone);
    if (!phoneVal.isValid) {
      setErrorMessage(phoneVal.error || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: DonationData = {
        amount: amountVal.amount!,
        frequency,
        cause: selectedCause,
        donorName: donorName.trim(),
        email: email.trim().toLowerCase(),
        phone: phoneVal.cleanPhone || phone.trim(),
        panNumber: panNumber.trim().toUpperCase() || undefined,
        isIndianTaxResident,
      };

      // 3. Create server-side Razorpay order
      const intentResponse = await createDonation(payload);

      // 4. Launch Razorpay Standard Checkout
      await launchRazorpayCheckout({
        order: {
          success: true,
          orderId: intentResponse.paymentGatewayPayload?.orderId || `order_${Date.now()}`,
          amount: Math.round(amountVal.amount! * 100), // in paise
          currency: 'INR',
          keyId: intentResponse.paymentGatewayPayload?.keyId || 'mock_key_id',
          isMock: intentResponse.paymentGatewayPayload?.isMock,
        },
        description: `Patronage - ${selectedCause.replace(/_/g, ' ')}`,
        prefill: {
          name: donorName.trim(),
          email: email.trim(),
          contact: phoneVal.cleanPhone || phone.trim(),
        },
        notes: {
          donorName: donorName.trim(),
          email: email.trim(),
          phone: phoneVal.cleanPhone || phone.trim(),
          panNumber: panNumber.trim().toUpperCase(),
          cause: selectedCause,
          frequency,
          receiptId: intentResponse.donationId,
        },
        onSuccess: async (rzpResponse) => {
          // 5. Verify cryptographic signature on backend
          const verifyResult = await verifyRazorpayPayment({
            razorpay_order_id: rzpResponse.razorpay_order_id,
            razorpay_payment_id: rzpResponse.razorpay_payment_id,
            razorpay_signature: rzpResponse.razorpay_signature,
            donorDetails: payload,
            amount: amountVal.amount!,
            purpose: 'donation',
          });

          if (verifyResult.success) {
            setSubmissionResult({
              ...intentResponse,
              status: 'completed',
              paymentDetails: {
                paymentId: rzpResponse.razorpay_payment_id,
                orderId: rzpResponse.razorpay_order_id,
                signature: rzpResponse.razorpay_signature,
                verified: true,
              },
            });
          } else {
            setErrorMessage(verifyResult.error || 'Payment signature verification failed. Please contact our finance secretariat.');
          }
          setIsSubmitting(false);
        },
        onFailure: (err) => {
          setIsSubmitting(false);
          setErrorMessage(`Payment could not be completed: ${err.error?.description || err.message || 'Transaction was declined.'}`);
        },
        onDismiss: () => {
          setIsSubmitting(false);
          setStatusNotice('Payment checkout window was closed. You can retry whenever you are ready.');
        },
      });

    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to initialize payment checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmissionResult(null);
    setErrorMessage(null);
    setStatusNotice(null);
    setAmountInput('2500');
    setSelectedPreset(2500);
    setDonorName('');
    setEmail('');
    setPhone('');
    setPanNumber('');
  };

  return (
    <section className="relative overflow-hidden py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* If donation is successfully completed and verified */}
        {submissionResult ? (
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-amber-900/10 shadow-lg text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Razorpay Verified Payment</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Patronage Confirmed & Verified
            </h3>

            <p className="text-slate-600 text-sm max-w-lg mx-auto mb-6">
              Thank you, <strong className="text-slate-800">{donorName || 'Patron'}</strong>. Your generous contribution has been securely processed and recorded via Razorpay.
            </p>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-6 text-left max-w-lg mx-auto mb-6 space-y-3">
              {/* Payment ID */}
              {submissionResult.paymentDetails && (
                <div className="flex justify-between items-center pb-2 border-b border-amber-200/60">
                  <span className="text-xs font-semibold uppercase text-amber-900">Razorpay Payment ID</span>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {submissionResult.paymentDetails.paymentId}
                  </span>
                </div>
              )}

              {/* Order ID */}
              <div className="flex justify-between items-center pb-2 border-b border-amber-200/60">
                <span className="text-xs font-semibold uppercase text-amber-900">Order Reference</span>
                <span className="font-mono text-xs font-semibold text-amber-950 bg-amber-200/60 px-2 py-0.5 rounded">
                  {submissionResult.paymentDetails?.orderId || submissionResult.donationId}
                </span>
              </div>

              {/* Amount */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Contribution Amount:</span>
                <span className="font-bold text-slate-900 text-base">₹{submissionResult.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Frequency */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Frequency:</span>
                <span className="capitalize font-semibold text-slate-800">{frequency.replace('_', ' ')}</span>
              </div>

              {/* Purpose */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Contribution Purpose:</span>
                <span className="font-medium text-slate-800">
                  Independent Research, Legal, Events & Workshops
                </span>
              </div>
            </div>

            {/* Official Confirmation & 80G Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 max-w-lg mx-auto mb-8 text-left space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Official 80G Patronage Receipt</span>
              </div>
              <p>
                A verified digital confirmation receipt has been generated. Our finance secretariat will email the tax-deductible 80G receipt to <strong>{email}</strong>.
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
                      onClick={() => handlePresetSelect(amt)}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                        selectedPreset === amt
                          ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600 shadow-sm'
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
                    placeholder="Enter amount (Min ₹500)"
                    value={amountInput}
                    onChange={handleAmountChange}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:border-amber-600"
                  />
                </div>
                {amountInput !== '' && !isNaN(parseFloat(amountInput)) && parseFloat(amountInput) < 500 && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-2 font-medium">
                    Minimum donation amount is ₹500.
                  </p>
                )}
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Minimum donation: ₹500. Positive values only (up to 2 decimal places).
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number <span className="text-amber-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
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

              {/* Status / Cancellation Notice */}
              {statusNotice && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2 animate-in fade-in">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>{statusNotice}</span>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start space-x-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>256-Bit SSL Encrypted & Secured via Razorpay</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Initiating Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Proceed to Pay {parsedAmount >= 500 ? `(₹${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })})` : ''}
                      </span>
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
