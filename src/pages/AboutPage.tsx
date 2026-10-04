import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/siteConfig';
import { featureConfig } from '../config/featureConfig';
import { expertService } from '../services/expertService';
import { teamService } from '../services/teamService';
import { taxonomyService } from '../services/taxonomyService';
import { ScholarExpert } from '../types/expert';
import { NationalTeamMember, StateChapter } from '../types/team';
import { Landmark, Scroll, Compass, Shield, Award, Users, MapPin, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [experts, setExperts] = useState<ScholarExpert[]>([]);
  const [nationalTeam, setNationalTeam] = useState<NationalTeamMember[]>([]);
  const [stateChapters, setStateChapters] = useState<StateChapter[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [roles, setRoles] = useState<{ value: string; label: string }[]>(() => [
    { value: 'All', label: 'All Faculty & Council' },
    ...taxonomyService.getOptions('expert_role'),
  ]);

  useEffect(() => {
    const load = () => {
      expertService.getExperts().then(setExperts);
      teamService.getNationalTeam().then(setNationalTeam);
      teamService.getStateChapters().then(setStateChapters);
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
    window.addEventListener('bhartiya:feature-change', handleUpdate);
    return () => {
      window.removeEventListener('bharat:content-updated', handleUpdate);
      window.removeEventListener('bharat:taxonomy-updated', handleUpdate);
      window.removeEventListener('bhartiya:feature-change', handleUpdate);
    };
  }, []);

  // Smooth scroll handler for anchor links #who-is-who, #national-team, #state-team
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('#')) {
        const targetId = hash.split('#').pop();
        if (targetId) {
          const element = document.getElementById(targetId);
          if (element) {
            setTimeout(() => {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }
        }
      }
    };

    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
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

      {/* SECTION 1: Who is Who (Toggleable via featureConfig) */}
      {featureConfig.isEnabled('experts') && filteredExperts.length > 0 && (
        <section id="who-is-who" className="space-y-8 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              The Foundation
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900">
              Who is Who
            </h2>
            <p className="text-xs text-slate-500">
              Governing Council, Trustees, and Advisory Council guiding our institutional mission and academic integrity.
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
      )}

      {/* SECTION 2: National Team (Toggleable via featureConfig) */}
      {featureConfig.isEnabled('nationalTeam') && nationalTeam.length > 0 && (
        <section id="national-team" className="space-y-8 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Executive Leadership
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900">
              National Team
            </h2>
            <p className="text-xs text-slate-500">
              Central leadership orchestrating research programs, legal aid advocacy, symposium conclaves, and policy formulation nationwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nationalTeam.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 inline-block">
                    {item.role}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs font-semibold text-slate-500">{item.affiliation}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: State Team (Toggleable via featureConfig) */}
      {featureConfig.isEnabled('stateTeam') && stateChapters.length > 0 && (
        <section id="state-team" className="space-y-8 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              State Chapters & Conveners
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900">
              State Team & Regional Chapters
            </h2>
            <p className="text-xs text-slate-500">
              State chapter coordinators mobilizing law student networks, local legal aid clinics, and state-level policy roundtables.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stateChapters.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center space-x-1.5 text-xs text-amber-800 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{item.state}</span>
                </div>
                <h4 className="font-serif font-bold text-slate-900 text-sm">{item.convener}</h4>
                <p className="text-[11px] text-slate-500 font-medium">Base: {item.city}</p>
                <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">{item.focus}</p>
              </div>
            ))}
          </div>
        </section>
      )}

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
