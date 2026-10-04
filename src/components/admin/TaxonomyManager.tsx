import React, { useState, useEffect } from 'react';
import { taxonomyService, TaxonomyGroupKey, DropdownOption } from '../../services/taxonomyService';
import { 
  Tag, 
  Plus, 
  Trash2, 
  X, 
  Layers, 
  Sparkles, 
  BookOpen, 
  Scale, 
  Calendar, 
  Users, 
  Newspaper, 
  FileText,
  CheckCircle2,
  Globe,
  Compass,
  Landmark,
  MapPin,
  Video,
  UploadCloud,
  Briefcase,
  UserCheck,
  Search,
  RotateCcw
} from 'lucide-react';

interface GroupMeta {
  key: TaxonomyGroupKey;
  title: string;
  subTabLabel: string;
  section: 'content' | 'careers_reg' | 'workflows';
  description: string;
  icon: any;
  publicUsage: string;
}

const GROUPS: GroupMeta[] = [
  // 1. Publications Sub-Tab
  {
    key: 'publication_category',
    title: 'Publications & Monograph Formats',
    subTabLabel: 'Publications',
    section: 'content',
    description: 'Monographs, Policy Papers, and Briefs filtering on the publications portal.',
    icon: BookOpen,
    publicUsage: 'Reflects on: Public Publications Archive (/publications)',
  },

  // 2. Circulars & Legal Sub-Tab (Categories & Languages)
  {
    key: 'circular_category',
    title: 'Circular & Legal Categories',
    subTabLabel: 'Circulars & Legal',
    section: 'content',
    description: 'Statutory classifications appearing as filter tabs and card badges on /circulars compendium.',
    icon: Scale,
    publicUsage: 'Reflects on: Public Circulars & Guidelines Page (/circulars)',
  },
  {
    key: 'circular_language',
    title: 'Gazette & Legal Languages',
    subTabLabel: 'Circulars & Legal',
    section: 'content',
    description: 'Languages available when indexing constitutional and statutory materials.',
    icon: Globe,
    publicUsage: 'Reflects on: Circular Search & Meta Badges',
  },

  // 3. Symposia & Events Sub-Tab
  {
    key: 'event_category',
    title: 'Symposia & Dialogue Formats',
    subTabLabel: 'Events',
    section: 'content',
    description: 'Categories and session types for national convenings, roundtables, and lectures.',
    icon: Calendar,
    publicUsage: 'Reflects on: Public Events & Dialogue Schedule (/events)',
  },

  // 4. Research Domains Sub-Tab
  {
    key: 'research_domain',
    title: 'Research Domains & Inquiry Clusters',
    subTabLabel: 'Research Domains',
    section: 'content',
    description: 'Core research inquiry clusters, working paper domains, and legal epistemology themes.',
    icon: Compass,
    publicUsage: 'Reflects on: Research Overview & Working Groups (/research)',
  },

  // 5. Thematic Research Centres Sub-Tab
  {
    key: 'centre_theme',
    title: 'Thematic Centres Focus Areas & Themes',
    subTabLabel: 'Centres',
    section: 'content',
    description: 'Specialized thematic research focus areas, legal aid clinics, and policy tracks.',
    icon: Landmark,
    publicUsage: 'Reflects on: Research Centres Directory (/centres)',
  },
  {
    key: 'centre_role',
    title: 'Research Centre Convener & Scholar Roles',
    subTabLabel: 'Centres',
    section: 'content',
    description: 'Leadership designations for centre conveners, senior chairs, and visiting fellows.',
    icon: Users,
    publicUsage: 'Reflects on: Centre Conveners & Scholar Profiles (/centres)',
  },

  // 6. Advisory Council & Fellows Sub-Tab
  {
    key: 'expert_role',
    title: 'Advisory Council & Scholar Roles',
    subTabLabel: 'Council & Fellows',
    section: 'content',
    description: 'Fellowship designations and council chairs appearing on scholar profiles.',
    icon: Users,
    publicUsage: 'Reflects on: Faculty & Fellows Directory (/about#advisory)',
  },

  // 7. National Executive Team Sub-Tab
  {
    key: 'national_team_role',
    title: 'National Executive Leadership Roles',
    subTabLabel: 'National Team',
    section: 'content',
    description: 'Designations for director general, patron, legal counsel, and academic heads.',
    icon: Users,
    publicUsage: 'Reflects on: Executive Leadership Section (/about#national-team)',
  },

  // 8. State Chapters & Regional Chapters Sub-Tab
  {
    key: 'state_chapter_region',
    title: 'State Chapter Zones & Regions',
    subTabLabel: 'State Chapters',
    section: 'content',
    description: 'Regional geographic zones grouping state chapters across India.',
    icon: MapPin,
    publicUsage: 'Reflects on: Regional Chapters Directory (/about#state-team)',
  },
  {
    key: 'state_chapter_focus',
    title: 'State Chapter Action & Inquiry Focus',
    subTabLabel: 'State Chapters',
    section: 'content',
    description: 'Grassroots intervention areas, legal clinics, and vernacular translation initiatives.',
    icon: MapPin,
    publicUsage: 'Reflects on: State Chapter Cards & Filters (/about#state-team)',
  },

  // 9. News & Insights Sub-Tab
  {
    key: 'news_category',
    title: 'News & Insight Categories',
    subTabLabel: 'News & Insights',
    section: 'content',
    description: 'Classifications for official communiques, perspectives, and announcements.',
    icon: Newspaper,
    publicUsage: 'Reflects on: Public News & Analysis Feed (/news)',
  },

  // 10. Podcasts Sub-Tab
  {
    key: 'podcast_topic',
    title: 'Podcast Episodes Themes & Topics',
    subTabLabel: 'Podcasts',
    section: 'content',
    description: 'Topical tags and broadcast series classifications for video and audio discussions.',
    icon: Video,
    publicUsage: 'Reflects on: Public Podcasts & Video Broadcasts (/podcasts)',
  },

  // 11. Magazine Sub-Tab
  {
    key: 'magazine_theme',
    title: 'Magazine Edition Themes & Series',
    subTabLabel: 'Magazine',
    section: 'content',
    description: 'Editorial themes and curated quarterly monograph series for reader editions.',
    icon: BookOpen,
    publicUsage: 'Reflects on: Digital Magazine Catalogue (/magazine)',
  },

  // 12. Media Library Sub-Tab
  {
    key: 'media_type',
    title: 'Media Asset Categories & Formats',
    subTabLabel: 'Media & Uploads',
    section: 'content',
    description: 'Asset types for PDFs, legal documents, portraits, banners, and infographics.',
    icon: UploadCloud,
    publicUsage: 'Reflects on: Admin Media Library & Asset Uploads',
  },

  // 13. Careers & Opportunities
  {
    key: 'career_type',
    title: 'Career & Fellowship Opportunity Types',
    subTabLabel: 'Careers',
    section: 'careers_reg',
    description: 'Engagement formats including research internships, full-time fellowships, and associates.',
    icon: Briefcase,
    publicUsage: 'Reflects on: Public Careers & Opportunities Page (/career)',
  },
  {
    key: 'career_department',
    title: 'Career Research Departments & Divisions',
    subTabLabel: 'Careers',
    section: 'careers_reg',
    description: 'Institutional departments offering fellowships, internships, and associate openings.',
    icon: Briefcase,
    publicUsage: 'Reflects on: Career Department Filtering (/career)',
  },
  {
    key: 'career_status',
    title: 'Career Application Review Statuses',
    subTabLabel: 'Careers',
    section: 'careers_reg',
    description: 'Evaluation stages for candidate dossiers (Pending, Shortlisted, Selected, Rejected).',
    icon: Briefcase,
    publicUsage: 'Reflects on: Admin Career Dossier Management & Statuses',
  },

  // 14. Registrations & Membership
  {
    key: 'registration_category',
    title: 'Registration & Membership Categories',
    subTabLabel: 'Registrations',
    section: 'careers_reg',
    description: 'Constituent background classifications (Advocate, Scholar, Academician, Student).',
    icon: UserCheck,
    publicUsage: 'Reflects on: Public Registration Form (/register)',
  },
  {
    key: 'registration_status',
    title: 'Registration Verification Statuses',
    subTabLabel: 'Registrations',
    section: 'careers_reg',
    description: 'Verification workflow states (Pending, Verified & Approved, Archived).',
    icon: UserCheck,
    publicUsage: 'Reflects on: Admin Registrations Table & Verification',
  },

  // 15. Call for Papers & Submissions
  {
    key: 'cfp_status',
    title: 'Call for Papers Review Statuses',
    subTabLabel: 'Submissions',
    section: 'workflows',
    description: 'Workflow statuses for scholarly submissions received under Call for Papers.',
    icon: FileText,
    publicUsage: 'Reflects on: Admin CFP Submissions Management',
  },

  // 16. Content Lifecycle
  {
    key: 'content_status',
    title: 'Content Lifecycle & Publishing Statuses',
    subTabLabel: 'Universal',
    section: 'workflows',
    description: 'Publication visibility state (Published, Draft, Archived) across all content editors.',
    icon: Layers,
    publicUsage: 'Reflects on: Admin Portal Content Tables & Filters',
  },
];

