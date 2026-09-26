import React, { useState, useEffect } from 'react';
import { navigationConfig, NavItem } from '../../config/navigationConfig';
import { siteConfig } from '../../config/siteConfig';
import { Menu, X, Landmark, Heart, UserPlus } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [actionItems, setActionItems] = useState<NavItem[]>([]);

  useEffect(() => {
    const refreshNav = () => {
      setNavItems(navigationConfig.getActiveMainNav());
      setActionItems(navigationConfig.getActiveActionNav());
    };

    refreshNav();
    window.addEventListener('bhartiya:feature-change', refreshNav);
    return () => window.removeEventListener('bhartiya:feature-change', refreshNav);
  }, []);

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-sm transition-colors">
      
      {/* Top National Announcement Ticker */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => handleLinkClick('/')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 flex items-center justify-center text-white shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="block font-serif text-lg sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                {siteConfig.name}
              </span>
              <span className="block text-[11px] uppercase tracking-wider font-semibold text-amber-700">
                {siteConfig.tagline}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLinkClick(item.path)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
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

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center space-x-3">
            {actionItems.map((action) => {
              const isSupport = action.id === 'support';
              const isRegister = action.id === 'register';

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleLinkClick(action.path)}
                  className={`inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                    isSupport
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                      : 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20'
                  }`}
                >
                  {isSupport && <Heart className="w-4 h-4 text-amber-700" />}
                  {isRegister && <UserPlus className="w-4 h-4 text-white" />}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLinkClick(item.path)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-base font-medium ${
                  currentPath === item.path
                    ? 'bg-amber-50 text-amber-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {actionItems.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleLinkClick(action.path)}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700"
              >
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
