import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { CentresPage } from './pages/CentresPage';
import { PublicationsPage } from './pages/PublicationsPage';
import { MagazinePage } from './pages/MagazinePage';
import { PodcastsPage } from './pages/PodcastsPage';
import { CareerPage } from './pages/CareerPage';
import { CircularsPage } from './pages/CircularsPage';
import { EventsPage } from './pages/EventsPage';
import { NewsPage } from './pages/NewsPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { SupportUsPage } from './pages/SupportUsPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPreviewPage } from './pages/AdminPreviewPage';

function getInitialPath(): string {
  if (typeof window === 'undefined') return '/';
  if (window.location.hash) {
    const clean = window.location.hash.replace(/^#\/?/, '/');
    return clean || '/';
  }
  const pathname = window.location.pathname;
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const cleanBase = base.endsWith('/') && base !== '/' ? base.slice(0, -1) : base;
  if (cleanBase && cleanBase !== '/' && pathname.startsWith(cleanBase)) {
    const sub = pathname.slice(cleanBase.length);
    return (sub.startsWith('/') ? sub : `/${sub}`) || '/';
  }
  return pathname || '/';
}

function getPathFromHash(): string {
  if (typeof window === 'undefined') return '/';
  const rawHash = window.location.hash || '';
  const clean = rawHash.replace(/^#\/?/, '/');
  return clean || '/';
}

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => getInitialPath());

  // Listen to hash changes safely without causing reload loops
  useEffect(() => {
    const onHashChange = () => {
      const nextPath = getPathFromHash();
      setCurrentPath(prev => (prev !== nextPath ? nextPath : prev));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = useCallback((path: string) => {
    // If it's an in-page anchor like #newsletter
    if (path.startsWith('#')) {
      const targetId = path.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const formatted = path.startsWith('/') ? path : `/${path}`;
    const targetHash = `#${formatted}`;

    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setCurrentPath(formatted);

    // If destination has a hash anchor like /about#who-is-who
    if (formatted.includes('#')) {
      const targetId = formatted.split('#')[1];
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Isolated Admin Portal Route (Protected by Admin Credentials)
  if (currentPath === '/admin' || currentPath === '/admin/login') {
    return (
      <ErrorBoundary>
        <AdminPreviewPage onBackToPublicSite={() => navigateTo('/')} />
      </ErrorBoundary>
    );
  }

  // Base route without hash anchor
  const baseRoute = currentPath.split('#')[0] || '/';

  // Render appropriate public page based on route
  const renderPage = () => {
    switch (baseRoute) {
      case '/':
        return <HomePage onNavigate={navigateTo} />;
      case '/about':
        return <AboutPage />;
      case '/centres':
      case '/research':
        return <CentresPage onNavigate={navigateTo} />;
      case '/publications':
        return <PublicationsPage />;
      case '/magazine':
        return <MagazinePage />;
      case '/podcasts':
        return <PodcastsPage />;
      case '/careers':
        return <CareerPage onNavigate={navigateTo} />;
      case '/circulars':
        return <CircularsPage onNavigate={navigateTo} />;
      case '/events':
        return <EventsPage onNavigate={navigateTo} />;
      case '/news':
        return <NewsPage />;
      case '/register':
        return <RegistrationPage />;
      case '/support-us':
        return <SupportUsPage />;
      case '/contact':
        return <ContactPage />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-slate-800 selection:bg-amber-200 selection:text-amber-900 font-sans">
      
      {/* Top Main Navigation */}
      <Navbar 
        currentPath={currentPath} 
        onNavigate={navigateTo}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        <ErrorBoundary>
          {renderPage()}
        </ErrorBoundary>
      </main>

      {/* Footer with Embedded Newsletter and Official Social Links */}
      <Footer 
        onNavigate={navigateTo} 
      />

    </div>
  );
}

export default App;