export const TaxonomyManager: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState<TaxonomyGroupKey>('publication_category');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'content' | 'careers_reg' | 'workflows'>('all');
  const [groupSearch, setGroupSearch] = useState('');
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

  const handleResetGroup = (key: TaxonomyGroupKey) => {
    const targetTitle = GROUPS.find(g => g.key === key)?.title || key;
    if (window.confirm(`Reset "${targetTitle}" back to original institutional defaults? Any custom options in this group will be cleared.`)) {
      taxonomyService.resetGroup(key);
      setOptions(taxonomyService.getOptions(key));
      showNotification(`Reset "${targetTitle}" to system defaults!`, 'info');
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

  const filteredGroups = GROUPS.filter(g => {
    const matchesSection = sectionFilter === 'all' || g.section === sectionFilter;
    const q = groupSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      g.title.toLowerCase().includes(q) || 
      g.subTabLabel.toLowerCase().includes(q) || 
      g.description.toLowerCase().includes(q);
    return matchesSection && matchesSearch;
  });

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
          Customize and expand dropdown choices, category filters, and tags across <strong>all {GROUPS.length} sub-tabs and portals</strong>. Any custom option or tag added here is permanently preserved and <strong>immediately reflects across public website filter tabs, badge chips, and form dropdowns</strong>.
        </p>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Dropdown Groups Navigation */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 lg:col-span-1">
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Admin Sub-Tabs & Dropdown Groups ({GROUPS.length})
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search groups or sub-tabs..."
              value={groupSearch}
              onChange={e => setGroupSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-amber-700 outline-none"
            />
          </div>

          {/* Section Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px]">
            {[
              { id: 'all', label: `All (${GROUPS.length})` },
              { id: 'content', label: `Content (${GROUPS.filter(g => g.section === 'content').length})` },
              { id: 'careers_reg', label: `Careers (${GROUPS.filter(g => g.section === 'careers_reg').length})` },
              { id: 'workflows', label: `Workflows (${GROUPS.filter(g => g.section === 'workflows').length})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSectionFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ${
                  sectionFilter === tab.id
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Group buttons scroll area */}
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto no-scrollbar pr-0.5">
            {filteredGroups.map(g => {
              const Icon = g.icon;
              const isActive = activeGroup === g.key;
              const groupOptions = taxonomyService.getOptions(g.key);
              const customCount = groupOptions.filter(o => o.isCustom).length;

              return (
                <button
                  key={g.key}
                  onClick={() => setActiveGroup(g.key)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-amber-100/90 text-amber-950 font-bold border border-amber-300 shadow-2xs ring-1 ring-amber-400/30' 
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="truncate font-semibold">{g.title}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50">
                          {g.subTabLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal truncate">
                          {groupOptions.length} choices
                        </span>
                      </div>
                    </div>
                  </div>

                  {customCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-800 border border-amber-400/40 shrink-0">
                      +{customCount}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredGroups.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No dropdown groups matching &ldquo;{groupSearch}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Middle/Right: Dropdown Options Management for Active Group */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5 lg:col-span-2">
          
          {/* Header of Active Group */}
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 shrink-0 mt-0.5">
                <CurrentIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif font-bold text-base text-slate-900 truncate">
                    {currentMeta.title}
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                    Tab: {currentMeta.subTabLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentMeta.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => handleResetGroup(activeGroup)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                title="Reset this dropdown group to institutional defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">
                {currentMeta.publicUsage}
              </span>
            </div>
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
                placeholder={`Type new choice for ${currentMeta.subTabLabel} and press Enter...`}
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
              Options added here are immediately selectable in the {currentMeta.subTabLabel} sub-tab and automatically appear on public website filters and badge chips.
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

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 max-h-[380px] overflow-y-auto">
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
                Tags shared across Circulars, Publications, Events, Centres, Research Domains, and News. Visible and clickable on public filters.
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
