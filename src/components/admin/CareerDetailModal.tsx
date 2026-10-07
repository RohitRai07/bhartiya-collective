import React from 'react';
import { 
  X, 
  Briefcase, 
  Mail, 
  Phone, 
  Building, 
  GraduationCap, 
  Compass, 
  FileText, 
  Download, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { CareerApplicationRecord, CareerApplicationStatus } from '../../types/career';

interface CareerDetailModalProps {
  record: CareerApplicationRecord | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: CareerApplicationStatus) => void;
}

export const CareerDetailModal: React.FC<CareerDetailModalProps> = ({
  record,
  onClose,
  onStatusChange,
}) => {
  if (!record) return null;

  const statusColors: Record<CareerApplicationStatus, { bg: string; text: string; icon: any }> = {
    pending: { bg: 'bg-amber-100 text-amber-900 border-amber-300', text: 'text-amber-800', icon: Clock },
    reviewing: { bg: 'bg-blue-100 text-blue-900 border-blue-300', text: 'text-blue-800', icon: AlertCircle },
    shortlisted: { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', text: 'text-emerald-800', icon: CheckCircle },
    rejected: { bg: 'bg-rose-100 text-rose-900 border-rose-300', text: 'text-rose-800', icon: X },
  };

  const currentStatusMeta = statusColors[record.status] || statusColors.pending;
  const StatusIcon = currentStatusMeta.icon;

  const handleDownloadCv = () => {
    if (!record.cvDataUrl) {
      alert('CV data not available for this record.');
      return;
    }
    const link = document.createElement('a');
    link.href = record.cvDataUrl;
    link.download = record.cvFileName || `CV_${record.fullName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                record.type === 'job' 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                  : 'bg-sky-500/20 text-sky-300 border-sky-400/40'
              }`}>
                {record.type.toUpperCase()} APPLICATION
              </span>
              <span className="font-mono text-xs text-amber-200/80">
                {record.applicationCode}
              </span>
            </div>
            <h3 className="text-lg font-serif font-bold text-white">
              {record.fullName}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <StatusIcon className={`w-4 h-4 ${currentStatusMeta.text}`} />
              <span className="text-xs font-semibold text-slate-700">Application Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${currentStatusMeta.bg}`}>
                {record.status}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-500 font-medium">Update:</span>
              {(['pending', 'reviewing', 'shortlisted', 'rejected'] as CareerApplicationStatus[]).map(st => (
                <button
                  key={st}
                  onClick={() => onStatusChange(record.id, st)}
                  disabled={record.status === st}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    record.status === st
                      ? 'bg-slate-300 text-slate-600 opacity-60 cursor-default'
                      : 'bg-white border border-slate-300 text-slate-700 hover:border-amber-600 hover:text-amber-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Candidate Profile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Mail className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-500 font-medium block">Email Address</span>
                <a href={`mailto:${record.email}`} className="font-semibold text-slate-900 hover:text-amber-700">
                  {record.email}
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Phone className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-500 font-medium block">Phone Number</span>
                <a href={`tel:${record.phone}`} className="font-semibold text-slate-900 hover:text-amber-700">
                  {record.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Building className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-500 font-medium block">Current Institution / Org</span>
                <span className="font-semibold text-slate-900">
                  {record.currentInstitution || 'Not specified'}
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <GraduationCap className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-500 font-medium block">Highest Qualification / Year</span>
                <span className="font-semibold text-slate-900">
                  {record.qualification || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Area of Interest */}
          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs">
            <div className="flex items-center space-x-2 text-amber-900 font-bold mb-1">
              <Compass className="w-4 h-4 text-amber-700" />
              <span>Center / Inquiry Area of Interest</span>
            </div>
            <p className="font-semibold text-slate-800">
              {record.areaOfInterest}
            </p>
          </div>

          {/* Cover Letter */}
          {record.coverLetter && (
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-800 block">Statement of Purpose / Cover Letter:</span>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                {record.coverLetter}
              </div>
            </div>
          )}

          {/* CV Attachment Box (if present) */}
          {record.cvDataUrl ? (
            <div className="p-4 bg-gradient-to-r from-slate-50 to-amber-50/40 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-xs">
                    {record.cvFileName || 'Candidate_Resume.pdf'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {record.cvFileSize ? `${Math.round(record.cvFileSize / 1024)} KB` : 'PDF Document'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadCv}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download CV</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Direct application submitted online without attached file.</span>
            </div>
          )}

          {/* Metadata */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Submitted: {new Date(record.submittedAt).toLocaleString('en-IN')}</span>
            </div>
            <span>ID: {record.id}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};
