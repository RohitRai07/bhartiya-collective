import React, { useState, useEffect } from 'react';
import { podcastService } from '../services/podcastService';
import { PodcastEpisode } from '../types/podcast';
import { 
  Play, 
  Clock, 
  User, 
  ExternalLink, 
  X, 
  Tv, 
  Sparkles,
  Share2
} from 'lucide-react';

export const PodcastsPage: React.FC = () => {
  const [podcasts, setPodcasts] = useState<PodcastEpisode[]>([]);
  const [activeVideo, setActiveVideo] = useState<PodcastEpisode | null>(null);

  useEffect(() => {
    const load = () => {
      podcastService.getPodcasts().then(setPodcasts);
    };
    load();

    const handleUpdate = () => load();
    window.addEventListener('bharat:podcast-updated', handleUpdate);
    return () => window.removeEventListener('bharat:podcast-updated', handleUpdate);
  }, []);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Intro Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <Tv className="w-3.5 h-3.5 text-amber-700" />
          <span>Broadcasts & Dialogues</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          Bharat Collective Podcasts
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Deep-dive video dialogues and interviews with distinguished jurists, legal scholars, and policy thinkers exploring constitutional dilemmas and Indian civilizational wisdom.
        </p>
      </div>

      {/* Podcast Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {podcasts.map((episode) => (
          <div
            key={episode.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Thumbnail Container */}
              <div 
                className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
                onClick={() => setActiveVideo(episode)}
              >
                <img
                  src={episode.thumbnailUrl}
                  alt={episode.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 ml-0.5 fill-white" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{episode.duration}</span>
                </div>

                {/* Featured Badge */}
                {episode.featured && (
                  <div className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-xs">
                    Featured
                  </div>
                )}
              </div>

              {/* Content Details */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                    {episode.topic}
                  </span>
                  <span>{episode.date}</span>
                </div>

                <h3 
                  onClick={() => setActiveVideo(episode)}
                  className="font-serif text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors cursor-pointer line-clamp-2"
                >
                  {episode.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {episode.description}
                </p>

                {/* Speaker info */}
                <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 text-xs text-slate-700">
                  <User className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <div className="truncate">
                    <strong className="block text-slate-900 truncate">{episode.speaker}</strong>
                    {episode.speakerRole && (
                      <span className="text-[11px] text-slate-500 block truncate">{episode.speakerRole}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-6 pb-6 pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setActiveVideo(episode)}
                className="font-bold text-amber-700 hover:text-amber-800 inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-amber-700" />
                <span>Watch Episode</span>
              </button>

              <a
                href={episode.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-600 inline-flex items-center space-x-1"
                title="Watch on YouTube"
              >
                <span>YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        ))}
      </div>

      {/* Interactive Video Playback Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <div className="truncate pr-4">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  {activeVideo.topic} • {activeVideo.speaker}
                </span>
                <h4 className="font-serif text-base font-bold truncate">{activeVideo.title}</h4>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* YouTube Embed Player */}
            <div className="relative aspect-video w-full bg-black">
              {activeVideo.youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  <span>Invalid YouTube URL</span>
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-900 text-slate-300 text-xs space-y-2">
              <p className="leading-relaxed">{activeVideo.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span>Duration: {activeVideo.duration}</span>
                <a
                  href={activeVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline inline-flex items-center space-x-1"
                >
                  <span>Open in YouTube App</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
