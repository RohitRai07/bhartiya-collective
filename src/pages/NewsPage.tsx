import React from 'react';
import { NewsList } from '../components/news/NewsList';
import { FileText } from 'lucide-react';

export const NewsPage: React.FC = () => {
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
