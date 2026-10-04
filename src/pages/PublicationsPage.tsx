import React, { useState, useEffect } from 'react';
import { PublicationList } from '../components/publications/PublicationList';
import { featureConfig } from '../config/featureConfig';
import { FileText } from 'lucide-react';

export const PublicationsPage: React.FC = () => {
  const [isPublicationsActive, setIsPublicationsActive] = useState(featureConfig.isEnabled('publications'));

  useEffect(() => {
    const handleUpdate = () => setIsPublicationsActive(featureConfig.isEnabled('publications'));
    window.addEventListener('bhartiya:feature-change', handleUpdate);
    return () => window.removeEventListener('bhartiya:feature-change', handleUpdate);
  }, []);

  if (!isPublicationsActive) {
    return (
      <div className="py-24 px-4 max-w-xl mx-auto text-center space-y-4">
        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-800">Publications Repository Inactive</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The publications repository is currently deactivated via administrative configuration (<code className="font-mono">featureConfig.publications = false</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          Scholarly Repository
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          Publications & Working Papers
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Peer-reviewed monographs, policy briefs, and occasional papers published under Creative Commons open-access licensing.
        </p>
      </div>

      <PublicationList />
    </div>
  );
};
