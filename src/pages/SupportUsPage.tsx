import React from 'react';
import { DonationSection } from '../components/donation/DonationSection';
import { siteConfig } from '../config/siteConfig';
import { featureConfig } from '../config/featureConfig';
import { Heart, ShieldCheck, FileCheck, CheckCircle2, Lock, Landmark } from 'lucide-react';

export const SupportUsPage: React.FC = () => {
  const isDonationActive = featureConfig.isEnabled('donations');

  if (!isDonationActive) {
    return (
      <div className="py-20 px-4 max-w-xl mx-auto text-center space-y-4">
        <Heart className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-800">Contributions Temporarily Closed</h2>
        <p className="text-xs text-slate-500">
          The patronage section is currently disabled via feature configuration (<code className="font-mono">featureConfig.donations = false</code>). The remainder of the website continues to function seamlessly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      
      {/* Top Banner */}
      <section className="bg-gradient-to-b from-amber-500/10 to-transparent pt-12 pb-8 border-b border-amber-900/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            Scholarly Independence
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
            Patronage & Research Endowment
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Support foundational Indian thought, translation of rare manuscripts, and public policy formulation free from corporate lobbying or partisan constraints.
          </p>
        </div>
      </section>

      {/* Main Donation Section */}
      <DonationSection />

      {/* Trust & Transparency Pillars */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-slate-900 text-sm">80G & 12A Compliance</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Donations qualify for Indian income tax exemption under Section 80G. Valid PAN numbers are logged for tax receipt generation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <FileCheck className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-slate-900 text-sm">Audited Disclosures</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Annual financial statements and fund allocations to fellowships, monographs, and research grants are published transparently.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <Landmark className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-slate-900 text-sm">Institutional Autonomy</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Funding sources have zero editorial control or veto power over peer-reviewed monographs or faculty findings.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
