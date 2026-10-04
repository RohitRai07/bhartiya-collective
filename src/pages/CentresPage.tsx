import React, { useState, useEffect } from 'react';
import { centreService } from '../services/centreService';
import { BharatCentre } from '../data/centresData';
import { featureConfig } from '../config/featureConfig';
import { Scale, Users, Landmark, Heart, Shield, Compass, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CentresPageProps {
  onNavigate?: (path: string) => void;
  selectedCentreId?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Scale: <Scale className="w-6 h-6 text-amber-600" />,
  Users: <Users className="w-6 h-6 text-amber-600" />,
  Landmark: <Landmark className="w-6 h-6 text-amber-600" />,
  Heart: <Heart className="w-6 h-6 text-amber-600" />,
  Shield: <Shield className="w-6 h-6 text-amber-600" />,
  Compass: <Compass className="w-6 h-6 text-amber-600" />,
};

export const CentresPage: React.FC<CentresPageProps> = ({ onNavigate, selectedCentreId }) => {
  const [activeCentre, setActiveCentre] = useState<string>(selectedCentreId || 'all');
  const [isCentresActive, setIsCentresActive] = useState(featureConfig.isEnabled('research'));
  const [centresList, setCentresList] = useState<BharatCentre[]>(() => 
    centreService.getAll().filter(c => c.status !== 'draft')
  );

  useEffect(() => {
    const handleUpdate = () => setIsCentresActive(featureConfig.isEnabled('research'));
    const handleContentUpdate = () => {
      setCentresList(centreService.getAll().filter(c => c.status !== 'draft'));
    };
    window.addEventListener('bhartiya:feature-change', handleUpdate);
    window.addEventListener('bharat:content-updated', handleContentUpdate);
    return () => {
      window.removeEventListener('bhartiya:feature-change', handleUpdate);
      window.removeEventListener('bharat:content-updated', handleContentUpdate);
    };
  }, []);

  useEffect(() => {
    if (selectedCentreId) {
      setActiveCentre(selectedCentreId);
    }
  }, [selectedCentreId]);

  if (!isCentresActive) {
    return (
      <div className="py-24 px-4 max-w-xl mx-auto text-center space-y-4">
        <Compass className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-800">Centres & Domains Inactive</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The research centres and specialized working domains are currently deactivated via administrative configuration (<code className="font-mono">featureConfig.research = false</code>).
        </p>
      </div>
    );
  }

  const displayedCentres = activeCentre === 'all' 
    ? centresList 
    : centresList.filter(c => c.id === activeCentre || c.slug === activeCentre);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3.5 py-1 rounded-full">
          Thematic Institutes
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          Bharat Collective Centres
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Six specialized centres spearheading frontline research, legislative analysis, legal aid, social equity, and technology governance grounded in civilizational wisdom.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setActiveCentre('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeCentre === 'all'
              ? 'bg-amber-800 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          All ({centresList.length}) Centres
        </button>
        {centresList.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCentre(c.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeCentre === c.id
                ? 'bg-amber-800 text-white shadow-sm font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            {c.shortName}
          </button>
        ))}
      </div>

      {/* Centres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayedCentres.map(centre => (
          <div
            key={centre.id}
            id={centre.slug}
            className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center">
                  {ICON_MAP[centre.icon] || <Compass className="w-6 h-6 text-amber-600" />}
                </div>
                <span className="text-xs font-serif text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60 font-medium">
                  {centre.sanskritName}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900">
                  {centre.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  {centre.description}
                </p>
              </div>

              {/* Core Themes */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Key Inquiry Themes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {centre.keyThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* Focus Areas */}
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                  Actionable Focus Areas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  {centre.focusAreas.map((area, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-slate-600">
                Lead: <strong className="text-slate-900">{centre.leadFellow}</strong>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className="font-bold text-amber-700 hover:text-amber-800 inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>Apply for Fellowships</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
