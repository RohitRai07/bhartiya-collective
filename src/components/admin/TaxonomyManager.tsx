import React, { useState, useEffect } from 'react';
import { taxonomyService, TaxonomyGroupKey, DropdownOption } from '../../services/taxonomyService';
import { 
  Tag, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Layers, 
  Sparkles, 
  BookOpen, 
  Scale, 
  Calendar, 
  Users, 
  Newspaper, 
  FileText,
  RotateCcw,
  Info,
  CheckCircle2,
  Globe
} from 'lucide-react';

interface GroupMeta {
  key: TaxonomyGroupKey;
  title: string;
  description: string;
  icon: any;
  publicUsage: string;
}

const GROUPS: GroupMeta[] = [
  {
    key: 'circular_category',
    title: 'Circular & Legal Categories',
    description: 'Statutory classifications appearing as filter tabs and card badges on /circulars compendium.',
    icon: Scale,
    publicUsage: 'Reflects on: Public Circulars & Guidelines Page (/circulars)',
  },
  {
    key: 'circular_language',
    title: 'Gazette & Legal Languages',
    description: 'Languages available when indexing constitutional and statutory materials.',
    icon: Globe,
    publicUsage: 'Reflects on: Circular Search & Meta Badges',
  },
  {
    key: 'publication_category',
    title: 'Publication & Research Formats',
    description: 'Monographs, Policy Papers, and Briefs filtering on the publications portal.',
    icon: BookOpen,
    publicUsage: 'Reflects on: Public Publications Archive (/publications)',
  },
  {
    key: 'event_category',
    title: 'Symposia & Dialogue Formats',
    description: 'Categories and session types for national convenings, roundtables, and lectures.',
    icon: Calendar,
    publicUsage: 'Reflects on: Public Events & Dialogue Schedule (/events)',
  },
  {
    key: 'expert_role',
    title: 'Advisory Council & Scholar Roles',
    description: 'Fellowship designations and council chairs appearing on scholar profiles.',
    icon: Users,
    publicUsage: 'Reflects on: Faculty & Fellows Directory (/about#advisory)',
  },
  {
    key: 'news_category',
    title: 'News & Insight Categories',
    description: 'Classifications for official communiques, perspectives, and announcements.',
    icon: Newspaper,
    publicUsage: 'Reflects on: Public News & Analysis Feed (/news)',
  },
  {
    key: 'content_status',
    title: 'Content Lifecycle Statuses',
    description: 'Publication visibility state (Published, Draft, Archived) across all content editors.',
    icon: Layers,
    publicUsage: 'Reflects on: Admin Portal Content Tables & Filters',
  },
  {
    key: 'cfp_status',
    title: 'Call for Papers Review Statuses',
    description: 'Workflow statuses for scholarly submissions received under Call for Papers.',
    icon: FileText,
    publicUsage: 'Reflects on: Admin CFP Submissions Management',
  },
];

