import React, { useState, useEffect } from 'react';
import { newsService } from '../../services/newsService';
import { NewsArticle } from '../../types/news';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';

export const NewsList: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const load = () => newsService.getNews().then(setArticles);
    load();

    const handleUpdate = () => load();
    window.addEventListener('bharat:content-updated', handleUpdate);
    return () => window.removeEventListener('bharat:content-updated', handleUpdate);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {articles.map((item) => (
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
  );
};
