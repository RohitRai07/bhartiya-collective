import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Mail, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  MessageSquare, 
  ChevronDown,
  Eye,
  Info,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { NotificationRecipient } from '../../types/notification';
import { backendNotificationService } from '../../services/backendNotificationService';

export interface TemplateOption {
  id: string;
  label: string;
}

const DEFAULT_GLOBAL_TEMPLATES: TemplateOption[] = [
  { id: 'CUSTOM', label: 'Custom Message (Compose Manually)' },
  { id: 'ADMIN_NOTIFICATION', label: 'Official Secretariat Notice' },
  { id: 'CAREER_SHORTLISTED', label: 'Career: Application Shortlisted' },
  { id: 'CAREER_INTERVIEW_SCHEDULED', label: 'Career: Interview Scheduled' },
  { id: 'CAREER_SELECTED', label: 'Career: Offer of Selection' },
  { id: 'CAREER_UNDER_REVIEW', label: 'Career: Application Under Review' },
  { id: 'CAREER_REJECTED', label: 'Career: Application Decision Update' },
  { id: 'REGISTRATION_VERIFIED', label: 'Fellowship: Registration Verified' },
  { id: 'CFP_UPDATE', label: 'Call for Papers: Abstract Review Update' },
  { id: 'NEWSLETTER_DIGEST', label: 'Newsletter: Monograph & Digest Announcement' },
];

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: NotificationRecipient[];
  defaultSubject?: string;
  defaultMessage?: string;
  onSuccess?: () => void;
  templateOptions?: TemplateOption[];
  defaultTemplateId?: string;
  contextText?: string;
  dynamicData?: Record<string, string>;
  sourceModule?: string;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  recipients,
  defaultSubject = 'Official Update from Bharat Collective Foundation',
  defaultMessage = '',
  onSuccess,
  templateOptions = [],
  defaultTemplateId = 'CUSTOM',
  contextText,
  dynamicData = {},
  sourceModule
}) => {
  const [channels, setChannels] = useState({ sms: false, email: true, whatsapp: true });
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateId);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const availableTemplates = templateOptions.length > 0 ? templateOptions : DEFAULT_GLOBAL_TEMPLATES;

  useEffect(() => {
    if (isOpen) {
      setSubject(defaultSubject);
      setMessage(defaultMessage);
      setSelectedTemplate(defaultTemplateId || (availableTemplates.length > 0 ? availableTemplates[0].id : 'CUSTOM'));
      setFeedback(null);
    }
  }, [isOpen, defaultSubject, defaultMessage, defaultTemplateId, availableTemplates]);

  if (!isOpen) return null;

  // Check unsubscribe status
  const unsubscribedCount = recipients.filter(r => r.isSubscribed === false).length;

  const getTemplatePreview = () => {
    const sampleName = recipients[0]?.name || 'Scholar / Fellow';
    const sampleRef = recipients[0]?.referenceCode || 'BC-REF-2026';

    switch (selectedTemplate) {
      case 'CAREER_SHORTLISTED':
        return {
          subject: `Congratulations ${sampleName}, You Have Been Shortlisted • Bharat Collective`,
          body: `Namaste ${sampleName},\n\nWe are pleased to inform you that your application (${sampleRef}) has been shortlisted by the Bharat Collective Foundation Review Committee. Our team will connect with you shortly regarding the schedule for your panel discussion.\n\nWarm regards,\nCareers Committee • Bharat Collective Foundation`,
        };
      case 'CAREER_INTERVIEW_SCHEDULED':
        return {
          subject: `Interview Scheduled • Bharat Collective Foundation`,
          body: `Namaste ${sampleName},\n\nWe are pleased to invite you to an interview for your application (${sampleRef}). Please reply to this communication to confirm your slot.\n\nWarm regards,\nCareers Secretariat`,
        };
      case 'CAREER_SELECTED':
        return {
          subject: `Congratulations! Offer of Selection • Bharat Collective Foundation`,
          body: `Namaste ${sampleName},\n\nWe are thrilled to inform you that you have been selected for the fellowship role at Bharat Collective Foundation! Detailed joining instructions will follow.\n\nWarm regards,\nGoverning Council`,
        };
      case 'CAREER_UNDER_REVIEW':
        return {
          subject: `Your Application is Under Review • Bharat Collective Foundation`,
          body: `Namaste ${sampleName},\n\nYour application (${sampleRef}) is currently under review by our academic panel. We will communicate the outcome shortly.\n\nWarm regards,\nCareers Team`,
        };
      case 'CAREER_REJECTED':
        return {
          subject: `Update on Your Application • Bharat Collective Foundation`,
          body: `Namaste ${sampleName},\n\nThank you for applying to the Bharat Collective Foundation. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time. We wish you every success in your academic journey.\n\nWarm regards,\nSecretariat`,
        };
      case 'REGISTRATION_VERIFIED':
        return {
          subject: `Fellowship Registration Status Verified • Bharat Collective`,
          body: `Namaste ${sampleName},\n\nYour National Youth Scholar & Fellow registration (${sampleRef}) has been verified by the Secretariat. You now have full access to our closed-door symposiums and monographs.\n\nWarm regards,\nAcademic Review Council`,
        };
      case 'CFP_UPDATE':
        return {
          subject: `Scholarly Abstract Review Decision • Bharat Collective Call for Papers`,
          body: `Namaste ${sampleName},\n\nWe are writing to provide an update on your manuscript abstract (${sampleRef}). The Editorial Committee has completed its initial peer review and invites you to submit the full draft.\n\nWarm regards,\nEditorial Secretariat`,
        };
      case 'NEWSLETTER_DIGEST':
        return {
          subject: `New Research Monograph Published • Bharat Collective Foundation`,
          body: `Namaste ${sampleName},\n\nWe are pleased to announce the release of our latest peer-reviewed policy monograph. As an active subscriber, you can download the digital edition now.\n\nWarm regards,\nBharat Collective Secretariat`,
        };
      case 'ADMIN_NOTIFICATION':
        return {
          subject: subject || 'Official Secretariat Notice',
          body: message || 'Namaste,\n\nThis is an official administrative notice from the Bharat Collective Foundation Secretariat.\n\nWarm regards,\nBharat Collective Secretariat',
        };
      default:
        return {
          subject,
          body: message,
        };
    }
  };

  const templatePreview = getTemplatePreview();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channels.sms && !channels.email && !channels.whatsapp) {
      setFeedback({ type: 'error', text: 'Please select at least one communication channel (Email, SMS, or WhatsApp).' });
      return;
    }
    if (selectedTemplate === 'CUSTOM' && !message.trim()) {
      setFeedback({ type: 'error', text: 'Message content cannot be blank for custom messages.' });
      return;
    }

    if (!window.confirm(`Are you sure you want to dispatch this notification to ${recipients.length} recipient(s)? This will update notification history across all modules.`)) {
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const typeToUse = selectedTemplate === 'CUSTOM' ? 'ADMIN_NOTIFICATION' : selectedTemplate;
      const preview = getTemplatePreview();
      const dataToUse = {
        title: selectedTemplate === 'CUSTOM' ? subject : preview.subject,
        subject: selectedTemplate === 'CUSTOM' ? subject : preview.subject,
        message: selectedTemplate === 'CUSTOM' ? message : preview.body,
        body: selectedTemplate === 'CUSTOM' ? message : preview.body,
        sourceModule: sourceModule || recipients[0]?.sourceModule || 'general',
        ...dynamicData,
      };

      const result: any = await backendNotificationService.broadcast(
        recipients.map(r => ({
          ...r,
          id: r.id || Date.now().toString(),
          sourceModule: r.sourceModule || sourceModule || 'general',
        })),
        typeToUse,
        dataToUse,
        channels
      );

      const statusNote = result?.status === 'delivered' 
        ? 'Delivered through live gateway'
        : 'Logged to audit trail (Simulation / Provider Pending Setup)';

      setFeedback({ 
        type: 'success', 
        text: `Message successfully dispatched to ${recipients.length} recipient(s). [${statusNote}]` 
      });
      
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 1600);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', text: err.message || 'Failed to dispatch message.' });
    } finally {
      setSending(false);
    }
  };

  const recipientSummary = recipients.length === 1
    ? `${recipients[0].name} (${recipients[0].phone || recipients[0].email})`
    : `${recipients.length} selected recipients`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <Send className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Dispatch Notification</h2>
              <p className="text-xs text-slate-400">
                Email, SMS & WhatsApp multi-channel communication gateway
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          
          {/* Recipient Target Banner */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider block">Target Recipients</span>
                <span className="font-semibold text-amber-950 text-xs">{recipientSummary}</span>
                {contextText && (
                  <span className="font-bold text-amber-700 block mt-0.5">{contextText}</span>
                )}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-mono text-[11px] font-bold">
              {recipients.length}
            </span>
          </div>

          {/* Unsubscribe Compliance Warning */}
          {unsubscribedCount > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 flex items-start space-x-2.5">
              <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="block font-semibold">Consent & Unsubscribe Notice:</strong>
                {unsubscribedCount} selected recipient(s) have opted out of marketing digests. Only essential transactional notices will be routed.
              </div>
            </div>
          )}

          {/* Template Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 text-xs block">Notification Template</label>
            <div className="relative">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs font-semibold appearance-none cursor-pointer"
              >
                {availableTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Delivery Channel Checkboxes */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="font-bold text-slate-900 text-xs block mb-1.5">Delivery Channels</label>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={e => setChannels({ ...channels, email: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 flex items-center">
                  <Mail className="w-4 h-4 mr-1 text-blue-600" /> Email
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={channels.whatsapp}
                  onChange={e => setChannels({ ...channels, whatsapp: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 flex items-center">
                  <Smartphone className="w-4 h-4 mr-1 text-emerald-600" /> WhatsApp
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={e => setChannels({ ...channels, sms: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1 text-purple-600" /> SMS
                </span>
              </label>
            </div>
          </div>

          {/* Custom Message Fields */}
          {selectedTemplate === 'CUSTOM' ? (
            <>
              {channels.email && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-900 text-xs">Email Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Invitation to National Colloquium on Civilizational Ethics"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 text-xs">Message Content</label>
                  <span className="text-[10px] text-slate-400">{message.length} characters</span>
                </div>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your custom message here..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs font-sans leading-relaxed"
                  required
                />
              </div>
            </>
          ) : (
            /* Live Template Preview */
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center space-x-1.5 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 text-amber-700" />
                <span>Message Live Preview (Interpolated)</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Subject:</span>
                  <span className="font-semibold text-slate-900">{templatePreview.subject}</span>
                </div>
                <div className="pt-1 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Body:</span>
                  <p className="text-slate-700 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {templatePreview.body}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Alert */}
          {feedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : feedback.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || (selectedTemplate === 'CUSTOM' && !message.trim())}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Dispatching...' : `Dispatch to ${recipients.length} Recipient(s)`}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
