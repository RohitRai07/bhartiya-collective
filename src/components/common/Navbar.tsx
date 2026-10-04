import React, { useState, useEffect, useRef } from 'react';
import { navigationConfig, NavItem } from '../../config/navigationConfig';
import { siteConfig } from '../../config/siteConfig';
import { featureConfig } from '../../config/featureConfig';
import { 
  Menu, 
  X, 
  Landmark, 
  Heart, 
  UserPlus, 
  ChevronDown, 
  ChevronRight, 
  Search,
  BookOpen,
  Video,
  Briefcase,
  Scale,
  Mail,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { UniversalSearchModal } from '../search/UniversalSearchModal';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [features, setFeatures] = useState(featureConfig.get());
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [actionItems, setActionItems] = useState<NavItem[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>('centres');

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const refreshNav = () => {
      setFeatures(featureConfig.get());
      setNavItems(navigationConfig.getActiveMainNav());
      setActionItems(navigationConfig.getActiveActionNav());
    };

    refreshNav();
    window.addEventListener('bhartiya:feature-change', refreshNav);
    return () => window.removeEventListener('bhartiya:feature-change', refreshNav);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdownId(null);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setOpenDropdownId(null);

    if (path.includes('#')) {
      const hash = path.split('#')[1];
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Sub-item icon mapper
  const getSubItemIcon = (id: string) => {
    switch (id) {
      case 'magazine': return <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />;
      case 'podcasts': return <Video className="w-4 h-4 text-red-600 shrink-0" />;
      case 'careers': return <Briefcase className="w-4 h-4 text-amber-700 shrink-0" />;
      case 'circulars': return <Scale className="w-4 h-4 text-amber-800 shrink-0" />;
      case 'contact': return <Mail className="w-4 h-4 text-blue-700 shrink-0" />;
      default: return <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />;
    }
  };

  // Core navigation items displayed on lg (1024px)
  const coreIds = ['home', 'about', 'centres', 'publications', 'events', 'news'];
  const tier2Ids = ['magazine', 'podcasts'];
  const tier3Ids = ['careers', 'circulars', 'contact'];

  // Check if any item in the 'More' dropdown is active
  const moreItems = navItems.filter(item => !coreIds.includes(item.id));
  const isMoreDropdownActive = moreItems.some(item => currentPath === item.path);

  // Quick helper to check if a specific item is active
  const isItemActive = (item: NavItem) => {
    if (currentPath === item.path) return true;
    if (item.children && item.children.some(c => currentPath === c.path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-xs transition-colors">
        
        {/* Top National Announcement Ticker */}
        {features.flagshipBanner && (
          <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 text-center font-medium shadow-inner">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
                Flagship Dialogue
              </span>
              <span className="text-amber-100 text-center truncate max-w-[280px] min-[420px]:max-w-sm sm:max-w-none">
                #BharatDialogue on <strong className="text-white font-semibold">Uniform Civil Code</strong> — Constitution Club, New Delhi
              </span>
              <button
                type="button"
                onClick={() => handleLinkClick('/events')}
                className="underline font-bold text-amber-200 hover:text-white shrink-0 cursor-pointer text-[10px] sm:text-xs ml-0.5"
              >
                Details &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Main Navbar Bar */}
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20 gap-2 lg:gap-4">
            
            {/* Brand Logo & Title */}
            <div 
              onClick={() => handleLinkClick('/')}
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group py-1 shrink-0"
              role="button"
              aria-label="Go to homepage"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 flex items-center justify-center text-white shadow-md shadow-amber-700/25 group-hover:scale-105 transition-transform shrink-0">
                <Landmark className="w-5 h-5 sm:w-5.5 sm:h-5.5 lg:w-6 lg:h-6" />
              </div>
              <div className="shrink-0 flex flex-col justify-center">
                <span className="font-serif text-sm sm:text-base lg:text-lg xl:text-xl font-bold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
                  <span className="hidden min-[380px]:inline">{siteConfig.name}</span>
                  <span className="min-[380px]:hidden">{siteConfig.shortName}</span>
                </span>
                <span className="hidden sm:block text-[8px] sm:text-[9px] lg:text-[10px] xl:text-[10.5px] uppercase tracking-wider font-semibold text-amber-700 whitespace-nowrap leading-tight mt-0.5">
                  {siteConfig.tagline}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav ref={dropdownRef} className="hidden lg:flex items-center space-x-0.5 xl:space-x-1">
              {navItems.map((item) => {
                const isActive = isItemActive(item);
                const hasChildren = item.children && item.children.length > 0;
                const isDropdownOpen = openDropdownId === item.id;

                // Responsive visibility tier classes
                let visibilityClass = 'inline-flex';
                if (tier2Ids.includes(item.id)) {
                  visibilityClass = 'hidden xl:inline-flex';
                } else if (tier3Ids.includes(item.id)) {
                  visibilityClass = 'hidden 2xl:inline-flex';
                }

                // If item has children (e.g. Centres)
                if (hasChildren) {
                  return (
                    <div
                      key={item.id}
                      className={`relative ${visibilityClass}`}
                      onMouseEnter={() => setOpenDropdownId(item.id)}
                      onMouseLeave={() => setOpenDropdownId(null)}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenDropdownId(prev => prev === item.id ? null : item.id)}
                        className={`inline-flex items-center space-x-1 px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'text-amber-900 bg-amber-50/90 font-bold border border-amber-200/80 shadow-2xs'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                        aria-expanded={isDropdownOpen}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-amber-700' : ''}`} />
                      </button>

                      {/* Multilevel Centres Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="px-4 py-1.5 border-b border-slate-100 text-[10px] uppercase font-bold text-amber-800 tracking-wider flex items-center justify-between">
                            <span>Centres & Institutes</span>
                            <span className="text-[9px] text-slate-400 font-normal">6 Verticals</span>
                          </div>

                          <div className="mt-1 divide-y divide-slate-50">
                            {item.children!.map((child) => (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => handleLinkClick(child.path)}
                                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-amber-50/80 transition-colors flex flex-col group cursor-pointer ${
                                  currentPath === child.path ? 'bg-amber-50/60 font-semibold text-amber-900' : 'text-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-800 group-hover:text-amber-900">
                                    {child.label}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                {child.sanskritName && (
                                  <span className="text-[10px] text-slate-400 font-serif group-hover:text-amber-700 mt-0.5">
                                    {child.sanskritName}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLinkClick(item.path)}
                    className={`${visibilityClass} items-center px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'text-amber-900 bg-amber-50/90 font-bold border border-amber-200/80 shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              {/* Desktop 'More' Dropdown for compact widths (lg and xl screens) */}
              {moreItems.length > 0 && (
                <div
                  className="relative inline-flex 2xl:hidden"
                  onMouseEnter={() => setOpenDropdownId('more')}
                  onMouseLeave={() => setOpenDropdownId(null)}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDropdownId(prev => prev === 'more' ? null : 'more')}
                    className={`inline-flex items-center space-x-1 px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isMoreDropdownActive
                        ? 'text-amber-900 bg-amber-50/90 font-bold border border-amber-200/80 shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    aria-expanded={openDropdownId === 'more'}
                  >
                    <span>More</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openDropdownId === 'more' ? 'rotate-180 text-amber-700' : ''}`} />
                  </button>

                  {openDropdownId === 'more' && (
                    <div className="absolute right-0 mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-1.5 border-b border-slate-100 text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                        Additional Sections
                      </div>

                      <div className="mt-1 divide-y divide-slate-50">
                        {moreItems.map((item) => {
                          const isTier2 = tier2Ids.includes(item.id);
                          // On xl screens, tier2 items (Magazine, Podcasts) are visible on top bar, so hide them from More dropdown
                          const hideClass = isTier2 ? 'xl:hidden' : '';

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleLinkClick(item.path)}
                              className={`w-full text-left px-4 py-2.5 text-xs hover:bg-amber-50/80 transition-colors flex items-center space-x-2.5 group cursor-pointer ${hideClass} ${
                                currentPath === item.path ? 'bg-amber-50/60 font-semibold text-amber-900' : 'text-slate-700'
                              }`}
                            >
                              {getSubItemIcon(item.id)}
                              <span className="font-semibold text-slate-800 group-hover:text-amber-900">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Right Action & Control Area */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 xl:space-x-3 shrink-0">
              
              {/* Universal Search Trigger (Desktop View: Search pill) */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-medium text-slate-600 hover:text-amber-900 bg-slate-100 hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
                title="Universal Search (Ctrl+K or ⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-amber-800" />
                <span className="text-slate-500 font-normal">Search...</span>
                <kbd className="hidden xl:inline px-1 py-0.5 bg-white rounded border border-slate-200 text-[9px] text-slate-400 font-mono shadow-2xs">⌘K</kbd>
              </button>

              {/* Action CTAs (Desktop / Tablet) */}
              <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-2">
                {actionItems.map((action) => {
                  const isSupport = action.id === 'support';
                  const isRegister = action.id === 'register';

                  // On smaller laptop screens (lg), hide Support Us from header to guarantee zero overflow, keeping prominent Join Us button
                  const responsiveClass = isSupport ? 'hidden xl:inline-flex' : 'inline-flex';

                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleLinkClick(action.path)}
                      className={`${responsiveClass} items-center space-x-1 sm:space-x-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap ${
                        isSupport
                          ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300/80'
                          : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow-amber-700/20'
                      }`}
                    >
                      {isSupport && <Heart className="w-3.5 h-3.5 text-amber-700" />}
                      {isRegister && <UserPlus className="w-3.5 h-3.5 text-white" />}
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile / Tablet Single Search Trigger (ONLY ONE SEARCH TRIGGER) */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="lg:hidden p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-slate-200/80 cursor-pointer transition-colors shadow-2xs"
                aria-label="Universal Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-amber-800" />
              </button>

              {/* Mobile / Tablet Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-colors shadow-2xs"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>

            </div>

          </div>
        </div>

        {/* Mobile / Tablet Dropdown Drawer with Structured Categories */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 pt-3 pb-8 space-y-4 shadow-2xl max-h-[82vh] overflow-y-auto animate-in slide-in-from-top duration-200">
            
            {/* Quick Search Bar in Drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchModalOpen(true);
              }}
              className="w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-500 hover:text-amber-900 hover:bg-amber-50 border border-slate-200 transition-colors text-left text-xs sm:text-sm font-medium cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-700" />
              <span className="flex-1">Search centres, research, events, circulars...</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-400 font-bold uppercase">Search</span>
            </button>

            {/* Navigation Groups */}
            <div className="space-y-1 divide-y divide-slate-100">
              
              {/* Core Exploration */}
              <div className="pb-2 space-y-1">
                {navItems.filter(i => ['home', 'about'].includes(i.id)).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLinkClick(item.path)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      currentPath === item.path
                        ? 'bg-amber-50 text-amber-900 font-bold border-l-4 border-amber-600 pl-2.5'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Centres & Institutes Accordion */}
              {navItems.find(i => i.id === 'centres') && (
                <div className="py-2">
                  {(() => {
                    const centresItem = navItems.find(i => i.id === 'centres')!;
                    const isExpanded = mobileExpandedId === 'centres';
                    return (
                      <div>
                        <button
                          type="button"
                          onClick={() => setMobileExpandedId(isExpanded ? null : 'centres')}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <Landmark className="w-4 h-4 text-amber-700" />
                            <span>Centres & Institutes</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">6 Centres</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-amber-700' : ''}`} />
                          </div>
                        </button>

                        {isExpanded && centresItem.children && (
                          <div className="pl-3 pr-1 py-1.5 space-y-1 bg-amber-50/50 rounded-xl my-1 border border-amber-100">
                            {centresItem.children.map((child) => (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => handleLinkClick(child.path)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex flex-col cursor-pointer ${
                                  currentPath === child.path
                                    ? 'bg-white text-amber-900 font-bold shadow-2xs'
                                    : 'text-slate-700 hover:bg-white/80 hover:text-amber-900'
                                }`}
                              >
                                <span>{child.label}</span>
                                {child.sanskritName && (
                                  <span className="text-[10px] text-slate-400 font-serif">
                                    {child.sanskritName}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Research, Publications & Discourse */}
              <div className="py-2 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Research & Dialogue
                </div>
                {navItems.filter(i => ['publications', 'events', 'news', 'magazine', 'podcasts'].includes(i.id)).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLinkClick(item.path)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                      currentPath === item.path
                        ? 'bg-amber-50 text-amber-900 font-bold border-l-4 border-amber-600 pl-2.5'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {getSubItemIcon(item.id)}
                  </button>
                ))}
              </div>

              {/* Opportunities & Contact */}
              <div className="py-2 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Opportunities & Legal
                </div>
                {navItems.filter(i => ['careers', 'circulars', 'contact'].includes(i.id)).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLinkClick(item.path)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                      currentPath === item.path
                        ? 'bg-amber-50 text-amber-900 font-bold border-l-4 border-amber-600 pl-2.5'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {getSubItemIcon(item.id)}
                  </button>
                ))}
              </div>

            </div>

            {/* Action CTAs in Mobile Drawer */}
            <div className="pt-2 space-y-2">
              {actionItems.map((action) => {
                const isSupport = action.id === 'support';
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleLinkClick(action.path)}
                    className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer ${
                      isSupport
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                        : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800'
                    }`}
                  >
                    {isSupport ? <Heart className="w-4 h-4 text-amber-700" /> : <UserPlus className="w-4 h-4 text-white" />}
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-serif italic truncate max-w-[200px]">{siteConfig.tagline}</span>
              <button
                type="button"
                onClick={() => handleLinkClick('/admin')}
                className="text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer shrink-0"
              >
                Admin Portal
              </button>
            </div>

          </div>
        )}

      </header>

      {/* Backdrop Overlay for Mobile Drawer */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Universal Multi-Entity Search Modal */}
      <UniversalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleLinkClick}
      />
    </>
  );
};
