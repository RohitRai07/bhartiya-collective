import { useState } from 'react';
import { X, Copy, Send } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { siteConfig } from '../../config/siteConfig';

interface ShareContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentTitle: string;
  contentUrl: string; // The relative or absolute path, e.g. /publications
}

export function ShareContentModal({ isOpen, onClose, contentTitle, contentUrl }: ShareContentModalProps) {
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [shareMode, setShareMode] = useState<'social' | 'email' | 'whatsapp'>('social');
  
  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bharatcollective.org';
  const fullUrl = contentUrl.startsWith('http') 
    ? contentUrl 
    : `${origin}${contentUrl.startsWith('/') ? '' : '/'}${contentUrl}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(contentTitle);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    alert('Link copied to clipboard!');
  };

  const handleSocialShare = (platform: string) => {
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
    }
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleIntegrationShare = async () => {
    if (!recipient.trim()) {
      alert('Please enter recipient info');
      return;
    }
    
    setIsSending(true);
    try {
      if (shareMode === 'email') {
        await notificationService.sendNotification({
          channel: 'email',
          recipients: [{ 
            id: `share-${Date.now()}`, 
            name: 'Colleague', 
            email: recipient.trim(), 
            phone: '', 
            category: 'subscriber' 
          }],
          subject: `${siteConfig.shortName}: ${contentTitle}`,
          message: `Namaste,\n\nI thought you might be interested in this content from ${siteConfig.name}: "${contentTitle}".\n\nYou can view it here: ${fullUrl}\n\nWarm regards,\n${siteConfig.name}`
        });
      } else if (shareMode === 'whatsapp') {
        await notificationService.sendNotification({
          channel: 'whatsapp',
          recipients: [{ 
            id: `share-${Date.now()}`, 
            name: 'Colleague', 
            email: '', 
            phone: recipient.trim(), 
            category: 'subscriber' 
          }],
          subject: `${siteConfig.shortName}: ${contentTitle}`,
          message: `Namaste,\n\nCheck out this content from ${siteConfig.name}: *${contentTitle}*\n\n${fullUrl}`
        });
      }
      alert(`Successfully shared via ${shareMode}!`);
      setRecipient('');
      setShareMode('social');
      onClose();
    } catch (err: any) {
      alert(`Failed to share: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-serif font-bold text-slate-900">Share Content</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          <div>
            <div className="text-sm font-semibold text-slate-800 mb-1">Content:</div>
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 truncate">
              {contentTitle}
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setShareMode('social')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${shareMode === 'social' ? 'bg-white shadow-xs text-amber-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Social & Link
            </button>
            <button
              onClick={() => setShareMode('email')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${shareMode === 'email' ? 'bg-white shadow-xs text-amber-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Direct Email
            </button>
            <button
              onClick={() => setShareMode('whatsapp')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${shareMode === 'whatsapp' ? 'bg-white shadow-xs text-amber-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Direct WhatsApp
            </button>
          </div>

          {shareMode === 'social' ? (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCopyLink} className="flex items-center justify-center space-x-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-slate-700 cursor-pointer">
                <Copy className="w-4 h-4" />
                <span className="text-sm font-medium">Copy Link</span>
              </button>
              <button onClick={() => handleSocialShare('twitter')} className="flex items-center justify-center space-x-2 p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors text-sky-700 cursor-pointer">
                <span className="text-sm font-medium font-mono font-bold">𝕏 Twitter</span>
              </button>
              <button onClick={() => handleSocialShare('facebook')} className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors text-blue-700 cursor-pointer">
                <span className="text-sm font-medium font-bold">Facebook</span>
              </button>
              <button onClick={() => handleSocialShare('linkedin')} className="flex items-center justify-center space-x-2 p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors text-indigo-700 cursor-pointer">
                <span className="text-sm font-medium font-bold">LinkedIn</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Recipient {shareMode === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  type={shareMode === 'email' ? 'email' : 'tel'}
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder={shareMode === 'email' ? 'colleague@example.com' : '+91 98765 43210'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleIntegrationShare}
                disabled={isSending}
                className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-bold shadow flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send {shareMode === 'email' ? 'Email' : 'WhatsApp'} Message</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
