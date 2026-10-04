import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  UserCheck, 
  Briefcase, 
  BookOpen, 
  Scale, 
  Calendar, 
  Compass, 
  Users, 
  MapPin, 
  Video, 
  Mail, 
  FileText, 
  Settings, 
  ArrowRight, 
  CornerDownLeft, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { UserRegistrationRecord } from '../../types/registration';
import { CareerApplicationRecord } from '../../types/career';
import { Publication } from '../../types/publication';
import { Circular } from '../../types/circular';
import { EventItem } from '../../types/event';
import { ResearchDomain } from '../../types/research';
import { ScholarExpert } from '../../types/expert';
import { NationalTeamMember, StateChapter } from '../../types/team';
import { PodcastEpisode } from '../../types/podcast';
import { MagazineIssue } from '../../types/magazine';

export interface AdminSearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tab: 'registrations' | 'careers' | 'content' | 'communications' | 'submissions' | 'newsletter' | 'settings';
  subTab?: 'publications' | 'circulars' | 'events' | 'research' | 'experts' | 'nationalTeam' | 'stateTeam' | 'news' | 'podcasts' | 'magazine' | 'media' | 'taxonomy';
  recordId?: string;
  recordType?: 'registration' | 'career';
  badgeColor?: string;
}

interface AdminSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrations: UserRegistrationRecord[];
  careerApplications: CareerApplicationRecord[];
  publications: Publication[];
  circulars: Circular[];
  events: EventItem[];
  domains: ResearchDomain[];
  experts: ScholarExpert[];
  nationalTeam: NationalTeamMember[];
  stateChapters: StateChapter[];
  podcasts: PodcastEpisode[];
  magazines: MagazineIssue[];
  subscribers: any[];
  submissions: any[];
  onSelectResult: (item: AdminSearchResultItem) => void;
}

