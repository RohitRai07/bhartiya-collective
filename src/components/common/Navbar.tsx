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
  Sparkles
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
  const [centresDropdownOpen, setCentresDropdownOpen] = useState(false);
  const [mobileCentresExpanded, setMobileCentresExpanded] = useState(true);

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
        setCentresDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCentresDropdownOpen(false);
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
    setCentresDropdownOpen(false);

    if (path.includes('#')) {
      const hash = path.split('#')[1];
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const isItemActive = (item: NavItem) => {
    if (currentPath === item.path) return true;
    if (item.children && item.children.some(c => currentPath === c.path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-xs transition-colors">
        
        {/* Top Flagship Announcement Ticker */}
        {features.flagshipBanner && (
          <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 border-b border-amber-950/20 shadow-inner">
            <div className="max-w-7xl mx-auto flex items-center justify-between sm:justify-center gap-2">
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <span className="bg-white/20 text-white font-bold px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] uppercase tracking-wider shrink-0">
                  Flagship
                </span>
                <p className="truncate text-amber-100 text-left">
                  <span className="hidden md:inline">#BharatDialogue on </span>
                  <strong className="text-white font-semibold">Uniform Civil Code</strong>
                  <span className="hidden sm:inline"> — Constitution Club, New Delhi</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLinkClick('/events')}
                className="shrink-0 font-bold text-amber-200 hover:text-white underline text-[11px] cursor-pointer"
              >
                Details &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Main Navbar Bar */}
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-2 xl:gap-4">
            
            {/* Brand Logo & Title */}
            <div 
              onClick={() => handleLinkClick('/')}
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group py-1 shrink-0"
              role="button"
              aria-label="Go to homepage"
            >
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 flex items-center justify-center text-white shadow-md shadow-amber-700/20 group-hover:scale-105 transition-transform shrink-0">
                <Landmark className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div className="shrink-0 flex flex-col justify-center">
                <span className="font-serif text-sm sm:text-base lg:text-lg xl:text-xl font-bold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
                  <span className="hidden sm:inline">{siteConfig.name}</span>
                  <span className="sm:hidden">{siteConfig.shortName}</span>
                </span>
                <span className="hidden md:block text-[9px] lg:text-[10px] xl:text-[10.5px] uppercase tracking-wider font-semibold text-amber-700 whitespace-nowrap leading-tight mt-0.5">
                  {siteConfig.tagline}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav ref={dropdownRef} className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 min-w-0">
              {navItems.map((item) => {
                const isActive = isItemActive(item);
                const hasChildren = item.children && item.children.length > 0;

                // Centres Dropdown item
                if (hasChildren) {
                  return (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => setCentresDropdownOpen(true)}
                      onMouseLeave={() => setCentresDropdownOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => setCentresDropdownOpen(prev => !prev)}
                        className={`inline-flex items-center space-x-1 px-2 xl:px-2.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-[13px] 2xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'text-amber-900 bg-amber-50 font-bold border border-amber-200/80 shadow-xs'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                        aria-expanded={centresDropdownOpen}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${centresDropdownOpen ? 'rotate-180 text-amber-700' : ''}`} />
                      </button>

                      {/* Centres Dropdown Menu */}
                      {centresDropdownOpen && (
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

                // Standard Nav Links
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLinkClick(item.path)}
                    className={`px-2 xl:px-2.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-[13px] 2xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'text-amber-900 bg-amber-50 font-bold border border-amber-200/80 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right Action & Search Area */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              
              {/* Universal Search (Desktop) */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-amber-900 bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-xs"
                title="Search website (Ctrl+K or ⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-amber-800" />
                <span className="hidden xl:inline text-slate-500 font-normal">Search...</span>
                <kbd className="hidden 2xl:inline px-1 py-0.5 bg-white rounded border border-slate-200 text-[9px] text-slate-400 font-mono">⌘K</kbd>
              </button>

              {/* Action CTAs (Desktop / Tablet) */}
              <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-2">
                {actionItems.map((action) => {
                  const isSupport = action.id === 'support';
                  const isRegister = action.id === 'register';

                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleLinkClick(action.path)}
                      className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap ${
                        isSupport
                          ? 'hidden xl:inline-flex bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
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

              {/* Universal Search Trigger (Mobile & Tablet - ONLY ONE) */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="lg:hidden p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 cursor-pointer transition-colors shadow-xs"
                aria-label="Universal Search"
              >
                <Search className="w-5 h-5 text-amber-800" />
              </button>

              {/* Hamburger Menu Toggle Button (Mobile & Tablet) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(prev => !prev)}
                className="lg:hidden p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-colors shadow-xs"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>

            </div>

          </div>
        </div>

      </header>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Sheet (Fixed Overlay, No Page Content Shift) */}
      {mobileMenuOpen && (
        <div 
          className="fixed top-16 sm:top-[72px] inset-x-0 bottom-0 z-50 lg:hidden bg-white/98 backdrop-blur-md border-t border-slate-200 shadow-2xl overflow-y-auto overscroll-contain animate-in slide-in-from-top duration-200 flex flex-col justify-between p-4 space-y-4"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          
          <div className="space-y-3">
            {/* Quick Search Trigger inside Drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchModalOpen(true);
              }}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-500 hover:text-amber-900 hover:bg-amber-50 border border-slate-200 transition-colors text-left text-xs sm:text-sm font-medium cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-700" />
              <span className="flex-1">Search centres, research, events...</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-400 font-bold uppercase">Search</span>
            </button>

            {/* Navigation Links List */}
            <div className="space-y-1 divide-y divide-slate-100">
              
              {/* Core Links */}
              <div className="pb-1 space-y-1">
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
                <div className="py-1.5">
                  {(() => {
                    const centresItem = navItems.find(i => i.id === 'centres')!;
                    return (
                      <div>
                        <button
                          type="button"
                          onClick={() => setMobileCentresExpanded(prev => !prev)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <Landmark className="w-4 h-4 text-amber-700" />
                            <span>Centres & Institutes</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">6 Centres</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileCentresExpanded ? 'rotate-180 text-amber-700' : ''}`} />
                          </div>
                        </button>

                        {mobileCentresExpanded && centresItem.children && (
                          <div className="pl-3 pr-1 py-1.5 space-y-1 bg-amber-50/50 rounded-xl my-1 border border-amber-100">
                            {centresItem.children.map((child) => (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => handleLinkClick(child.path)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex flex-col cursor-pointer ${
                                  currentPath === child.path
                                    ? 'bg-white text-amber-900 font-bold shadow-xs'
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

              {/* Research, Publications & Media Links */}
              <div className="py-1.5 space-y-1">
                {navItems.filter(i => ['publications', 'magazine', 'podcasts', 'events', 'news'].includes(i.id)).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLinkClick(item.path)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                      currentPath === item.path
                        ? 'bg-amber-50 text-amber-900 font-bold border-l-4 border-amber-600 pl-2.5'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Careers, Circulars & Contact Links */}
              <div className="py-1.5 space-y-1">
                {navItems.filter(i => ['careers', 'circulars', 'contact'].includes(i.id)).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLinkClick(item.path)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                      currentPath === item.path
                        ? 'bg-amber-50 text-amber-900 font-bold border-l-4 border-amber-600 pl-2.5'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Action CTAs in Mobile Drawer */}
          <div className="pt-2 space-y-2 border-t border-slate-100">
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

            {/* Drawer Footer */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 px-1">
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

        </div>
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
