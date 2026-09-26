import React from 'react';
import { siteConfig } from '../config/siteConfig';
import { featureConfig } from '../config/featureConfig';
import { FlagshipBanner } from '../components/common/FlagshipBanner';
import { PublicationList } from '../components/publications/PublicationList';
import { EventList } from '../components/events/EventList';
import { ResearchList } from '../components/research/ResearchList';
import { NewsList } from '../components/news/NewsList';
import { 
  Landmark, 
  ArrowRight, 
  Scroll, 
  Heart,
  Users,
  Compass,
  BookOpen,
  Scale
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
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
              Civilizational Wisdom. <br />
              <span className="text-amber-800">Rigorous Inquiry.</span> <br />
              Future-Focused Policy.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed font-normal">
              <strong>{siteConfig.name}</strong> is an independent, non-partisan foundation convening scholars, jurists, scientists, and policy practitioners. We foster national dialogues and research rooted in Indian civilizational values to address contemporary constitutional, economic, and institutional questions.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              {featureConfig.isEnabled('userRegistration') && (
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className="px-6 py-3.5 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25 transition-all flex items-center space-x-2"
                >
                  <span>Join the Community</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigate('/events')}
                className="px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all flex items-center space-x-2"
              >
                <span>#BharatDialogue Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/publications')}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Read Publications
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/circulars')}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 transition-colors flex items-center space-x-1.5"
              >
                <Scale className="w-4 h-4 text-amber-800" />
                <span>Circulars & Legal</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Pillar Banner */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-amber-900/10">
            {[
              { label: 'Dialogues & Symposia', value: 'National Series', desc: 'Apex policy convenings across Bharat' },
              { label: 'Published Papers', value: '65+ Monographs', desc: 'Peer-reviewed open access papers' },
              { label: 'Scholarly Network', value: '40+ Fellows', desc: 'Across premier universities & law academies' },
              { label: 'Public Mission', value: 'Non-Partisan', desc: 'Sustained by independent patronage' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-amber-900/10 shadow-xs">
                <span className="block font-serif text-xl sm:text-2xl font-bold text-amber-900">{stat.value}</span>
                <span className="block text-xs font-bold text-slate-800 mt-1">{stat.label}</span>
                <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">{stat.desc}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Flagship Event Banner (Poster Feature requested by user) */}
      <FlagshipBanner onRegisterClick={() => onNavigate('/register')} />

      {/* Research Domains Section */}
      {featureConfig.isEnabled('research') && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
                Foundational Research
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Core Inquiry Domains
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/research')}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
            >
              <span>Explore All Clusters</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <ResearchList />
        </section>
      )}

      {/* Featured Publications Section */}
      {featureConfig.isEnabled('publications') && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
                Monographs & Policy Briefs
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Featured Scholarly Publications
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/publications')}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <PublicationList />
        </section>
      )}

      {/* Upcoming Events & Symposia Section */}
      {featureConfig.isEnabled('events') && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
                Convenings & Roundtables
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Upcoming #BharatDialogue Series
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/events')}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
            >
              <span>View Full Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <EventList onRegisterInterest={() => onNavigate('/register')} />
        </section>
      )}

      {/* Insights & Perspectives */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
              Discourse
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Insights & Perspectives
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/news')}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
          >
            <span>Read All Articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <NewsList />
      </section>

      {/* Patronage Banner */}
      {featureConfig.isEnabled('donations') && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center space-x-2 text-amber-200 text-xs font-semibold uppercase tracking-wider">
                <Heart className="w-4 h-4 text-amber-300" />
                <span>Patronage for Civilizational Independence</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                Support Open-Access Bharat Scholarship
              </h3>
              <p className="text-amber-100/90 text-xs sm:text-sm leading-relaxed">
                We operate as an independent foundation. Every rupee pledged directly supports visiting fellowships, rare text translations, and public constitutional dialogues.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/support-us')}
              className="px-8 py-3.5 rounded-xl font-bold text-sm bg-white text-amber-950 hover:bg-amber-50 shadow-md transition-all flex-shrink-0"
            >
              Support the Foundation
            </button>
          </div>
        </section>
      )}

    </div>
  );
};
