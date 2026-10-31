import React, { useState, useEffect } from 'react';
import { EventList } from '../components/events/EventList';
import { FlagshipBanner } from '../components/common/FlagshipBanner';
import { featureConfig } from '../config/featureConfig';
import { Calendar, Radio, Play, ExternalLink, Clock } from 'lucide-react';
import { eventService } from '../services/eventService';
import { EventItem } from '../types/event';
import { extractYouTubeId, getYouTubeWatchUrl, computeLiveEventStatus } from '../utils/youtube';
import { LiveEventWatchModal } from '../components/events/LiveEventWatchModal';
import { resolveEventImage } from '../utils/eventImage';

interface EventsPageProps {
  onNavigate: (path: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onNavigate }) => {
  const [isEventsActive, setIsEventsActive] = useState(featureConfig.isEnabled('events'));
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);
  const [spotlightEvent, setSpotlightEvent] = useState<EventItem | null>(null);
  const [watchingLiveEvent, setWatchingLiveEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    const handleUpdate = () => setIsEventsActive(featureConfig.isEnabled('events'));
    window.addEventListener('bhartiya:feature-change', handleUpdate);
    return () => window.removeEventListener('bhartiya:feature-change', handleUpdate);
  }, []);

  useEffect(() => {
    const loadLive = async () => {
      try {
        const lives = await eventService.getLiveEvents();
        setLiveEvents(lives);
        // Find one that is live right now, otherwise an upcoming one, otherwise the first
        const active = lives.find(e => computeLiveEventStatus(e) === 'live') 
          || lives.find(e => computeLiveEventStatus(e) === 'upcoming') 
          || lives[0] 
          || null;
        setSpotlightEvent(active);
      } catch (e) {
        console.error('Failed to load live events:', e);
      }
    };

    loadLive();
    const timer = setInterval(loadLive, 30000);
    window.addEventListener('bharat:content-updated', loadLive);
    return () => {
      clearInterval(timer);
      window.removeEventListener('bharat:content-updated', loadLive);
    };
  }, []);

  if (!isEventsActive) {
    return (
      <div className="py-24 px-4 max-w-xl mx-auto text-center space-y-4">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-800">Conferences & Events Inactive</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The dialogues and conferences section is currently deactivated via administrative configuration (<code className="font-mono">featureConfig.events = false</code>).
        </p>
      </div>
    );
  }

  const spotlightStatus = spotlightEvent ? computeLiveEventStatus(spotlightEvent) : null;
  const spotlightYtId = spotlightEvent?.youtubeId || (spotlightEvent?.youtubeUrl ? extractYouTubeId(spotlightEvent.youtubeUrl) : '');

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Intro Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-amber-700" />
          <span>Conferences & Dialogues</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          #BharatDialogue: National Symposium
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          National Workshops Leading Constitutional jurists, scholars, & Legal Experts, Sr Advocate's, Criticals, Legals Issues.
        </p>
      </div>

      {/* Featured YouTube Livestream Spotlight (When a live event is published) */}
      {spotlightEvent && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white border border-red-500/30 shadow-2xl p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                {spotlightStatus === 'live' ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white inline-block" />
                    <Radio className="w-3.5 h-3.5" />
                    <span>Broadcasting Live Now</span>
                  </span>
                ) : spotlightStatus === 'upcoming' ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Upcoming Live Broadcast</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    <span>Recent Live Stream • Watch Replay</span>
                  </span>
                )}
                <span className="text-xs text-amber-200/80 font-mono">
                  {spotlightEvent.date} • {spotlightEvent.time}
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-snug">
                {spotlightEvent.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {spotlightEvent.description}
              </p>

              {spotlightEvent.speakers && spotlightEvent.speakers.length > 0 && (
                <div className="text-xs text-amber-200/90 font-medium">
                  Featuring: {spotlightEvent.speakers.map(s => s.name).join(', ')}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWatchingLiveEvent(spotlightEvent)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg transition-transform hover:scale-102 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Livestream on Portal</span>
                </button>

                {spotlightYtId && (
                  <a
                    href={getYouTubeWatchUrl(spotlightYtId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                  </a>
                )}
              </div>
            </div>

            {/* Video / Poster Preview Card */}
            {(spotlightEvent.posterUrl || spotlightEvent.bannerImage) && (
              <div 
                onClick={() => setWatchingLiveEvent(spotlightEvent)}
                className="relative aspect-video w-full max-w-sm rounded-2xl overflow-hidden border border-white/20 shadow-xl cursor-pointer group shrink-0 bg-slate-900"
              >
                <img
                  src={resolveEventImage(spotlightEvent.posterUrl || spotlightEvent.bannerImage)}
                  alt={spotlightEvent.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 ml-0.5 fill-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flagship Banner Presentation */}
      <FlagshipBanner onRegisterClick={() => onNavigate('/register')} />

      {/* Full Events Calendar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              Upcoming Schedule & Roundtables
            </h2>
            <p className="text-xs text-slate-500">
              Explore upcoming symposia, policy roundtables, and YouTube live broadcasts
            </p>
          </div>
        </div>
        <EventList onRegisterInterest={() => onNavigate('/register')} />
      </div>

      {/* Livestream Player Modal */}
      <LiveEventWatchModal
        event={watchingLiveEvent}
        isOpen={Boolean(watchingLiveEvent)}
        onClose={() => setWatchingLiveEvent(null)}
        onRegisterInterest={() => onNavigate('/register')}
      />

    </div>
  );
};
