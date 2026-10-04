import React, { useState, useEffect } from 'react';
import { newsService } from '../../services/newsService';
import { taxonomyService } from '../../services/taxonomyService';
import { NewsArticle } from '../../types/news';
import { Calendar, Clock, User } from 'lucide-react';

export const NewsList: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>(() => [
    'All',
    ...taxonomyService.getOptions('news_category').map(o => o.value),
  ]);

  useEffect(() => {
    const load = () => newsService.getNews().then(setArticles);
    load();

    const handleUpdate = () => {
      load();
      setCategories([
        'All',
        ...taxonomyService.getOptions('news_category').map(o => o.value),
      ]);
    };
    window.addEventListener('bharat:content-updated', handleUpdate);
    window.addEventListener('bharat:taxonomy-updated', handleUpdate);
    return () => {
      window.removeEventListener('bharat:content-updated', handleUpdate);
      window.removeEventListener('bharat:taxonomy-updated', handleUpdate);
    };
  }, []);

  const filteredArticles = articles.filter(item => {
    if (selectedCategory === 'All') return true;
    return (item.category || '').toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Dynamic News Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-amber-800 text-white shadow-xs font-bold'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {cat === 'All' ? 'All Perspectives & News' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredArticles.map((item) => (
        <article
          key={item.id}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-amber-400 transition-all shadow-sm"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                {item.category}
              </span>
              <span className="text-slate-400 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {item.readTime}
              </span>
            </div>

            <h3 className="font-serif text-lg font-bold text-slate-900 mb-2 leading-snug">
              {item.title}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {item.excerpt}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.author}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{item.publishedDate}</span>
            </div>
          </div>
        </article>
      ))}
      </div>
    </div>
  );
};
