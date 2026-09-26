import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { NotificationChannel, NotificationRecipient } from '../../types/notification';
import { notificationService } from '../../services/notificationService';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: NotificationRecipient[];
  defaultSubject?: string;
  defaultMessage?: string;
  onSuccess?: () => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  recipients,
  defaultSubject = 'Official Update from Bharat Collective Foundation',
  defaultMessage = '',
  onSuccess,
}) => {
  const [channel, setChannel] = useState<NotificationChannel>('both');
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setFeedback({ type: 'error', text: 'Message content cannot be blank.' });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const res = await notificationService.sendNotification({
        recipients,
        channel,
        subject: channel !== 'whatsapp' ? subject : undefined,
        message,
      });

      setFeedback({
        type: 'success',
        text: res.message || 'Notification dispatched successfully!',
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setFeedback(null);
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to dispatch notification. Please check network.',
      });
    } finally {
      setSending(false);
    }
  };

  const recipientSummary = recipients.length === 1
    ? `${recipients[0].name} (${recipients[0].phone || recipients[0].email})`
    : `${recipients.length} selected recipients`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white">
                Dispatch Notification
              </h3>
              <p className="text-xs text-slate-400">
                Email & WhatsApp communication gateway
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
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-mono text-[11px] font-bold">
              {recipients.length}
            </span>
          </div>

          {/* Delivery Channel Radio Cards */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 text-xs">Communication Channel</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('both')}
                className={`p-3 rounded-xl border text-center font-semibold transition-all flex flex-col items-center justify-center space-y-1 ${
                  channel === 'both'
                    ? 'border-amber-600 bg-amber-50/60 text-amber-900 ring-2 ring-amber-600/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-amber-700" />
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-[11px]">Email & WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`p-3 rounded-xl border text-center font-semibold transition-all flex flex-col items-center justify-center space-y-1 ${
                  channel === 'email'
                    ? 'border-amber-600 bg-amber-50/60 text-amber-900 ring-2 ring-amber-600/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Mail className="w-4 h-4 text-amber-700" />
                <span className="text-[11px]">Email Only</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`p-3 rounded-xl border text-center font-semibold transition-all flex flex-col items-center justify-center space-y-1 ${
                  channel === 'whatsapp'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">WhatsApp Only</span>
              </button>
            </div>
          </div>

          {/* Subject (for Email or Both) */}
          {channel !== 'whatsapp' && (
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

          {/* Message Content */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Message Content</label>
              <span className="text-[10px] text-slate-400">{message.length} characters</span>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message here. For personalized single delivery, address the scholar directly..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs font-sans leading-relaxed"
              required
            />
          </div>

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

          {/* Quick Previews */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Gateway Delivery Preview
            </span>
            {channel === 'whatsapp' || channel === 'both' ? (
              <div className="bg-[#DCF8C6] text-slate-900 p-2.5 rounded-lg text-[11px] border border-[#C2E8AA] max-w-sm shadow-2xs">
                <span className="text-[9px] font-bold text-emerald-800 block">Bharat Collective Foundation (Official)</span>
                <p className="whitespace-pre-line mt-1">{message || 'Your message preview will appear here...'}</p>
              </div>
            ) : (
              <div className="bg-white text-slate-800 p-3 rounded-lg border border-slate-200 text-[11px] shadow-2xs">
                <strong className="block text-slate-900 border-b border-slate-100 pb-1 mb-1 font-serif">
                  {subject || 'Subject'}
                </strong>
                <p className="whitespace-pre-line text-slate-600">{message || 'Message preview...'}</p>
              </div>
            )}
          </div>

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
              disabled={sending || !message.trim()}
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
