import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ArrowRight, Sparkles, Download } from 'lucide-react';
import { siteConfig } from '../../config/siteConfig';
import { flagshipService, FlagshipBannerContent, DEFAULT_FLAGSHIP_BANNER } from '../../services/flagshipService';
import { resolveEventImage } from '../../utils/eventImage';

interface FlagshipBannerProps {
  onRegisterClick?: () => void;
}

export const FlagshipBanner: React.FC<FlagshipBannerProps> = ({ onRegisterClick }) => {
  const [content, setContent] = useState<FlagshipBannerContent>(DEFAULT_FLAGSHIP_BANNER);

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      try {
        const data = await flagshipService.getFlagshipBanner();
        if (mounted && data) {
          setContent(data);
        }
      } catch (err) {
        console.error('Failed to load flagship banner:', err);
      }
    };

    loadContent();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'flagship' || customEvent.detail.type === 'all') {
        loadContent();
      }
    };

    window.addEventListener('bharat:content-updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('bharat:content-updated', handleUpdate);
    };
  }, []);

  // If hidden by admin or saved as draft, do not display on the public site
  if (!content.isVisible || content.status === 'draft') {
    return null;
  }

  const posterImageSrc = resolveEventImage(content.posterUrl || DEFAULT_FLAGSHIP_BANNER.posterUrl);
  const presenter = content.presenterText || `${siteConfig.name} Presents`;

  return (
    <section className="relative overflow-hidden my-8 sm:my-12" data-testid="flagship-banner-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 rounded-3xl border-2 border-amber-500/30 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-white">
              
              <div className="flex flex-wrap items-center gap-2">
                {content.badge1 && (
                  <span className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{content.badge1}</span>
                  </span>
                )}
                {content.badge2 && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                    {content.badge2}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-amber-300 font-semibold mb-2">
                  {presenter}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                  {content.title} {content.titleHighlight && (
                    <span className="text-amber-400 block text-2xl sm:text-3xl lg:text-4xl mt-1">
                      {content.titleHighlight}
                    </span>
                  )}
                </h2>
                {content.subtitle && (
                  <p className="text-sm sm:text-base text-amber-100/90 font-serif italic mt-2">
                    {content.subtitle}
                  </p>
                )}
              </div>

              {content.description && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  {content.description}
                </p>
              )}

              {/* Venue & Details Pills */}
              {(content.venueName || content.venueAddress || content.scheduleInfo) && (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
                  {(content.venueName || content.venueAddress) && (
                    <div className="flex items-start space-x-3 text-xs sm:text-sm text-slate-200">
                      <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        {content.venueName && (
                          <strong className="block text-white font-medium text-sm">
                            {content.venueName.startsWith('Venue:') ? content.venueName : `Venue: ${content.venueName}`}
                          </strong>
                        )}
                        {content.venueAddress && (
                          <span className="text-slate-300 text-xs">{content.venueAddress}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {content.scheduleInfo && (
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-200 pt-2 border-t border-white/10">
                      <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="font-medium text-amber-200">{content.scheduleInfo}</span>
                    </div>
                  )}
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {onRegisterClick ? (
                  <button
                    type="button"
                    onClick={onRegisterClick}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <span>{content.ctaText || 'Pre-Register / RSVP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : content.ctaLink ? (
                  <a
                    href={content.ctaLink.startsWith('http') ? content.ctaLink : `${import.meta.env.BASE_URL}${content.ctaLink.replace(/^\//, '')}`}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <span>{content.ctaText || 'Pre-Register / RSVP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : null}

                {posterImageSrc && (
                  <a
                    href={posterImageSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>View Official Poster</span>
                  </a>
                )}
              </div>

            </div>

            {/* Right Poster Column */}
            {posterImageSrc && (
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative group max-w-sm rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-400/40 bg-white">
                  <img
                    src={posterImageSrc}
                    alt={`${content.title} ${content.titleHighlight} - ${content.venueName}`}
                    className="w-full h-auto object-cover transform group-hover:scale-102 transition-transform duration-300"
                  />
                  {content.posterCaption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-xs font-serif italic text-center w-full">
                        {content.posterCaption}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </section>
  );
};
