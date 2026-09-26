import React from 'react';
import { ResearchList } from '../components/research/ResearchList';
import { BookOpen, Compass, Layers, ShieldCheck } from 'lucide-react';

export const ResearchPage: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          Epistemic Inquiry
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          Research Domains & Thematic Clusters
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Our research programmes are designed to formulate constructive paradigms across administration, traditional knowledge systems, decentralized economics, and geopolitical strategy.
        </p>
      </div>

      <ResearchList />

      {/* Methodology Banner */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-slate-900">Primary Source Exegesis</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct engagement with Sanskrit, Prakrit, Tamil, and regional manuscripts without intermediary colonial biases.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-slate-900">Empirical Ground-Truthing</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Combining theoretical paradigms with field surveys, grassroots ecological audits, and econometric modeling.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-serif text-base font-bold text-slate-900">Policy-Ready Translation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transforming civilizational insights into actionable legislative briefs, administrative guidelines, and university curricula.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
