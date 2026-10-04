import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';
import { featureConfig } from '../config/featureConfig';
import { FlagshipBanner } from '../components/common/FlagshipBanner';
import { EventList } from '../components/events/EventList';
import { BHARAT_CENTRES } from '../data/centresData';
import { 
  ArrowRight, 
  Scroll, 
  Heart,
  Scale,
  Users,
  Landmark,
  Shield,
  Compass
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

const CENTRE_ICON_MAP: Record<string, React.ReactNode> = {
  Scale: <Scale className="w-5 h-5 text-amber-700" />,
  Users: <Users className="w-5 h-5 text-amber-700" />,
  Landmark: <Landmark className="w-5 h-5 text-amber-700" />,
  Heart: <Heart className="w-5 h-5 text-amber-700" />,
  Shield: <Shield className="w-5 h-5 text-amber-700" />,
  Compass: <Compass className="w-5 h-5 text-amber-700" />,
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [features, setFeatures] = useState(featureConfig.get());

  useEffect(() => {
    const handleFeatureChange = () => {
      setFeatures(featureConfig.get());
    };
    window.addEventListener('bhartiya:feature-change', handleFeatureChange);
    return () => window.removeEventListener('bhartiya:feature-change', handleFeatureChange);
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-50/40 to-transparent pt-12 sm:pt-16 pb-16 sm:pb-20 border-b border-amber-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200/80 text-amber-900 text-xs font-bold tracking-wide">
              <Scroll className="w-3.5 h-3.5 text-amber-700" />
              <span>{siteConfig.tagline}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.15] tracking-tight">
              Empowering Citizens. <br />
              <span className="text-amber-800">Advancing Policy.</span> <br />
              Transforming Bharat.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed font-normal">
              <strong>{siteConfig.name}</strong> is an independent, non-partisan institution bridging legal aid, grassroots empowerment, and policy reform. We unite jurists, scholars, and policy practitioners to protect fundamental rights and shape future-ready governance rooted in Indian values.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              {features.userRegistration && (
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className="px-6 py-3.5 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <span>Join Us</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigate('/events')}
                className="px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>#BharatDialogue Event</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/centres')}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Our Centres
              </button>

              {features.circulars && (
                <button
                  type="button"
                  onClick={() => onNavigate('/circulars')}
                  className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Scale className="w-4 h-4 text-amber-800" />
                  <span>Circulars & Legal</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Flagship Event Banner */}
      {features.flagshipBanner && (
        <FlagshipBanner onRegisterClick={() => onNavigate('/register')} />
      )}

      {/* Bharat Collective Centers Section (Specification 18 & 20) */}
      {features.research && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
                Institutes & Thematic Wings
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Bharat Collective Centers
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/centres')}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1 cursor-pointer"
            >
              <span>Explore All 6 Centres</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6 Specialized Centres Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BHARAT_CENTRES.map((centre) => (
              <div
                key={centre.id}
                onClick={() => onNavigate(`/centres`)}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {CENTRE_ICON_MAP[centre.icon] || <Compass className="w-5 h-5 text-amber-700" />}
                    </div>
                    <span className="text-[11px] font-serif text-amber-900 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/50">
                      {centre.sanskritName}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    {centre.name}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {centre.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {centre.keyThemes.slice(0, 2).map((t, i) => (
                      <span key={i} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-amber-800 font-semibold">
                  <span>View Center Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events Conclave Section (Specification 21) */}
      {features.events && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
                Upcoming Events
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Upcoming #BharatDialogue Conclave
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/events')}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1 cursor-pointer"
            >
              <span>View Full Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <EventList onRegisterInterest={() => onNavigate('/register')} />
        </section>
      )}

      {/* Independent Foundation Support Banner (Specification 22) */}
      {features.donations && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                Support Bharat Collective Foundation
              </h3>
              <p className="text-amber-100/90 text-xs sm:text-sm leading-relaxed">
                Empower justice, drive policy reform, and support communities in need. Your contribution directly funds pro bono legal assistance, policy research, and public dialogues across India
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/support-us')}
              className="px-8 py-3.5 rounded-xl font-bold text-sm bg-white text-amber-950 hover:bg-amber-50 shadow-md transition-all flex-shrink-0 cursor-pointer"
            >
              Support Us
            </button>
          </div>
        </section>
      )}

    </div>
  );
};
