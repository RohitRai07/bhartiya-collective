import { validateEmailAddress } from '../services/contactValidation';
import React, { useState, useEffect } from 'react';
import { magazineService } from '../services/magazineService';
import { featureConfig } from '../config/featureConfig';
import { MagazineIssue } from '../types/magazine';
import { 
  createRazorpayOrder, 
  launchRazorpayCheckout, 
  verifyRazorpayPayment 
} from '../services/razorpayService';
import { 
  BookOpen, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  Loader2, 
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

export const MagazinePage: React.FC = () => {
  const [issues, setIssues] = useState<MagazineIssue[]>([]);
  const [purchasingIssue, setPurchasingIssue] = useState<MagazineIssue | null>(null);
  const [readerName, setReaderName] = useState<string>('');
  const [readerEmail, setReaderEmail] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<{ filename: string; sizeKb: number } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isMagazineActive, setIsMagazineActive] = useState(featureConfig.isEnabled('magazine'));

  useEffect(() => {
    const load = () => {
      magazineService.getIssues().then(setIssues);
      setIsMagazineActive(featureConfig.isEnabled('magazine'));
    };
    load();

    const handleUpdate = () => load();
    window.addEventListener('bharat:magazine-updated', handleUpdate);
    window.addEventListener('bhartiya:feature-change', handleUpdate);
    return () => {
      window.removeEventListener('bharat:magazine-updated', handleUpdate);
      window.removeEventListener('bhartiya:feature-change', handleUpdate);
    };
  }, []);

  if (!isMagazineActive) {
    return (
      <div className="py-24 px-4 max-w-xl mx-auto text-center space-y-4">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-800">Magazine Section Inactive</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Bharat Review Magazine is currently deactivated via administrative configuration (<code className="font-mono">featureConfig.magazine = false</code>).
        </p>
      </div>
    );
  }

  const handleStartPurchase = (issue: MagazineIssue) => {
    setPurchasingIssue(issue);
    setDownloadSuccess(null);
    setPaymentError(null);
  };

  const handleCompletePurchaseAndDownload = async () => {
    if (!purchasingIssue) return;

    if (readerEmail.trim()) {
      const emailVal = validateEmailAddress(readerEmail);
      if (!emailVal.isValid) {
        setPaymentError(emailVal.error || 'Please enter a valid email address.');
        return;
      }
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Create order on backend
      const order = await createRazorpayOrder({
        amount: purchasingIssue.price,
        purpose: 'magazine',
        receiptId: `MAG-${purchasingIssue.id}-${Date.now()}`,
        notes: {
          issueId: purchasingIssue.id,
          issueNumber: purchasingIssue.issueNumber,
          issueTitle: purchasingIssue.title,
        },
      });

      // 2. Launch Razorpay Standard Checkout
      await launchRazorpayCheckout({
        order,
        description: `Bharat Review Magazine - ${purchasingIssue.issueNumber}`,
        prefill: {
          name: readerName.trim() || undefined,
          email: readerEmail.trim() || undefined,
        },
        notes: {
          issueId: purchasingIssue.id,
          issueNumber: purchasingIssue.issueNumber,
        },
        onSuccess: async (rzpResponse) => {
          // 3. Cryptographic signature verification
          const verifyResult = await verifyRazorpayPayment({
            razorpay_order_id: rzpResponse.razorpay_order_id,
            razorpay_payment_id: rzpResponse.razorpay_payment_id,
            razorpay_signature: rzpResponse.razorpay_signature,
            amount: purchasingIssue.price,
            purpose: 'magazine',
            donorDetails: {
              donorName: readerName.trim() || 'Reader Patron',
              email: readerEmail.trim() || undefined,
              receiptId: `MAG-${purchasingIssue.id}-${Date.now()}`,
            },
          });

          if (verifyResult.success) {
            try {
              const result = magazineService.downloadMagazinePdf(purchasingIssue);
              setDownloadSuccess(result);
            } catch {
              setPaymentError('Payment verified, but failed to generate PDF. Please try again.');
            }
          } else {
            setPaymentError(verifyResult.error || 'Payment signature verification failed.');
          }
          setIsProcessing(false);
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setPaymentError(`Payment failed: ${err.error?.description || err.message || 'Transaction could not be completed.'}`);
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
      setPaymentError(err.message || 'Unable to initialize Razorpay checkout.');
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Intro Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>Quarterly Publications</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          Bharat Collective Magazine
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Authoritative quarterly journal featuring peer-reviewed treatises, judicial commentary on the Uniform Civil Code and statutory reforms, and Indic policy frameworks.
        </p>
      </div>

      {/* Issues Grid */}
      {issues.length === 0 ? (
        <div className="text-center py-20 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200 max-w-2xl mx-auto space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-slate-800">New Issues Coming Soon</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            Our upcoming quarterly volumes covering constitutional synthesis, judicial commentaries, and Indic policy frameworks are currently in editorial peer review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="space-y-6">
                
                {/* Top Row: Cover Thumbnail + Main Header */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-full sm:w-36 h-48 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 shadow-md border border-amber-900/10">
                    <img
                      src={issue.coverImageUrl || '/images/bharat-dialogue-ucc-banner.jpg'}
                      alt={issue.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 uppercase">
                        {issue.issueNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{issue.publicationDate}</span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-slate-900 leading-snug">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>
                </div>

                {/* Focus Topics */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Featured Treatises & Inquiries
                  </span>
                  <ul className="space-y-1.5">
                    {(issue.tableOfContents || (issue as any).featuredArticles || []).map((art: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start space-x-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{art}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Price & Action */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6">
                <div>
                  <span className="text-xs text-slate-500">Nominal Reader Cost:</span>
                  <span className="font-serif text-2xl font-bold text-slate-900 ml-2">₹{issue.price}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartPurchase(issue)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Edition (₹{issue.price})</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Payment & Download Checkout Modal */}
      {purchasingIssue && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative">
            
            <button
              onClick={() => setPurchasingIssue(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Authorized Digital Reader Copy</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Download {purchasingIssue.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {purchasingIssue.issueNumber} • Format: Optimized PDF only
              </p>
            </div>

            {/* Price Details */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-600">Edition:</span>
                <span className="font-semibold text-slate-900">{purchasingIssue.issueNumber}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-600">Delivery Format:</span>
                <span className="font-semibold text-emerald-700">Strictly PDF (Compressed & Optimized)</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Amount Payable:</span>
                <span className="text-xl font-serif text-amber-900">₹{purchasingIssue.price}</span>
              </div>
            </div>

            {!downloadSuccess && (
              <div className="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Patron & Receipt Details (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      value={readerName}
                      onChange={(e) => setReaderName(e.target.value)}
                      placeholder="e.g. Dr. Raghavendra"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Email Address (for receipt)
                    </label>
                    <input
                      type="email"
                      value={readerEmail}
                      onChange={(e) => setReaderEmail(e.target.value)}
                      placeholder="reader@domain.org"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start space-x-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}

            {downloadSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-serif font-bold text-slate-900 text-base">
                  PDF Download Triggered!
                </h4>
                <p className="text-xs text-slate-600">
                  Downloaded: <strong className="font-mono">{downloadSuccess.filename}</strong> ({downloadSuccess.sizeKb} KB)
                </p>
                <p className="text-[11px] text-emerald-700">
                  Thank you for supporting Bharat Collective Foundation's open-access and scholarly publishing initiatives.
                </p>
                <button
                  onClick={() => setPurchasingIssue(null)}
                  className="mt-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span>
                    Your nominal ₹100 contribution directly funds visiting fellowships, manuscript digitization, and independent legal research. Secured by Razorpay.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCompletePurchaseAndDownload}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Initiating Razorpay Checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{purchasingIssue.price} via Razorpay & Download PDF</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
