import React from 'react';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  AlertCircle,
  Radio,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { EventItem } from '../../types/event';
import { 
  extractYouTubeId, 
  getYouTubeEmbedUrl, 
  getYouTubeWatchUrl, 
  computeLiveEventStatus 
} from '../../utils/youtube';

interface LiveEventWatchModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRegisterInterest?: (event: EventItem) => void;
  isRegistered?: boolean;
}

export const LiveEventWatchModal: React.FC<LiveEventWatchModalProps> = ({
  event,
  isOpen,
  onClose,
  onRegisterInterest,
  isRegistered = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !event) return null;

  const youtubeUrl = event.youtubeUrl || '';
  const youtubeId = event.youtubeId || extractYouTubeId(youtubeUrl);
  const status = computeLiveEventStatus(event);
  const isValidYouTube = Boolean(youtubeId);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const statusBadge = () => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white inline-block animate-ping" />
            <Radio className="w-3.5 h-3.5" />
            <span>Live Now</span>
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled Stream</span>
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider">
            <span>Stream Ended • Watch Replay</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3 truncate pr-4">
            {statusBadge()}
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {event.date} • {event.time}
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {isValidYouTube && (
              <a
                href={getYouTubeWatchUrl(youtubeId)}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold transition-colors"
                title="Watch on YouTube in new tab"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Share event link"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Close Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player or Fallback */}
        <div className="relative aspect-video w-full bg-black flex-shrink-0">
          {isValidYouTube ? (
            <iframe
              src={getYouTubeEmbedUrl(youtubeId, true)}
              title={event.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950">
              <AlertCircle className="w-12 h-12 text-amber-400/80" />
              <h4 className="font-serif text-lg font-bold text-white">Livestream Unavailable</h4>
              <p className="text-xs text-slate-400 max-w-md">
                The YouTube stream URL is currently pending or invalid. Please check back shortly or visit our YouTube channel directly.
              </p>
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                >
                  <span>Open Stream URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Details & Information Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 text-slate-400">
              <span className="font-semibold text-amber-400 uppercase tracking-wider text-[11px]">
                {event.type}
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{event.date}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{event.time}</span>
              </span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white leading-snug">
              {event.title}
            </h3>
          </div>

          <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
            {event.description}
          </p>

          {/* Location & Modality */}
          <div className="flex items-center space-x-2 text-slate-400 pt-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{event.location || 'Online Webinar & YouTube Live Broadcast'}</span>
          </div>

          {/* Speakers */}
          {event.speakers && event.speakers.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-2">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Featured Panelists & Jurists</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {event.speakers.map((spk, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <div className="font-bold text-white text-xs">{spk.name}</div>
                    <div className="text-[11px] text-slate-400">{spk.role || spk.affiliation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              {isValidYouTube && (
                <a
                  href={getYouTubeWatchUrl(youtubeId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:hidden inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {copied && (
                <span className="text-emerald-400 text-xs font-semibold">
                  Event link copied to clipboard!
                </span>
              )}
            </div>

            {event.registrationOpen && onRegisterInterest && (
              <div>
                {isRegistered ? (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
                    <span>RSVP Logged</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRegisterInterest(event)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer"
                  >
                    RSVP for Livestream Q&A
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
