import React from 'react';
import { RegistrationForm } from '../components/registration/RegistrationForm';
import { featureConfig } from '../config/featureConfig';
import { ShieldCheck, Users } from 'lucide-react';

export const RegistrationPage: React.FC = () => {
  const isRegistrationActive = featureConfig.isEnabled('userRegistration');

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Intro Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>Membership & Volunteer Form</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Join Bharat Collective Foundation
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Open to students, researchers, Lawyer's, academician, Legal Experts and intellectuals committed to civilizational inquiry and public discourse.
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
        <div className="max-w-4xl mx-auto">
          <RegistrationForm />
        </div>
      )}

    </div>
  );
};
