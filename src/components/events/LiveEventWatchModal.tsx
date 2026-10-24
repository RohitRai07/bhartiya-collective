import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldAlert
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
  const [copied, setCopied] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  useEffect(() => {
    setUseFallback(false);
    setErrorCode(null);
  }, [event?.id, isOpen]);

  // Listen for YouTube iframe player error messages via postMessage API
  useEffect(() => {
    const handleWindowMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // YouTube API onError event:
        // 2: Invalid parameter
        // 5: HTML5 player error
        // 100: Video not found / removed
        // 101 or 150: Video owner does not permit playback in embedded players
        if (data && (data.event === 'onError' || typeof data.info === 'number')) {
          const code = Number(data.info);
          if (code === 101 || code === 150 || code === 100 || code === 2 || code === 5) {
            setErrorCode(code);
            setUseFallback(true);
          }
        }
      } catch {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

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
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-500 text-xs font-bold transition-all shadow-sm cursor-pointer"
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

        {/* Video Player or Fallback View */}
        <div className="relative aspect-video w-full bg-black flex-shrink-0 overflow-hidden">
          {isValidYouTube && !useFallback ? (
            <>
              <iframe
                src={getYouTubeEmbedUrl(youtubeId, true)}
                title={event.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />

              {/* Troubleshooting bar overlay at bottom of player */}
              <div className="absolute bottom-2 right-2 z-10 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-slate-300">
                <span>Playback issues?</span>
                <button
                  type="button"
                  onClick={() => setUseFallback(true)}
                  className="text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  Switch to Fallback
                </button>
                <span>•</span>
                <a
                  href={getYouTubeWatchUrl(youtubeId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:underline font-bold inline-flex items-center space-x-0.5"
                >
                  <span>Open on YouTube</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </>
          ) : (
            /* Fallback Screen for Unavailable, Ended, or Embedding-Restricted Streams */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
              <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shadow-lg">
                {errorCode === 101 || errorCode === 150 ? (
                  <ShieldAlert className="w-8 h-8 text-amber-400" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                )}
              </div>

              <div className="space-y-1.5 max-w-lg">
                <h4 className="font-serif text-lg sm:text-xl font-bold text-white">
                  {errorCode === 101 || errorCode === 150
                    ? 'Embedding Restricted by Broadcaster'
                    : errorCode === 100
                    ? 'Live Stream Ended or Offline'
                    : !isValidYouTube
                    ? 'Livestream Link Unavailable'
                    : 'Watch Broadcast Directly on YouTube'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {errorCode === 101 || errorCode === 150
                    ? 'The broadcaster or video copyright holder has restricted third-party embedded playback for this livestream. You can watch it directly on YouTube without restrictions.'
                    : errorCode === 100
                    ? 'This live broadcast has ended or is currently unavailable. You can visit the YouTube channel to check for replays and upcoming sessions.'
                    : !isValidYouTube
                    ? 'The YouTube Live URL is currently invalid or pending. Please verify the URL or visit our YouTube channel.'
                    : 'If this video displays "Video unavailable" due to browser policies or channel permissions, you can stream it smoothly on YouTube.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {isValidYouTube && (
                  <a
                    href={getYouTubeWatchUrl(youtubeId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xl transition-all hover:scale-105 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Directly on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {isValidYouTube && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseFallback(false);
                      setErrorCode(null);
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Embedded Player</span>
                  </button>
                )}
              </div>
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
