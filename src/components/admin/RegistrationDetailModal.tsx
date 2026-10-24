import React, { useState, useEffect } from 'react';
import { UserRegistrationRecord } from '../../types/registration';
import { registrationCsvExporter } from '../../export/registrationCsvExporter';
import { notificationService } from '../../services/notificationService';
import { NotificationLog } from '../../types/notification';
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
  ShieldCheck,
  History
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
  const [notificationHistory, setNotificationHistory] = useState<NotificationLog[]>([]);

  useEffect(() => {
    if (!record) return;

    const loadHistory = () => {
      const logs = notificationService.getLogsForRecipient(
        record.id,
        record.email,
        record.phoneNumber?.fullFormatted
      );
      setNotificationHistory(logs);
    };

    loadHistory();

    const handleDispatched = () => loadHistory();
    window.addEventListener('bharat:notification-dispatched', handleDispatched);
    return () => window.removeEventListener('bharat:notification-dispatched', handleDispatched);
  }, [record]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="bg-amber-800/80 p-2 rounded-xl text-amber-300 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">
                  {record.firstName} {record.middleName ? `${record.middleName} ` : ''}{record.lastName}
                </h2>
                {getStatusBadge(record.status)}
              </div>
              <p className="text-xs text-amber-400 font-mono tracking-wider">
                {record.registrationNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs text-slate-700">
          
          {/* Institutional Fellowship Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-amber-800" />
              <span>Academic Affiliation</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {record.collegeName}
            </div>
            <div className="flex items-center space-x-2 text-slate-600 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>National Youth Scholar & Fellow Candidate</span>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Direct Communications */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2">
                Communication Channels
              </h3>
              
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email Address</span>
                    <a href={`mailto:${record.email}`} className="font-medium text-amber-800 hover:underline">
                      {record.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mobile Number</span>
                    <span className="font-mono font-medium text-slate-900">
                      {record.phoneNumber.fullFormatted}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Postal Address & Location Beats */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[11px]">
                  Postal Geography
                </h3>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono">
                  Beat Auto-Resolved
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-start space-x-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{record.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
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

          {/* Synchronized Notification History */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Notification History ({notificationHistory.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotify(record);
                }}
                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Notify Fellow</span>
              </button>
            </div>

            {notificationHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No communications dispatched to this candidate yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {notificationHistory.map(log => (
                  <div key={log.id} className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' :
                          log.channel === 'email' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {log.channel}
                        </span>
                        <span className="font-semibold text-slate-800">{log.subject || 'Secretariat Update'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.sentAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2 italic">
                      "{log.messageSnippet}"
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Source: {log.sourceModule || 'Direct'}</span>
                      <span className={`font-semibold ${
                        log.status === 'delivered' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {log.status === 'delivered' ? '✓ Delivered' : '• Simulated / Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        <div className="bg-slate-50 p-3 sm:p-4 sm:px-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Status:</span>
            <button
              onClick={() => onStatusChange(record.id, 'pending')}
              disabled={record.status === 'pending'}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                record.status === 'archived'
                  ? 'bg-slate-700 text-white cursor-default'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Archived
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download 10-Col CSV</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenNotify(record);
              }}
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white transition-colors shadow-2xs cursor-pointer w-full sm:w-auto"
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