export const AdminSearchModal: React.FC<AdminSearchModalProps> = ({
  isOpen,
  onClose,
  registrations,
  careerApplications,
  publications,
  circulars,
  events,
  domains,
  experts,
  nationalTeam,
  stateChapters,
  podcasts,
  magazines,
  subscribers,
  submissions,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [selectedTabFilter, setSelectedTabFilter] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && isOpen) {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const q = query.trim().toLowerCase();

  // Compute results live
  const allResults: AdminSearchResultItem[] = [];

  if (q) {
    // 1. Registrations
    for (const r of registrations) {
      const fullName = `${r.firstName} ${r.middleName || ''} ${r.lastName}`.toLowerCase();
      if (
        fullName.includes(q) ||
        r.registrationNumber.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phoneNumber?.nationalNumber && r.phoneNumber.nationalNumber.includes(q)) ||
        (r.address?.city && r.address.city.toLowerCase().includes(q)) ||
        (r.address?.state && r.address.state.toLowerCase().includes(q)) ||
        (r.profession && r.profession.toLowerCase().includes(q))
      ) {
        allResults.push({
          id: `reg-${r.id}`,
          title: `${r.firstName} ${r.lastName} (${r.registrationNumber})`,
          subtitle: `${r.profession || 'Applicant'} • ${r.email} • ${r.address?.city || ''}, ${r.address?.state || ''}`,
          category: 'Registration',
          tab: 'registrations',
          recordId: r.id,
          recordType: 'registration',
        });
      }
    }

    // 2. Career Applications
    for (const c of careerApplications) {
      if (
        c.fullName.toLowerCase().includes(q) ||
        c.applicationCode.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.applicationType.toLowerCase().includes(q) ||
        c.qualification.toLowerCase().includes(q) ||
        c.currentInstitution.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: `car-${c.id}`,
          title: `${c.fullName} (${c.applicationCode})`,
          subtitle: `${c.applicationType.toUpperCase()} • ${c.qualification} • ${c.currentInstitution}`,
          category: 'Career',
          tab: 'careers',
          recordId: c.id,
          recordType: 'career',
        });
      }
    }

    // 3. Publications
    for (const p of publications) {
      if (
        p.title.toLowerCase().includes(q) ||
        p.authors.some(a => a.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: `pub-${p.id}`,
          title: p.title,
          subtitle: `By ${p.authors.join(', ')} • Status: ${p.status || 'published'}`,
          category: 'Publication',
          tab: 'content',
          subTab: 'publications',
        });
      }
    }

    // 4. Circulars & Legal Materials
    for (const c of circulars) {
      if (
        c.title.toLowerCase().includes(q) ||
        c.officialDescription.toLowerCase().includes(q) ||
        c.issuingAuthority.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: `circ-${c.id}`,
          title: c.title,
          subtitle: `${c.issuingAuthority} • Status: ${c.status || 'published'}`,
          category: 'Circular',
          tab: 'content',
          subTab: 'circulars',
        });
      }
    }

    // 5. Events
    for (const e of events) {
      if (
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.speakers.some(s => s.toLowerCase().includes(q))
      ) {
        allResults.push({
          id: `evt-${e.id}`,
          title: e.title,
          subtitle: `${e.date} • ${e.venue}`,
          category: 'Event',
          tab: 'content',
          subTab: 'events',
        });
      }
    }

    // 6. Research Domains
    for (const d of domains) {
      if (
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: `dom-${d.id}`,
          title: d.title,
          subtitle: d.description,
          category: 'Research',
          tab: 'content',
          subTab: 'research',
        });
      }
    }

    // 7. Council & Fellows
    for (const exp of experts) {
      if (
        exp.name.toLowerCase().includes(q) ||
        exp.designation.toLowerCase().includes(q) ||
        exp.institution.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: `exp-${exp.id}`,
          title: exp.name,
          subtitle: `${exp.designation} • ${exp.institution} • ${exp.status === 'archived' ? 'Draft' : 'Published'}`,
          category: 'Council & Fellows',
          tab: 'content',
          subTab: 'experts',
        });
      }
    }

    // 8. National Team
    for (const m of nationalTeam) {
      if (
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.affiliation.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: `nat-${m.id}`,
          title: `${m.name} (${m.role})`,
          subtitle: `${m.affiliation} • Status: ${m.status}`,
          category: 'National Team',
          tab: 'content',
          subTab: 'nationalTeam',
        });
      }
    }

    // 9. State Chapters
    for (const ch of stateChapters) {
      if (
        ch.state.toLowerCase().includes(q) ||
        ch.convener.toLowerCase().includes(q) ||
        ch.city.toLowerCase().includes(q) ||
        ch.focus.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: `sc-${ch.id}`,
          title: `${ch.state} - ${ch.convener}`,
          subtitle: `Base: ${ch.city} • Focus: ${ch.focus} • Status: ${ch.status}`,
          category: 'State Chapter',
          tab: 'content',
          subTab: 'stateTeam',
        });
      }
    }

    // 10. Podcasts
    for (const pod of podcasts) {
      if (
        pod.title.toLowerCase().includes(q) ||
        (pod.speaker && pod.speaker.toLowerCase().includes(q))
      ) {
        allResults.push({
          id: `pod-${pod.id}`,
          title: pod.title,
          subtitle: `Speaker: ${pod.speaker} • Status: ${pod.status || 'published'}`,
          category: 'Podcast',
          tab: 'content',
          subTab: 'podcasts',
        });
      }
    }

    // 11. Magazine
    for (const mag of magazines) {
      if (
        mag.title.toLowerCase().includes(q) ||
        mag.theme.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: `mag-${mag.id}`,
          title: `${mag.title} (${mag.issueNumber})`,
          subtitle: `Theme: ${mag.theme} • Status: ${mag.status || 'published'}`,
          category: 'Magazine',
          tab: 'content',
          subTab: 'magazine',
        });
      }
    }

    // 12. Newsletter Subscribers
    for (const sub of subscribers) {
      if (sub.email.toLowerCase().includes(q)) {
        allResults.push({
          id: `sub-${sub.id}`,
          title: sub.email,
          subtitle: `Subscribed: ${sub.subscribedAt || 'Active'}`,
          category: 'Subscriber',
          tab: 'newsletter',
        });
      }
    }

    // 13. Submissions
    for (const s of submissions) {
      if (
        s.paperTitle.toLowerCase().includes(q) ||
        s.authorName.toLowerCase().includes(q) ||
        s.submissionCode.toLowerCase().includes(q)
      ) {
        allResults.push({
          id: `cfp-${s.id}`,
          title: `${s.paperTitle} (${s.submissionCode})`,
          subtitle: `Author: ${s.authorName} • ${s.affiliation}`,
          category: 'Paper Submission',
          tab: 'submissions',
        });
      }
    }

    // 14. Settings Keywords
    const settingsKeywords = [
      { key: 'national team', label: 'National Team Section Visibility' },
      { key: 'state team', label: 'State Team & Regional Chapters Visibility' },
      { key: 'circulars', label: 'Circulars Module Feature Flag' },
      { key: 'donations', label: 'Donation & Patronage Module' },
      { key: 'credentials', label: 'Admin Password & 2FA Settings' },
      { key: 'feature flags', label: 'Platform Capabilities & Toggles' },
    ];
    for (const sk of settingsKeywords) {
      if (sk.key.includes(q) || sk.label.toLowerCase().includes(q)) {
        allResults.push({
          id: `set-${sk.key}`,
          title: sk.label,
          subtitle: 'System Configuration & Security Settings',
          category: 'Settings',
          tab: 'settings',
        });
      }
    }
  }

  const filteredResults = allResults.filter(r => {
    if (selectedTabFilter === 'all') return true;
    return r.tab === selectedTabFilter;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        onSelectResult(filteredResults[selectedIndex]);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Registration': return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'Career': return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'Publication': return <BookOpen className="w-4 h-4 text-amber-700" />;
      case 'Circular': return <Scale className="w-4 h-4 text-slate-700" />;
      case 'Event': return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'Research': return <Compass className="w-4 h-4 text-indigo-600" />;
      case 'Council & Fellows': return <Users className="w-4 h-4 text-amber-800" />;
      case 'National Team': return <Users className="w-4 h-4 text-orange-600" />;
      case 'State Chapter': return <MapPin className="w-4 h-4 text-red-600" />;
      case 'Podcast': return <Video className="w-4 h-4 text-rose-600" />;
      case 'Magazine': return <BookOpen className="w-4 h-4 text-teal-600" />;
      case 'Subscriber': return <Mail className="w-4 h-4 text-sky-600" />;
      case 'Paper Submission': return <FileText className="w-4 h-4 text-slate-600" />;
      default: return <Settings className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20 animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Search Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-900/90 sticky top-0 z-10">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search applicants, candidates, papers, acts, team, settings..."
            className="w-full text-base sm:text-lg text-white placeholder-slate-500 bg-transparent outline-hidden font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-500 hover:text-slate-300 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'registrations', label: 'Registrations' },
            { id: 'careers', label: 'Careers' },
            { id: 'content', label: 'Website Content' },
            { id: 'newsletter', label: 'Subscribers' },
            { id: 'submissions', label: 'CFP Submissions' },
            { id: 'settings', label: 'Settings' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedTabFilter(f.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                selectedTabFilter === f.id
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-800/60 flex-1">
          {query.trim() === '' ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-white text-sm">Admin Universal Record Search</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Search applicants by name, email or code; content items by title or author; team members; or system configuration.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-1.5 text-xs">
                {['BC-REG', 'BC-CAR', 'Sai Deepak', 'Uttar Pradesh', 'BNS', 'Uniform Civil Code'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 font-medium cursor-pointer transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="font-serif text-slate-200 font-bold text-sm">No administrative records match &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500">
                Check spelling or filter tab selection.
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectResult(item);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-600/20 border border-amber-500/40 text-white' : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm text-white truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-amber-400 shrink-0">
                    <span className="text-[11px] font-semibold hidden sm:inline">Go to Section</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Key Hints */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px] text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px] text-slate-300">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px] text-slate-300 flex items-center">
                <CornerDownLeft className="w-2.5 h-2.5" />
              </kbd>
              <span>to jump</span>
            </span>
          </div>

          <span className="text-slate-500">
            {filteredResults.length} {filteredResults.length === 1 ? 'record' : 'records'}
          </span>
        </div>
      </div>
    </div>
  );
};
