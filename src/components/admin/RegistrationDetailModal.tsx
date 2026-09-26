import React from 'react';
import { UserRegistrationRecord } from '../../types/registration';
import { registrationCsvExporter } from '../../export/registrationCsvExporter';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  GraduationCap, 
  MapPin, 
  Calendar, 
  Download, 
  Send, 
  CheckCircle2, 
  Clock, 
  Archive,
  ShieldCheck
} from 'lucide-react';

interface RegistrationDetailModalProps {
  record: UserRegistrationRecord | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: 'pending' | 'verified' | 'archived') => Promise<void>;
  onOpenNotify: (record: UserRegistrationRecord) => void;
}

export const RegistrationDetailModal: React.FC<RegistrationDetailModalProps> = ({
  record,
  onClose,
  onStatusChange,
  onOpenNotify,
}) => {
  if (!record) return null;

  const handleDownloadCsv = () => {
    registrationCsvExporter.downloadSingleRegistrationCsv(record);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Archive className="w-3.5 h-3.5 text-slate-500" />
            <span>Archived</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                Registration Dossier
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-xs text-slate-300 font-bold">
                {record.registrationNumber}
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-white">
              {record.firstName} {record.middleName ? `${record.middleName} ` : ''}{record.lastName}
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(record.status)}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* Identity & Contact Section */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Personal & Contact Credentials</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Full Name</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {record.firstName} {record.middleName} {record.lastName}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Registration ID</span>
                <span className="font-mono font-semibold text-amber-900 text-sm">
                  {record.registrationNumber}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email Address</span>
                <a 
                  href={`mailto:${record.email}`} 
                  className="font-medium text-amber-700 hover:underline inline-flex items-center space-x-1"
                >
                  <Mail className="w-3 h-3" />
                  <span>{record.email}</span>
                </a>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Phone Number</span>
                <a 
                  href={`tel:${record.phoneNumber.fullFormatted}`} 
                  className="font-mono font-medium text-slate-900 hover:text-amber-700 inline-flex items-center space-x-1"
                >
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{record.phoneNumber.fullFormatted}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Academic Affiliation */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
              <span>Academic Affiliation</span>
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">College / University Name</span>
              <p className="font-semibold text-slate-900 text-sm mt-0.5">{record.collegeName}</p>
            </div>
          </div>

          {/* Address & Geographic Hierarchy */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Postal & Geographic Location</span>
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Street Address</span>
                <p className="text-slate-800 font-medium">{record.address}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">PIN Code</span>
                  <span className="font-mono font-bold text-slate-900">{record.pincode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">City</span>
                  <span className="font-medium text-slate-900">{record.city}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">District</span>
                  <span className="font-medium text-slate-900">{record.district}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">State</span>
                  <span className="font-medium text-slate-900">{record.state}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Audit Metadata */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 bg-slate-100/70 px-4 py-2.5 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Submitted: {new Date(record.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
            </div>
            <div>
              <span>System Record ID: <code className="font-mono text-slate-600">{record.id}</code></span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Status:</span>
            <button
              onClick={() => onStatusChange(record.id, 'pending')}
              disabled={record.status === 'pending'}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                record.status === 'pending'
                  ? 'bg-amber-600 text-white cursor-default'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => onStatusChange(record.id, 'verified')}
              disabled={record.status === 'verified'}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                record.status === 'verified'
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => onStatusChange(record.id, 'archived')}
              disabled={record.status === 'archived'}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                record.status === 'archived'
                  ? 'bg-slate-700 text-white cursor-default'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Archived
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download 10-Col CSV</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenNotify(record);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Notify Candidate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
