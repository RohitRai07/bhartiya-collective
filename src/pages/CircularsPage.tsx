import React, { useState, useEffect } from 'react';
import { Circular, CircularCategory } from '../types/circular';
import { circularService } from '../services/circularService';
import { CircularCard } from '../components/circulars/CircularCard';
import { CircularPreviewModal } from '../components/circulars/CircularPreviewModal';
import { 
  Scale, 
  Search, 
  Filter, 
  BookOpen, 
  Download, 
  Layers, 
  Sparkles, 
  Building2, 
  FileText,
  RotateCcw,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';

interface CircularsPageProps {
  onNavigate?: (path: string) => void;
}

export const CircularsPage: React.FC<CircularsPageProps> = () => {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CircularCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'landmark' | 'newest' | 'downloads' | 'title'>('landmark');
  const [previewingCircular, setPreviewingCircular] = useState<Circular | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, counts] = await Promise.all([
        circularService.getCirculars(),
        circularService.getCategoryCounts(),
      ]);
      setCirculars(list);
      setCategoryCounts(counts);
    } catch (err) {
      console.error('Failed to load circulars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('bharat:content-updated', handleUpdate);
    return () => window.removeEventListener('bharat:content-updated', handleUpdate);
  }, []);

  // Filter and sort items
  const filteredCirculars = circulars
    .filter(c => {
      // Category filter
      if (selectedCategory !== 'all' && c.category !== selectedCategory) {
        return false;
      }
      // Authority filter
      if (selectedAuthority !== 'all' && !c.issuingAuthority.toLowerCase().includes(selectedAuthority.toLowerCase())) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = c.title.toLowerCase().includes(q) || c.shortTitle.toLowerCase().includes(q);
        const matchesRef = c.circularNumber.toLowerCase().includes(q);
        const matchesAuth = c.issuingAuthority.toLowerCase().includes(q);
        const matchesSummary = c.summary.toLowerCase().includes(q);
        const matchesTags = c.tags.some(t => t.toLowerCase().includes(q));
        const matchesProvisions = c.keyProvisions?.some(p => p.toLowerCase().includes(q));
        return matchesTitle || matchesRef || matchesAuth || matchesSummary || matchesTags || matchesProvisions;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'landmark') {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      }
      if (sortBy === 'newest') {
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      }
      if (sortBy === 'downloads') {
        return (b.downloadsCount || 0) - (a.downloadsCount || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const uniqueAuthorities = Array.from(
    new Set(circulars.map(c => c.issuingAuthority))
  ).filter(Boolean);

  const TABS: { id: CircularCategory | 'all'; label: string; desc: string }[] = [
    { id: 'all', label: 'All Documents', desc: 'Complete statutory compendium' },
    { id: 'constitution', label: 'Constitutional Lex', desc: 'Bare Act, Preamble & Amendments' },
    { id: 'acts_statutes', label: 'Acts & Penal Codes', desc: 'BNS, BNSS, DPDP & Statutes' },
    { id: 'circulars_rules', label: 'Gazettes & Rules', desc: 'DoPT & Ministerial circulars' },
    { id: 'guidelines', label: 'Legal Guidelines', desc: 'Judicial SOPs & Advisories' },
    { id: 'model_bills', label: 'Model Frameworks', desc: 'Civilizational draft legislation' },
  ];

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      
      {/* 1. HERO HEADER */}
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-amber-100/80 border border-amber-300 text-amber-950 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs">
          <Scale className="w-3.5 h-3.5 text-amber-800" />
          <span>Statutory Compendium & Legal Archives</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
          Circulars, Guidelines & Constitutional Materials
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          An authoritative, open-access repository of Indian constitutional bare acts, newly codified criminal laws (BNS, BNSS), statutory circulars, gazette notifications, and civilizational model blueprints.
        </p>

        {/* Quick Highlights Strip */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
          <span className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Government Gazette Grounded</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Download className="w-3.5 h-3.5 text-amber-700" />
            <span>Client-Side PDF Generation & Downloads</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Updated with Bharatiya Nyaya Sanhita (2024)</span>
          </span>
        </div>
      </div>

      {/* 2. STATS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Legal Materials', count: circulars.length, sub: 'Indexed & Verifiable', icon: Layers },
          { label: 'Constitutional Documents', count: categoryCounts['constitution'] || 0, sub: 'Articles & Amendments', icon: Scale },
          { label: 'Central Acts & Codes', count: categoryCounts['acts_statutes'] || 0, sub: 'BNS, BNSS, DPDP', icon: FileText },
          { label: 'Model Policy Blueprints', count: categoryCounts['model_bills'] || 0, sub: 'UCC & Harmonization', icon: BookOpen },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-none">
                  {stat.count}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1 truncate">{stat.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. TAB-WISE CATEGORY FILTER BAR */}
      <div className="bg-white rounded-2xl p-2 sm:p-3 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {TABS.map(tab => {
            const isActive = selectedCategory === tab.id;
            const count = tab.id === 'all' ? circulars.length : (categoryCounts[tab.id] || 0);
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SEARCH & FILTER CONTROLS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, act number, article, ministry, tags..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end text-xs">
          
          {/* Authority Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedAuthority}
              onChange={(e) => setSelectedAuthority(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="all">All Authorities</option>
              {uniqueAuthorities.map((auth, idx) => (
                <option key={idx} value={auth}>
                  {auth}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="landmark">Priority / Landmark First</option>
              <option value="newest">Enactment Date (Newest)</option>
              <option value="downloads">Most Downloaded</option>
              <option value="title">Title (Alphabetical)</option>
            </select>
          </div>

          {/* Reset Filters button if any active */}
          {(selectedCategory !== 'all' || selectedAuthority !== 'all' || searchQuery.trim()) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedAuthority('all');
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

        </div>

      </div>

      {/* 5. CIRCULARS GRID */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading official legal materials and circulars...</p>
        </div>
      ) : filteredCirculars.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900">No matching legal circulars found</h3>
          <p className="text-xs text-slate-600">
            No documents matched your search query or filter selection. Try clearing filters or exploring another category.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedAuthority('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-bold hover:bg-amber-900 transition-colors cursor-pointer"
          >
            View All Documents
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredCirculars.map(circular => (
            <CircularCard
              key={circular.id}
              circular={circular}
              onPreview={setPreviewingCircular}
              onDownloadComplete={async (c) => {
                await circularService.incrementDownloads(c.id);
              }}
            />
          ))}
        </div>
      )}

      {/* 6. IN-MODAL DOCUMENT PREVIEWER */}
      <CircularPreviewModal
        circular={previewingCircular}
        onClose={() => setPreviewingCircular(null)}
        onDownloadComplete={async (c) => {
          await circularService.incrementDownloads(c.id);
        }}
      />

    </div>
  );
};
