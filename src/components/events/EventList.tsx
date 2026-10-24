import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import { taxonomyService } from '../../services/taxonomyService';
import { EventItem } from '../../types/event';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  ExternalLink, 
  Radio 
} from 'lucide-react';
import { extractYouTubeId, getYouTubeWatchUrl, computeLiveEventStatus } from '../../utils/youtube';
import { LiveEventWatchModal } from './LiveEventWatchModal';

interface EventListProps {
  onRegisterInterest?: (event: EventItem) => void;
}

const resolveEventImage = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const clean = url.replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${clean}`;
};

const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80';

export const EventList: React.FC<EventListProps> = ({ onRegisterInterest }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [watchingLiveEvent, setWatchingLiveEvent] = useState<EventItem | null>(null);

  const [categories, setCategories] = useState<string[]>(() => [
    'All',
    'Live Streams',
    ...taxonomyService.getOptions('event_category').map(o => o.value),
  ]);

  useEffect(() => {
    const load = () => eventService.getEvents().then(setEvents);
    load();

    const handleUpdate = () => {
      load();
      setCategories([
        'All',
        'Live Streams',
        ...taxonomyService.getOptions('event_category').map(o => o.value),
      ]);
    };
    window.addEventListener('bharat:content-updated', handleUpdate);
    window.addEventListener('bharat:taxonomy-updated', handleUpdate);
    return () => {
      window.removeEventListener('bharat:content-updated', handleUpdate);
      window.removeEventListener('bharat:taxonomy-updated', handleUpdate);
    };
  }, []);

  const handleRegister = (event: EventItem) => {
    setRegisteredEvents(prev => new Set(prev).add(event.id));
    if (onRegisterInterest) onRegisterInterest(event);
  };

  const filteredEvents = events.filter(evt => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Live Streams') {
      return Boolean(evt.isLive || evt.youtubeUrl || evt.type === 'Live Stream');
    }
    const cat = (evt.type || '').toLowerCase().replace(/_/g, ' ');
    const target = selectedCategory.toLowerCase().replace(/_/g, ' ');
    return cat === target;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center space-x-1.5 ${
              selectedCategory === cat
                ? 'bg-amber-800 text-white shadow-xs font-bold'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {cat === 'Live Streams' && <Radio className={`w-3 h-3 ${selectedCategory === cat ? 'text-white' : 'text-red-600'}`} />}
            <span>{cat === 'All' ? 'All Formats & Symposia' : cat}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((evt) => {
          const isRegistered = registeredEvents.has(evt.id);
          const isFlagship = evt.id === 'evt-ucc-flagship';
          const isLiveEvent = Boolean(evt.isLive || evt.youtubeUrl || evt.type === 'Live Stream');
          const liveStatus = isLiveEvent ? computeLiveEventStatus(evt) : undefined;
          const imageUrl = resolveEventImage(evt.bannerImage) || DEFAULT_EVENT_IMAGE;
          const ytId = evt.youtubeId || (evt.youtubeUrl ? extractYouTubeId(evt.youtubeUrl) : '');

          return (
            <div
              key={evt.id}
              className={`bg-white rounded-2xl border overflow-hidden flex flex-col justify-between transition-all shadow-sm ${
                isLiveEvent
                  ? 'border-red-200 hover:border-red-400 hover:shadow-md'
                  : isFlagship 
                  ? 'border-amber-500 ring-2 ring-amber-500/20' 
                  : 'border-slate-200 hover:border-amber-400'
              }`}
            >
              {/* Event Poster / Banner Preview */}
              <div 
                className={`relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900 border-b border-amber-500/20 group ${
                  isLiveEvent ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (isLiveEvent) setWatchingLiveEvent(evt);
                }}
              >
                <img
                  src={imageUrl}
                  alt={evt.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_EVENT_IMAGE;
                  }}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                {/* Status Badges */}
                <div className="absolute top-3 left-3">
                  {isLiveEvent ? (
                    liveStatus === 'live' ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs shadow-md animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white inline-block" />
                        <Radio className="w-3 h-3" />
                        <span>Live Now</span>
                      </span>
                    ) : liveStatus === 'upcoming' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        <Clock className="w-3 h-3" />
                        <span>Scheduled Stream</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 text-[10px] font-bold uppercase tracking-wider">
                        <span>Stream Ended</span>
                      </span>
                    )
                  ) : isFlagship ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-900/90 text-amber-300 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs border border-amber-400/40 shadow-sm">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Flagship Event</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-900/80 text-amber-200 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs border border-white/20 shadow-xs">
                      <span>{evt.type}</span>
                    </span>
                  )}
                </div>

                {/* Play Button Overlay for Live Streams */}
                {isLiveEvent && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:bg-black/10 transition-all">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 ml-0.5 fill-white" />
                    </div>
                  </div>
                )}

                <div className="absolute bottom-2.5 right-3 text-white text-[11px] font-semibold backdrop-blur-md bg-slate-950/80 px-2 py-0.5 rounded-md border border-white/10">
                  {isLiveEvent ? 'Online Livestream' : evt.mode}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isLiveEvent ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isLiveEvent ? 'YouTube Live Event' : evt.type}
                    </span>
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {(evt.mode === 'Hybrid' || isLiveEvent) && <Video className="w-3 h-3 mr-1 text-emerald-600" />}
                      {isLiveEvent ? 'Webcast' : evt.mode}
                    </span>
                  </div>

                  <h3 
                    onClick={() => {
                      if (isLiveEvent) setWatchingLiveEvent(evt);
                    }}
                    className={`font-serif text-lg font-bold text-slate-900 mb-2 leading-snug ${
                      isLiveEvent ? 'cursor-pointer hover:text-red-700 transition-colors' : ''
                    }`}
                  >
                    {evt.title}
                  </h3>

                  <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <div>
                  {/* Event Schedule Info */}
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-800">{evt.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{evt.location}</span>
                    </div>
                  </div>

                  {/* Speakers Preview */}
                  {evt.speakers && evt.speakers.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-700 mb-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        <span>Featured Speakers & Jurists</span>
                      </div>
                      <div className="space-y-1">
                        {evt.speakers.slice(0, 2).map((spk, idx) => (
                          <div key={idx} className="text-xs truncate">
                            <span className="font-semibold text-slate-800">{spk.name}</span>
                            {spk.affiliation && <span className="text-slate-400"> ({spk.affiliation})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Bottom Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                {isLiveEvent ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setWatchingLiveEvent(evt)}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-700 hover:text-red-800 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-red-700" />
                      <span>{liveStatus === 'live' ? 'Watch Live Now' : 'Watch Stream'}</span>
                    </button>

                    <div className="flex items-center space-x-3">
                      {ytId && (
                        <a
                          href={getYouTubeWatchUrl(ytId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-red-600 inline-flex items-center space-x-1 text-xs"
                          title="Open stream directly on YouTube"
                        >
                          <span>YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {evt.registrationOpen && (
                        isRegistered ? (
                          <span className="inline-flex items-center text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            <span>RSVP</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRegister(evt)}
                            className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                          >
                            RSVP
                          </button>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {evt.seatsLeft ? `${evt.seatsLeft} seats left` : 'Open Access'}
                    </span>

                    {isRegistered ? (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                        <span>RSVP Logged</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegister(evt)}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-amber-800 hover:text-amber-900 group cursor-pointer"
                      >
                        <span>RSVP for Event</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Embedded Live Stream Watch Modal */}
      <LiveEventWatchModal
        event={watchingLiveEvent}
        isOpen={Boolean(watchingLiveEvent)}
        onClose={() => setWatchingLiveEvent(null)}
        onRegisterInterest={handleRegister}
        isRegistered={watchingLiveEvent ? registeredEvents.has(watchingLiveEvent.id) : false}
      />
    </div>
  );
};
