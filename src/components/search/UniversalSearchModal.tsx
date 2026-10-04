import React, { useState, useEffect, useRef } from 'react';
import { searchService, SearchResultItem, SearchCategory } from '../../services/searchService';
import { 
  Search, 
  X, 
  BookOpen, 
  Calendar, 
  Video, 
  Scale, 
  Users, 
  MapPin, 
  ArrowRight, 
  Landmark, 
  Briefcase, 
  FileText,
  CornerDownLeft,
  Loader2,
  Sparkles
} from 'lucide-react';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Perform search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const hits = await searchService.search(query);
        setResults(hits);
        setSelectedIndex(0);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter results by selected category tab
  const filteredResults = results.filter(item => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'centres') return item.category === 'centre';
    if (selectedCategory === 'publications') return item.category === 'publication';
    if (selectedCategory === 'events') return item.category === 'event';
    if (selectedCategory === 'podcasts') return item.category === 'podcast';
    if (selectedCategory === 'legal') return item.category === 'circular';
    if (selectedCategory === 'team') return ['scholar', 'team', 'chapter'].includes(item.category);
    return true;
  });

  // Handle arrow key navigation & Enter
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    onNavigate(item.path);
    onClose();

    // If path contains an anchor hash, trigger smooth scroll
    if (item.path.includes('#')) {
      const hash = item.path.split('#')[1];
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  if (!isOpen) return null;

  const getCategoryIcon = (category: SearchCategory) => {
    switch (category) {
      case 'centre': return <Landmark className="w-4 h-4 text-amber-700" />;
      case 'publication': return <BookOpen className="w-4 h-4 text-blue-700" />;
      case 'event': return <Calendar className="w-4 h-4 text-purple-700" />;
      case 'podcast': return <Video className="w-4 h-4 text-red-600" />;
      case 'magazine': return <BookOpen className="w-4 h-4 text-emerald-700" />;
      case 'circular': return <Scale className="w-4 h-4 text-amber-800" />;
      case 'scholar':
      case 'team': return <Users className="w-4 h-4 text-indigo-700" />;
      case 'chapter': return <MapPin className="w-4 h-4 text-amber-700" />;
      case 'career': return <Briefcase className="w-4 h-4 text-emerald-700" />;
      default: return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20 animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Universal search modal"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center space-x-2.5 sm:space-x-3 bg-white sticky top-0 z-10">
          <Search className="w-5 h-5 text-amber-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search centres, research, events, circulars, team, podcasts..."
            className="w-full text-sm sm:text-base text-slate-900 placeholder-slate-400 bg-transparent outline-hidden font-medium"
          />
          {loading && <Loader2 className="w-4 h-4 text-amber-700 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer shrink-0 transition-colors"
              title="Clear text"
            >
              Clear
            </button>
          )}
          {/* Prominent Cross Icon (X) to Close on Mobile & Desktop */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 rounded-xl cursor-pointer shrink-0 transition-colors flex items-center justify-center border border-slate-200/80"
            aria-label="Close search"
            title="Close search"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'centres', label: 'Centres' },
            { id: 'publications', label: 'Publications' },
            { id: 'events', label: 'Events' },
            { id: 'podcasts', label: 'Podcasts' },
            { id: 'legal', label: 'Legal & Circulars' },
            { id: 'team', label: 'People & Team' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedCategory(tab.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-amber-800 text-white font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div ref={resultsContainerRef} className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
          {query.trim() === '' ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-slate-900 text-base">Universal Search</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Type any keyword to instantly search centres, constitutional circulars, events, faculty, executive leadership, or podcasts.
                </p>
              </div>

              {/* Quick Suggestions */}
              <div className="pt-2 flex flex-wrap justify-center gap-1.5 text-xs">
                {['Uniform Civil Code', 'National Team', 'Labour Rights', 'BNS 2023', 'Sai Deepak', 'State Chapters', 'Podcast'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 rounded-lg border border-slate-200 hover:border-amber-300 font-medium cursor-pointer transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="font-serif text-slate-800 font-bold text-base">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500">
                Try searching for alternate keywords such as &ldquo;Centres&rdquo;, &ldquo;Events&rdquo;, &ldquo;National Team&rdquo;, or &ldquo;Legal&rdquo;.
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-50/80 border border-amber-200/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-serif font-bold text-sm text-slate-900 truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                          {item.categoryLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-amber-800 shrink-0">
                    <span className="text-[11px] font-semibold hidden sm:inline">Navigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Key Hints */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] flex items-center">
                <CornerDownLeft className="w-2.5 h-2.5" />
              </kbd>
              <span>to select</span>
            </span>
          </div>

          <span className="text-slate-400">
            {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>
    </div>
  );
};
