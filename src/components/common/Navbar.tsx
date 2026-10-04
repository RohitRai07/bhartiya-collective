import React, { useState, useEffect, useRef } from 'react';
import { navigationConfig, NavItem } from '../../config/navigationConfig';
import { siteConfig } from '../../config/siteConfig';
import { featureConfig } from '../../config/featureConfig';
import { Menu, X, Landmark, Heart, UserPlus, ChevronDown, Search } from 'lucide-react';
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setOpenDropdownId(null);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-sm transition-colors">
      
      {/* Top National Announcement Ticker */}
      {features.flagshipBanner && (
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Flagship Dialogue
            </span>
            <span className="truncate">
              #BharatDialogue on <strong>Uniform Civil Code</strong> at Constitution Club of India, New Delhi — Coming Soon!
            </span>
            <button
              type="button"
              onClick={() => handleLinkClick('/events')}
              className="underline font-bold text-amber-200 hover:text-white ml-1 cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 lg:gap-4">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => handleLinkClick('/')}
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group py-1 shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 flex items-center justify-center text-white shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform shrink-0">
              <Landmark className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="shrink-0">
              <span className="block font-serif text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-bold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
                {siteConfig.name}
              </span>
              <span className="block text-[8px] sm:text-[9px] lg:text-[10px] xl:text-[11px] uppercase tracking-wider font-semibold text-amber-700 whitespace-nowrap">
                {siteConfig.tagline}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav ref={dropdownRef} className="hidden lg:flex items-center space-x-0.5 xl:space-x-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path || (item.children && item.children.some(c => currentPath === c.path));
              const hasChildren = item.children && item.children.length > 0;
              const isDropdownOpen = openDropdownId === item.id;

              if (hasChildren) {
                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => setOpenDropdownId(item.id)}
                    onMouseLeave={() => setOpenDropdownId(null)}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDropdownId(prev => prev === item.id ? null : item.id)}
                      className={`inline-flex items-center space-x-1 px-2 xl:px-2.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'text-amber-800 bg-amber-50 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-amber-700' : ''}`} />
                    </button>

                    {/* Multilevel Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                          Centres & Institutes
                        </div>

                        {item.children!.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleLinkClick(child.path)}
                            className="w-full text-left px-3.5 py-2 text-xs hover:bg-amber-50/70 transition-colors flex flex-col group cursor-pointer"
                          >
                            <span className="font-semibold text-slate-800 group-hover:text-amber-900">
                              {child.label}
                            </span>
                            {child.sanskritName && (
                              <span className="text-[10px] text-slate-400 font-serif group-hover:text-amber-700">
                                {child.sanskritName}
                              </span>
                            )}
                          </button>
                        ))}
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
                  className={`px-2 xl:px-2.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-amber-800 bg-amber-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 xl:space-x-3 shrink-0">
            {/* Universal Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:text-amber-900 bg-slate-100/90 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer"
              title="Universal Search (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-amber-800" />
              <span className="hidden md:inline text-xs text-slate-500 font-normal">Search...</span>
              <kbd className="hidden xl:inline px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] text-slate-400 font-mono shadow-2xs">⌘K</kbd>
            </button>

            {/* Action CTAs */}
            <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-2 xl:space-x-3">
              {actionItems.map((action) => {
                const isSupport = action.id === 'support';
                const isRegister = action.id === 'register';

                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleLinkClick(action.path)}
                    className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 xl:px-4 py-1.5 sm:py-2 rounded-xl text-xs xl:text-sm font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap ${
                      isSupport
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                        : 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20'
                    }`}
                  >
                    {isSupport && <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />}
                    {isRegister && <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile / Tablet Menu & Search Triggers */}
            <div className="flex lg:hidden items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-slate-200/80 cursor-pointer transition-colors"
                aria-label="Universal Search"
              >
                <Search className="w-5 h-5 text-amber-800" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-amber-800" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 shadow-xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-top duration-200">
          <div className="space-y-1">
            {navItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = mobileExpandedId === item.id;
              const isActive = currentPath === item.path;

              if (hasChildren) {
                return (
                  <div key={item.id} className="border-b border-slate-100 pb-1">
                    <button
                      type="button"
                      onClick={() => setMobileExpandedId(isExpanded ? null : item.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-amber-700' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="pl-3 pr-1 py-1 space-y-1 bg-amber-50/50 rounded-xl my-1 border border-amber-100">
                        {item.children!.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleLinkClick(child.path)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-white hover:text-amber-900 cursor-pointer"
                          >
                            {child.label}
                          </button>
                        ))}
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
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm sm:text-base font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 font-bold border-l-4 border-amber-600 pl-2.5'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 sm:hidden">
            {actionItems.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleLinkClick(action.path)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
              >
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-serif italic">{siteConfig.tagline}</span>
            <button
              type="button"
              onClick={() => handleLinkClick('/admin')}
              className="text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
            >
              Admin Portal
            </button>
          </div>
        </div>
      )}

      {/* Universal Search Modal (Accessible via search icon or Ctrl+K) */}
      <UniversalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleLinkClick}
      />

    </header>
  );
};
