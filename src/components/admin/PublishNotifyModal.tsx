import React, { useState } from 'react';
import { X, Mail, Smartphone, Globe, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { backendNotificationService } from '../../services/backendNotificationService';
import { newsletterService } from '../../services/newsletterService';

interface PublishNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  contentType: string;
  onPublishOnly: () => Promise<void>;
}

export const PublishNotifyModal: React.FC<PublishNotifyModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
  contentType,
  onPublishOnly,
}) => {
  const [notify, setNotify] = useState(false);
  const [channels, setChannels] = useState({ sms: false, email: true, whatsapp: true });
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', text: string} | null>(null);

  if (!isOpen) return null;

  const handlePublish = async () => {
    if (notify && !channels.sms && !channels.email && !channels.whatsapp) {
      setFeedback({ type: 'error', text: 'Please select at least one notification channel.' });
      return;
    }

    const confirmMessage = notify 
      ? `Are you sure you want to publish this content AND notify all active subscribers? This action cannot be undone.`
      : `Are you sure you want to publish this content?`;
      
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setProcessing(true);
    setFeedback(null);
    try {
      // 1. Publish Content
      await onPublishOnly();

      // 2. Notify Subscribers if enabled
      if (notify) {
        const subscribers = await newsletterService.getSubscribers();
        const activeSubscribers = subscribers.filter(s => s.status === 'active');
        
        if (activeSubscribers.length > 0) {
          await backendNotificationService.broadcast(
            activeSubscribers,
            `PUBLISH_${contentType.toUpperCase()}`,
            { title, url },
            channels
          );
        }
      }

      setFeedback({ type: 'success', text: 'Content published successfully!' + (notify ? ' Notifications queued.' : '') });
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'An error occurred during publishing.' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative font-sans">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Publish Content</h3>
            <p className="text-slate-400 text-xs">You are about to publish {title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Notify Toggle */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="font-bold text-slate-800 text-sm block">Notify Subscribers?</span>
              <span className="text-xs text-slate-500">Send an update to active subscribers</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Channels Selection */}
          {notify && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <label className="font-bold text-xs text-slate-700">Notification Channel</label>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={e => setChannels({ ...channels, sms: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-700 flex items-center text-xs"><MessageSquare className="w-4 h-4 mr-1.5 text-slate-400" /> SMS</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={e => setChannels({ ...channels, email: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-700 flex items-center text-xs"><Mail className="w-4 h-4 mr-1.5 text-slate-400" /> Email</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    checked={channels.whatsapp}
                    onChange={e => setChannels({ ...channels, whatsapp: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-700 flex items-center text-xs"><Smartphone className="w-4 h-4 mr-1.5 text-slate-400" /> WhatsApp</span>
                </label>
              </div>
            </div>
          )}

          {feedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={processing}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-50"
            >
              <Globe className="w-4 h-4" />
              <span>{processing ? 'Publishing...' : notify ? 'Publish & Notify' : 'Publish Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
