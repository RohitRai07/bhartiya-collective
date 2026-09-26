import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { siteConfig } from './config/siteConfig';

// Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ResearchPage } from './pages/ResearchPage';
import { PublicationsPage } from './pages/PublicationsPage';
import { EventsPage } from './pages/EventsPage';
import { NewsPage } from './pages/NewsPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { SupportUsPage } from './pages/SupportUsPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPreviewPage } from './pages/AdminPreviewPage';

function getPathFromHash(): string {
  if (typeof window === 'undefined') return '/';
  const rawHash = window.location.hash || '';
  const clean = rawHash.replace(/^#\/?/, '/');
  return clean || '/';
}

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => getPathFromHash());

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
    const formatted = path.startsWith('/') ? path : `/${path}`;
    const targetHash = `#${formatted}`;

    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setCurrentPath(formatted);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Isolated Admin Portal Route (Protected by Admin Credentials)
  if (currentPath === '/admin' || currentPath === '/admin/login') {
    return (
      <AdminPreviewPage onBackToPublicSite={() => navigateTo('/')} />
    );
  }

  // Render appropriate public page based on route
  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return <HomePage onNavigate={navigateTo} />;
      case '/about':
        return <AboutPage />;
      case '/research':
        return <ResearchPage />;
      case '/publications':
        return <PublicationsPage />;
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
        {renderPage()}
      </main>

      {/* Footer with Embedded Newsletter and Official Social Links */}
      <Footer 
        onNavigate={navigateTo} 
      />

    </div>
  );
}

export default App;
