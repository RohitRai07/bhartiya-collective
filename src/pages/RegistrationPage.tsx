import React from 'react';
import { RegistrationForm } from '../components/registration/RegistrationForm';
import { featureConfig } from '../config/featureConfig';
import { ShieldCheck, Award, BookOpen, Users, Compass, CheckCircle2 } from 'lucide-react';

export const RegistrationPage: React.FC = () => {
  const isRegistrationActive = featureConfig.isEnabled('userRegistration');

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Intro Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>Academic Admissions & Fellowship Intake</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Join Bharat Collective Foundation
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Open to university students, research scholars, academic faculty, and intellectuals committed to civilizational inquiry and public discourse.
        </p>
      </div>

      {/* Feature Flag Disabled Guard (Demonstrating Section 7) */}
      {!isRegistrationActive ? (
        <div className="max-w-xl mx-auto p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
          <Users className="w-10 h-10 text-amber-700 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-amber-950">Registration Window Closed</h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            The registration portal is temporarily deactivated via feature configuration (<code className="font-mono">featureConfig.userRegistration = false</code>). In accordance with non-breaking architecture rules, the rest of the site remains fully operational.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Why Join / Guidelines */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Scholar Membership Benefits
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Access to non-public archival monographs and translation databases.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Priority invitation to national roundtables and symposia.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Eligibility for research travel stipends and visiting fellowships.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Peer-review support for young scholars publishing in indexed journals.</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-200/70 text-xs text-slate-700 space-y-2">
              <h4 className="font-semibold text-amber-950">Institutional Protocol</h4>
              <p className="text-slate-600 leading-relaxed">
                All registrations are assigned a unique tracking identifier (e.g., <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">BC-2026-REG-XXXX</code>). Your postal code auto-resolves your institutional cluster for regional research convenings.
              </p>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-8">
            <RegistrationForm />
          </div>

        </div>
      )}

    </div>
  );
};
