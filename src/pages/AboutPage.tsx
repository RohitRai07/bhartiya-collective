import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';
import { expertService } from '../services/expertService';
import { taxonomyService } from '../services/taxonomyService';
import { ScholarExpert } from '../types/expert';
import { Landmark, Scroll, Compass, Shield, Award, Users } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [experts, setExperts] = useState<ScholarExpert[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [roles, setRoles] = useState<{ value: string; label: string }[]>(() => [
    { value: 'All', label: 'All Faculty & Council' },
    ...taxonomyService.getOptions('expert_role'),
  ]);

  useEffect(() => {
    const load = () => {
      expertService.getExperts().then(setExperts);
    };
    load();

    const handleUpdate = () => {
      load();
      setRoles([
        { value: 'All', label: 'All Faculty & Council' },
        ...taxonomyService.getOptions('expert_role'),
      ]);
    };
    window.addEventListener('bharat:content-updated', handleUpdate);
    window.addEventListener('bharat:taxonomy-updated', handleUpdate);
    return () => {
      window.removeEventListener('bharat:content-updated', handleUpdate);
      window.removeEventListener('bharat:taxonomy-updated', handleUpdate);
    };
  }, []);

  const filteredExperts = experts.filter(exp => {
    if (selectedRole === 'All') return true;
    return (exp.councilRole || '').toLowerCase() === selectedRole.toLowerCase();
  });

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          Civilizational Charter
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          About Bharat Collective Foundation
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Founded in {siteConfig.establishedYear}, Bharat Collective Foundation emerged from the imperative to build an independent, rigorous epistemic community capable of formulating civilizational discourse for a multipolar era.
        </p>
      </div>

      {/* Mission & Philosophy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Our Core Tenet
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
            Decolonizing Intellectual Frameworks Through Rigorous Scholarship
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            For decades, public policy and social inquiry in India have relied heavily on Eurocentric cognitive models that overlook indigenous administrative, ecological, and philosophical treatises.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            The Collective does not advocate dogma; rather, we champion critical inquiry using classical Pramana Shastra (epistemology), empirical fieldwork, and comparative international jurisprudence.
          </p>
        </div>

        <div className="space-y-3 bg-amber-50/50 p-6 rounded-2xl border border-amber-200/60 text-xs">
          <div className="p-3 bg-white rounded-xl shadow-2xs">
            <h4 className="font-bold text-slate-900">1. Intellectual Sovereignty (Swa-dharma)</h4>
            <p className="text-slate-500 mt-1">Formulating policy categories from indigenous civilizational realities rather than uncritical imports.</p>
          </div>
          <div className="p-3 bg-white rounded-xl shadow-2xs">
            <h4 className="font-bold text-slate-900">2. Empirical Rigour (Pramana)</h4>
            <p className="text-slate-500 mt-1">Every monograph and policy brief is subjected to double-blind scholarly peer review.</p>
          </div>
          <div className="p-3 bg-white rounded-xl shadow-2xs">
            <h4 className="font-bold text-slate-900">3. Universal Welfare (Sarve Bhavantu Sukhinah)</h4>
            <p className="text-slate-500 mt-1">Advancing environmental sustainability, social cohesion, and equitable decentralized prosperity.</p>
          </div>
        </div>
      </div>

      {/* Advisory Council & Fellows */}
      <section id="advisory" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Faculty & Fellows
          </span>
          <h2 className="font-serif text-3xl font-bold text-slate-900">
            Advisory Council & Senior Fellows
          </h2>
          <p className="text-xs text-slate-500">
            Distinguished thinkers guiding our research initiatives and academic integrity.
          </p>
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {roles.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRole(r.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                selectedRole === r.value
                  ? 'bg-amber-800 text-white shadow-xs font-bold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredExperts.map((expert) => (
            <div
              key={expert.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col justify-between hover:border-amber-400 transition-all shadow-xs"
            >
              <div>
                <img
                  src={expert.photoUrl}
                  alt={expert.name}
                  className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-amber-200 mx-auto"
                />
                {expert.councilRole && (
                  <div className="text-center mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      {expert.councilRole.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                <h3 className="font-serif text-base font-bold text-slate-900 text-center">
                  {expert.name}
                </h3>
                <p className="text-[11px] font-semibold text-amber-800 text-center mb-1">
                  {expert.designation}
                </p>
                <p className="text-[10px] text-slate-400 text-center mb-3">
                  {expert.institution}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                  {expert.biography}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                {expert.focusAreas.map((f, i) => (
                  <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Research Integrity & Ethics */}
      <section id="ethics" className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-4">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          <span>Scholarly Integrity & Non-Partisan Charter</span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold">
          Code of Academic & Ethical Conduct
        </h3>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
          Bharat Collective Foundation operates strictly in accordance with international academic ethics. All publications, datasets, and monograph drafts are open for critical replication. We maintain complete independence from political parties, private corporate sponsors, and partisan agendas.
        </p>
      </section>

    </div>
  );
};
