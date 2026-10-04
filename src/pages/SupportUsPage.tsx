import React from 'react';
import { DonationSection } from '../components/donation/DonationSection';
import { featureConfig } from '../config/featureConfig';
import { Heart } from 'lucide-react';

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
      
      {/* Top Header */}
      <section className="bg-gradient-to-b from-amber-500/10 to-transparent pt-12 pb-6 border-b border-amber-900/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 text-amber-700" />
            <span>Support Us</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            Support Bharat Collective Foundation
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Empower justice, drive policy reform, and support communities in need. Your contribution directly funds pro bono legal assistance, policy research, and public dialogues across India
          </p>
        </div>
      </section>

      {/* Main Donation Section */}
      <DonationSection />

    </div>
  );
};
