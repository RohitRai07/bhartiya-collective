import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Smartphone, AlertCircle, CheckCircle2, Send, MessageSquare, ChevronDown } from 'lucide-react';
import { NotificationRecipient } from '../../types/notification';
import { backendNotificationService } from '../../services/backendNotificationService';

export interface TemplateOption {
  id: string;
  label: string;
}

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
  dynamicData = {}
}) => {
  const [channels, setChannels] = useState({ sms: false, email: true, whatsapp: true });
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateId);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSubject(defaultSubject);
      setMessage(defaultMessage);
      setSelectedTemplate(defaultTemplateId || (templateOptions.length > 0 ? templateOptions[0].id : 'CUSTOM'));
      setFeedback(null);
    }
  }, [isOpen, defaultSubject, defaultMessage, defaultTemplateId, templateOptions]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channels.sms && !channels.email && !channels.whatsapp) {
      setFeedback({ type: 'error', text: 'Please select at least one communication channel.' });
      return;
    }
    if (selectedTemplate === 'CUSTOM' && !message.trim()) {
      setFeedback({ type: 'error', text: 'Message content cannot be blank.' });
      return;
    }

    if (!window.confirm(`Are you sure you want to dispatch this notification to ${recipients.length} recipient(s)? This action cannot be undone.`)) {
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const typeToUse = selectedTemplate === 'CUSTOM' ? 'ADMIN_NOTIFICATION' : selectedTemplate;
      const dataToUse = selectedTemplate === 'CUSTOM' 
        ? { title: subject, url: '', message, ...dynamicData }
        : { ...dynamicData };

      await backendNotificationService.broadcast(
        recipients.map(r => ({ ...r, id: r.id || Date.now().toString() })),
        typeToUse,
        dataToUse,
        channels
      );

      setFeedback({ type: 'success', text: `Message successfully dispatched to ${recipients.length} recipients.` });
      
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 2000);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Failed to dispatch message via backend.' });
    } finally {
      setSending(false);
    }
  };

  const recipientSummary = recipients.length === 1
    ? `${recipients[0].name} (${recipients[0].phone || recipients[0].email})`
    : `${recipients.length} selected recipients`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200/60 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <Send className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Dispatch Notification</h2>
              <p className="text-xs text-slate-400">
                Email, SMS & WhatsApp communication gateway
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
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

          {/* Template Selection */}
          {templateOptions.length > 0 && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 text-xs block">Notification Template</label>
              <div className="relative">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold appearance-none cursor-pointer"
                >
                  {templateOptions.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                  <option value="CUSTOM">Custom Message (Manual)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Delivery Channel Checkboxes */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 text-xs block mb-2">Send Notification</label>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={e => setChannels({ ...channels, sms: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 flex items-center"><MessageSquare className="w-4 h-4 mr-1.5 text-slate-400" /> SMS</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={e => setChannels({ ...channels, email: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 flex items-center"><Mail className="w-4 h-4 mr-1.5 text-slate-400" /> Email</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                <input
                  type="checkbox"
                  checked={channels.whatsapp}
                  onChange={e => setChannels({ ...channels, whatsapp: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 flex items-center"><Smartphone className="w-4 h-4 mr-1.5 text-slate-400" /> WhatsApp</span>
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Pre-configured Template Selected</p>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">
                The message content and subject will be dynamically generated by the backend based on the candidate's details.
              </p>
            </div>
          )}

          {/* Feedback Alert */}
          {feedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || (selectedTemplate === 'CUSTOM' && !message.trim())}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white transition-colors shadow-sm"
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
