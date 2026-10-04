import React, { useState, useEffect } from 'react';
import { careerService } from '../services/careerService';
import { featureConfig } from '../config/featureConfig';
import { CareerApplicationType, MAX_CV_SIZE_BYTES, CareerApplicationRecord } from '../types/career';
import { BHARAT_CENTRES } from '../data/centresData';
import { 
  Briefcase, 
  GraduationCap, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Loader2, 
  Mail, 
  Phone, 
  User, 
  School,
  Building,
  ArrowRight
} from 'lucide-react';

interface CareerPageProps {
  onNavigate?: (path: string) => void;
}

export const CareerPage: React.FC<CareerPageProps> = ({ onNavigate }) => {
  const [isCareersActive, setIsCareersActive] = useState(featureConfig.isEnabled('careers'));

  useEffect(() => {
    const handleUpdate = () => setIsCareersActive(featureConfig.isEnabled('careers'));
    window.addEventListener('bhartiya:feature-change', handleUpdate);
    return () => window.removeEventListener('bhartiya:feature-change', handleUpdate);
  }, []);

  const [appType, setAppType] = useState<CareerApplicationType>('internship');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [qualification, setQualification] = useState('');
  const [areaOfInterest, setAreaOfInterest] = useState('Center for Human Rights & Legal Aid');
  const [coverLetter, setCoverLetter] = useState('');

  // CV File State
  const [cvFile, setCvFile] = useState<{
    name: string;
    size: number;
    dataUrl: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<CareerApplicationRecord | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict PDF Check
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFileError('Invalid file format. Only PDF files (.pdf) are permitted.');
      setCvFile(null);
      e.target.value = '';
      return;
    }

    // Strict 1 MB check
    if (file.size > MAX_CV_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setFileError(`File size (${sizeMb} MB) exceeds the strict 1 MB maximum limit.`);
      setCvFile(null);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCvFile({
        name: file.name,
        size: file.size,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!fullName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setSubmitError('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!institution.trim()) {
      setSubmitError('Please enter your current university, college, or organization.');
      return;
    }
    if (!qualification.trim()) {
      setSubmitError('Please specify your current degree / highest qualification.');
      return;
    }
    if (!cvFile) {
      setSubmitError('Please upload your CV in PDF format (maximum 1 MB).');
      return;
    }

    setIsSubmitting(true);
    try {
      const record = await careerService.submitApplication({
        type: appType,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: `+91 ${cleanPhone.slice(-10)}`,
        currentInstitution: institution.trim(),
        qualification: qualification.trim(),
        areaOfInterest,
        coverLetter: coverLetter.trim() || undefined,
        cvFileName: cvFile.name,
        cvFileSize: cvFile.size,
        cvDataUrl: cvFile.dataUrl,
      });

      setSubmittedRecord(record);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setInstitution('');
    setQualification('');
    setCoverLetter('');
    setCvFile(null);
    setFileError(null);
    setSubmitError(null);
    setSubmittedRecord(null);
  };

  if (!isCareersActive) {
    return (
      <div className="py-24 px-4 max-w-xl mx-auto text-center space-y-4">
        <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-800">Careers & Internships Portal Closed</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Application intake is currently deactivated via administrative configuration (<code className="font-mono">featureConfig.careers = false</code>). The rest of the site remains fully operational.
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      
      {/* Intro Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <Briefcase className="w-3.5 h-3.5 text-amber-700" />
          <span>Opportunities & Fellowships</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          Career & Internship Opportunities
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Join Bharat Collective Foundation as an intern, research fellow, or full-time scholar. Work directly with leading jurists, academicians, and policy analysts.
        </p>
      </div>

      {submittedRecord ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md text-center max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Application Successfully Submitted!
            </h3>
            <p className="text-slate-600 text-sm mt-2">
              Thank you, <strong className="text-slate-900">{submittedRecord.fullName}</strong>. Your {submittedRecord.type} application has been recorded.
            </p>
          </div>

          <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/80 text-left space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between items-center pb-2 border-b border-amber-200/60">
              <span className="font-semibold uppercase tracking-wider text-amber-900">Application Tracking Code</span>
              <span className="font-mono text-sm font-bold text-amber-950 bg-amber-200/70 px-2.5 py-0.5 rounded">
                {submittedRecord.applicationCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Track:</span>
              <span className="font-bold text-slate-900 capitalize">{submittedRecord.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Centre of Interest:</span>
              <span className="font-medium text-slate-900">{submittedRecord.areaOfInterest}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Attached CV:</span>
              <span className="font-mono font-medium text-slate-800">{submittedRecord.cvFileName} ({(submittedRecord.cvFileSize / 1024).toFixed(0)} KB)</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Our academic recruitment committee will review your submission and contact shortlisted candidates within 10-14 working days.
          </p>

          <button
            onClick={handleReset}
            className="px-6 py-2.5 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Submit Another Application
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-3xl mx-auto">
          
          {/* Track Switcher: Internship vs Job */}
          <div className="mb-8">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3 text-center sm:text-left">
              Select Position Category <span className="text-amber-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl max-w-md mx-auto sm:mx-0">
              <button
                type="button"
                onClick={() => setAppType('internship')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  appType === 'internship'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Internship (Students)</span>
              </button>

              <button
                type="button"
                onClick={() => setAppType('job')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  appType === 'job'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Job / Fellowship</span>
              </button>
            </div>
          </div>

          {submitError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Candidate Full Name <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Adv. Rohit Sharma / Priya Varma"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:border-amber-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Email Address <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="candidate@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:border-amber-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Mobile Number (India) <span className="text-amber-600">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 font-semibold text-xs">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:border-amber-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Institution & Highest Qualification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  College / University / Organization <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Law University Delhi / DU"
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:border-amber-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Qualification / Current Year of Study <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4th Year B.A. LL.B / Ph.D. Scholar / Master's"
                  value={qualification}
                  onChange={e => setQualification(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:border-amber-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Centre of Interest */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Preferred Centre / Thematic Area <span className="text-amber-600">*</span>
              </label>
              <select
                value={areaOfInterest}
                onChange={e => setAreaOfInterest(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:border-amber-600 focus:bg-white"
              >
                {BHARAT_CENTRES.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="Secretariat & Communications">Secretariat & Communications</option>
                <option value="Editorial & Publications">Editorial & Publications</option>
              </select>
            </div>

            {/* Statement of Interest / Cover Letter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Statement of Purpose / Brief Introduction (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Briefly state your academic interests, past research, or why you wish to join Bharat Collective Foundation..."
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:border-amber-600 focus:bg-white"
              />
            </div>

            {/* CV Upload (Strictly PDF only, Max 1 MB) */}
            <div className="border-t border-slate-100 pt-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Curriculum Vitae (CV) / Resume <span className="text-amber-600">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Strict requirement: <strong>PDF format only (.pdf)</strong>, maximum allowed size <strong>1 MB</strong>.
              </p>

              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/60">
                <UploadCloud className="w-8 h-8 text-amber-700 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-xs font-bold text-amber-700 hover:text-amber-800 underline">
                    Click to select PDF from your device
                  </span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported format: .pdf (Strict limit: 1 MB)
                </p>

                {cvFile && (
                  <div className="mt-4 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>{cvFile.name} ({(cvFile.size / 1024).toFixed(0)} KB)</span>
                    <span className="text-emerald-600 font-bold">✓ Validated</span>
                  </div>
                )}

                {fileError && (
                  <div className="mt-3 text-xs text-red-600 font-semibold flex items-center justify-center space-x-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25 transition-all disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit {appType === 'internship' ? 'Internship' : 'Job'} Application</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
};
