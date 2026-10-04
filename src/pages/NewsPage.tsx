import React, { useState, useEffect } from 'react';
import { NewsList } from '../components/news/NewsList';
import { featureConfig } from '../config/featureConfig';
import { Newspaper } from 'lucide-react';

export const NewsPage: React.FC = () => {
  const [isNewsActive, setIsNewsActive] = useState(featureConfig.isEnabled('news'));

  useEffect(() => {
    const handleUpdate = () => setIsNewsActive(featureConfig.isEnabled('news'));
    window.addEventListener('bhartiya:feature-change', handleUpdate);
    return () => window.removeEventListener('bhartiya:feature-change', handleUpdate);
  }, []);

  if (!isNewsActive) {
    return (
      <div className="py-24 px-4 max-w-xl mx-auto text-center space-y-4">
        <Newspaper className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-800">Insights Section Inactive</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The insights, communiques, and essays section is currently deactivated via administrative configuration (<code className="font-mono">featureConfig.news = false</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          Discourse & Perspectives
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          Insights, Communiques & Essays
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Contemporary analyses, conference communiques, and short essays exploring Indian civilizational perspectives on current global issues.
        </p>
      </div>

      <NewsList />
    </div>
  );
};
