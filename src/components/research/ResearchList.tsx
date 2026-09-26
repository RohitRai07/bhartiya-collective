import React, { useState, useEffect } from 'react';
import { researchService } from '../../services/researchService';
import { ResearchDomain } from '../../types/research';
import { Landmark, BookOpen, Leaf, Compass, ArrowRight, UserCheck } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Landmark: <Landmark className="w-6 h-6 text-amber-600" />,
  BookOpen: <BookOpen className="w-6 h-6 text-amber-600" />,
  Leaf: <Leaf className="w-6 h-6 text-amber-600" />,
  Compass: <Compass className="w-6 h-6 text-amber-600" />,
};

export const ResearchList: React.FC = () => {
  const [domains, setDomains] = useState<ResearchDomain[]>([]);

  useEffect(() => {
    const load = () => researchService.getDomains().then(setDomains);
    load();

    const handleUpdate = () => load();
    window.addEventListener('bharat:content-updated', handleUpdate);
    return () => window.removeEventListener('bharat:content-updated', handleUpdate);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {domains.map((domain) => (
        <div
          key={domain.id}
          className="bg-white rounded-2xl p-7 border border-slate-200 hover:border-amber-400 transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200/60">
                {ICON_MAP[domain.iconName] || <BookOpen className="w-6 h-6 text-amber-600" />}
              </div>
              <span className="text-xs font-serif text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-200/50">
                {domain.sanskritName}
              </span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
              {domain.name}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {domain.description}
            </p>

            <div className="mb-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Core Themes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {domain.keyThemes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-slate-600">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Lead: <strong className="text-slate-800">{domain.leadFellow}</strong></span>
            </div>
            <span className="font-semibold text-amber-800">
              {domain.publishedPapersCount} Papers Published
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
