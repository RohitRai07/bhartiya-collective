import React, { useState, useEffect } from 'react';
import { Circular, CircularCategory } from '../types/circular';
import { circularService } from '../services/circularService';
import { taxonomyService } from '../services/taxonomyService';
import { gazetteSyncService, OfficialGazetteFeed } from '../services/gazetteSyncService';
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
  FileCheck2,
  Tag,
  ShieldCheck,
  RefreshCw,
  Radio,
  ExternalLink
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
  const [dynamicCategories, setDynamicCategories] = useState(taxonomyService.getOptions('circular_category'));
  const [tagsPool, setTagsPool] = useState<string[]>(taxonomyService.getTags());
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncSettings, setSyncSettings] = useState(gazetteSyncService.getSyncSettings());

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
    // Initialize auto-sync background check if enabled
    gazetteSyncService.initAutoSync();

    const handleUpdate = () => {
      loadData();
      setDynamicCategories(taxonomyService.getOptions('circular_category'));
      setTagsPool(taxonomyService.getTags());
    };

    const handleGazetteSync = (e: any) => {
      if (e.detail?.message) {
        setSyncMessage(e.detail.message);
        setTimeout(() => setSyncMessage(null), 6000);
      }
      loadData();
      setSyncSettings(gazetteSyncService.getSyncSettings());
    };

    window.addEventListener('bharat:content-updated', handleUpdate);
    window.addEventListener('bharat:taxonomy-updated', handleUpdate);
    window.addEventListener('bharat:gazette-synced', handleGazetteSync);
    return () => {
      window.removeEventListener('bharat:content-updated', handleUpdate);
      window.removeEventListener('bharat:taxonomy-updated', handleUpdate);
      window.removeEventListener('bharat:gazette-synced', handleGazetteSync);
    };
  }, []);

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      const res = await gazetteSyncService.syncNow();
      setSyncMessage(res.message);
      setTimeout(() => setSyncMessage(null), 6000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to sync with official gazette repository');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleAutoSync = () => {
    const next = !syncSettings.autoSyncEnabled;
    const updated = gazetteSyncService.updateSyncSettings({ autoSyncEnabled: next });
    setSyncSettings(updated);
  };

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
        const matchesTags = c.tags?.some(t => t.toLowerCase().includes(q));
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

  const TABS: { id: CircularCategory | 'all'; label: string; desc?: string }[] = [
    { id: 'all', label: 'All Documents', desc: 'Complete statutory compendium' },
    ...dynamicCategories.map(cat => ({
      id: cat.value as CircularCategory,
      label: cat.label,
      desc: cat.isCustom ? 'Custom statutory category' : undefined,
    })),
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

      {/* 1.5 OFFICIAL E-GAZETTE LIVE AUTO-SYNC & SOURCE VALIDATION COMMAND STRIP */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left side: Live feed status & source provenance info */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>e-Gazette Live Auto-Sync Active</span>
              </span>

              <span className="text-[11px] text-slate-300 hidden sm:inline">
                Synchronized with <span className="text-amber-300 font-mono">egazette.gov.in</span> & <span className="text-amber-300 font-mono">legislative.gov.in</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Official automated pipeline for Indian statutory notifications. When new bare acts, statutory circulars, or practice directions are enacted, they are automatically discovered, cross-referenced, and ingested with verified government links for citizen double-validation.
            </p>

            {syncSettings.lastSyncedAt && (
              <p className="text-[10px] text-slate-400 font-mono">
                Last verified against official gazette repository: {new Date(syncSettings.lastSyncedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
              </p>
            )}
          </div>

          {/* Right side: Sync trigger & controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            
            {/* Auto-Sync Toggle */}
            <button
              type="button"
              onClick={handleToggleAutoSync}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                syncSettings.autoSyncEnabled
                  ? 'bg-slate-800 text-emerald-300 border-emerald-500/40 hover:bg-slate-700'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle automatic background sync when new gazettes are released"
            >
              <Radio className={`w-3.5 h-3.5 ${syncSettings.autoSyncEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Auto-Sync: {syncSettings.autoSyncEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Sync Now Button */}
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={syncing}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-70 text-slate-950 font-bold text-xs transition-all flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Checking e-Gazette...' : '⚡ Check for New Gazettes'}</span>
            </button>

          </div>

        </div>

        {/* Sync Result Banner */}
        {syncMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncMessage}</span>
            </div>
            <button
              onClick={() => setSyncMessage(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

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

      {/* 4.5. DYNAMIC TAXONOMY & KEYWORD TAGS */}
      {tagsPool.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          <span className="flex items-center text-slate-500 font-bold shrink-0 text-[11px] uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5 mr-1 text-amber-700" />
            <span>Filter by Tag:</span>
          </span>
          {tagsPool.slice(0, 16).map((tag, idx) => {
            const isActive = searchQuery.toLowerCase().trim() === tag.toLowerCase();
            return (
              <button
                key={idx}
                onClick={() => setSearchQuery(isActive ? '' : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer shrink-0 font-medium ${
                  isActive
                    ? 'bg-amber-800 text-white font-bold shadow-2xs'
                    : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

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