export const TaxonomyManager: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState<TaxonomyGroupKey>('circular_category');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const loadData = () => {
    setOptions(taxonomyService.getOptions(activeGroup));
    setTags(taxonomyService.getTags());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('bharat:taxonomy-updated', handleUpdate);
    return () => window.removeEventListener('bharat:taxonomy-updated', handleUpdate);
  }, [activeGroup]);

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionInput.trim()) return;

    const added = taxonomyService.addOption(activeGroup, newOptionInput.trim());
    setNewOptionInput('');
    setOptions(taxonomyService.getOptions(activeGroup));
    showNotification(`Added "${added.label}" to ${GROUPS.find(g => g.key === activeGroup)?.title}! Immediate visibility on website.`);
  };

  const handleDeleteOption = (value: string, label: string) => {
    if (window.confirm(`Are you sure you want to remove "${label}" from the dropdown list?`)) {
      taxonomyService.removeOption(activeGroup, value);
      setOptions(taxonomyService.getOptions(activeGroup));
      showNotification(`Removed "${label}".`, 'info');
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;

    taxonomyService.addTag(newTagInput.trim());
    setNewTagInput('');
    setTags(taxonomyService.getTags());
    showNotification(`Tag #${newTagInput.trim()} added to website taxonomy pool!`);
  };

  const handleDeleteTag = (tag: string) => {
    taxonomyService.removeTag(tag);
    setTags(taxonomyService.getTags());
    showNotification(`Tag #${tag} removed from suggested pool.`, 'info');
  };

  const currentMeta = GROUPS.find(g => g.key === activeGroup) || GROUPS[0];
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Notifications banner */}
      {message && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Hero explanation card */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/90 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-amber-500/20 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Dynamic Taxonomy & Custom Field Engine</span>
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold">
          Custom Dropdown Options & Global Taxonomy Tags
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Create new dropdown options and tags by typing and pressing <strong>Enter</strong>. Any custom option or tag added here or inside an editor modal is permanently saved and <strong>immediately reflects across public website filter tabs, badge chips, and search indices</strong>.
        </p>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Dropdown Groups Navigation */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2 lg:col-span-1">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Admin Dropdown Groups
          </div>
          
          <div className="space-y-1">
            {GROUPS.map(g => {
              const Icon = g.icon;
              const isActive = activeGroup === g.key;
              const groupOptions = taxonomyService.getOptions(g.key);
              const customCount = groupOptions.filter(o => o.isCustom).length;

              return (
                <button
                  key={g.key}
                  onClick={() => setActiveGroup(g.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-amber-100/90 text-amber-950 font-bold border border-amber-300 shadow-2xs' 
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="truncate">
                      <p className="truncate font-semibold">{g.title}</p>
                      <p className="text-[10px] text-slate-400 font-normal truncate">
                        {groupOptions.length} total options
                      </p>
                    </div>
                  </div>

                  {customCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-800 border border-amber-400/40 shrink-0">
                      +{customCount} custom
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle/Right: Dropdown Options Management for Active Group */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5 lg:col-span-2">
          
          {/* Header of Active Group */}
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900">
                <CurrentIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  {currentMeta.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {currentMeta.description}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shrink-0">
              {currentMeta.publicUsage}
            </span>
          </div>

          {/* Enter-to-Add Option Input Form */}
          <form onSubmit={handleAddOption} className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Add New Option to this Dropdown (Type & Press Enter)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionInput}
                onChange={e => setNewOptionInput(e.target.value)}
                placeholder={`Type new choice (e.g. "Special White Paper" or "Interdisciplinary Chair")...`}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
              <button
                type="submit"
                disabled={!newOptionInput.trim()}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option (Enter)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Options added here are immediately selectable in all admin dropdowns and automatically create filter tabs & badges on the public website.
            </p>
          </form>

          {/* Current Options List with Delete Action */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Active Dropdown Choices ({options.length})</span>
              <span className="text-slate-400 font-normal text-[11px]">
                Click ✕ to delete any option
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              {options.map((opt) => (
                <div
                  key={opt.value}
                  className="p-3 flex items-center justify-between text-xs hover:bg-white transition-colors"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="font-semibold text-slate-800 truncate">
                      {opt.label}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ({opt.value})
                    </span>
                    {opt.isCustom ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Custom User Option
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500">
                        Default
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteOption(opt.value, opt.label)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title={`Delete "${opt.label}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Global Tags & Keywords Pool Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900">
                Global Website Taxonomy & Search Keywords Pool
              </h3>
              <p className="text-xs text-slate-500">
                Tags shared across Circulars, Publications, Events, and News. Visible and clickable on public filters.
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {tags.length} Active Tags
          </span>
        </div>

        {/* Enter-to-Add Tag */}
        <form onSubmit={handleAddTag} className="flex gap-2 max-w-lg">
          <input
            type="text"
            value={newTagInput}
            onChange={e => setNewTagInput(e.target.value)}
            placeholder="Type new tag & press Enter (e.g. Maritime Law, Jan Vishwas)..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-amber-600 focus:border-amber-600 outline-none"
          />
          <button
            type="submit"
            disabled={!newTagInput.trim()}
            className="inline-flex items-center space-x-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tag</span>
          </button>
        </form>

        {/* Tag Badges with Delete */}
        <div className="flex flex-wrap gap-2 pt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-amber-50 text-slate-800 border border-slate-200 transition-colors"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => handleDeleteTag(tag)}
                className="text-slate-400 hover:text-red-600 cursor-pointer ml-1 p-0.5 rounded hover:bg-slate-200"
                title={`Delete #${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};
