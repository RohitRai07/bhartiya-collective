import React, { useState, useEffect } from 'react';
import { publicationService } from '../../services/publicationService';
import { Publication, PublicationCategory } from '../../types/publication';
import { BookOpen, Search, Download, FileText, Tag, Calendar, User } from 'lucide-react';

export const PublicationList: React.FC = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PublicationCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await publicationService.getPublications({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
      });
      setPublications(data);
      setLoading(false);
    };
    load();

    const handleUpdate = () => load();
    window.addEventListener('bharat:content-updated', handleUpdate);
    return () => window.removeEventListener('bharat:content-updated', handleUpdate);
  }, [selectedCategory, searchQuery]);

  const categories: (PublicationCategory | 'All')[] = [
    'All',
    'Monograph',
    'Policy Paper',
    'Occasional Paper',
    'Civilizational Brief',
  ];

  return (
    <div className="space-y-6">
      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search papers, themes, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-600"
          />
        </div>
      </div>

      {/* Publications Grid / List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          Loading publications...
        </div>
      ) : publications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No publications matched your criteria.</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the filter or search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-400/80 transition-all flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    {pub.category}
                  </span>
                  <div className="flex items-center text-xs text-slate-400 space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{pub.publishedDate}</span>
                  </div>
                </div>

                <h3 className="font-serif text-xl font-bold text-slate-900 mb-1 leading-snug">
                  {pub.title}
                </h3>
                {pub.subtitle && (
                  <p className="text-xs text-amber-800 font-medium mb-3">
                    {pub.subtitle}
                  </p>
                )}

                <div className="flex items-center text-xs text-slate-600 mb-3 space-x-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-medium">{pub.authors.join(', ')}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{pub.pages} pages</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                  {pub.abstract}
                </p>
              </div>

              <div>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {pub.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600"
                    >
                      <Tag className="w-2.5 h-2.5 mr-1 text-slate-400" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Open Access Monograph</span>
                  <button
                    onClick={() => alert(`Initiating open-access download for: ${pub.title} (PDF)`)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
