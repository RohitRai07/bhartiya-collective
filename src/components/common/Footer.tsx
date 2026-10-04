import React, { useState, useEffect } from 'react';
import { navigationConfig } from '../../config/navigationConfig';
import { siteConfig } from '../../config/siteConfig';
import { featureConfig } from '../../config/featureConfig';
import { NewsletterForm } from '../newsletter/NewsletterForm';
import { 
  Landmark, 
  Mail, 
  MapPin, 
  Phone, 
  Lock, 
  ExternalLink 
} from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const [features, setFeatures] = useState(featureConfig.get());

  useEffect(() => {
    const handleFeatureChange = () => {
      setFeatures(featureConfig.get());
    };
    window.addEventListener('bhartiya:feature-change', handleFeatureChange);
    return () => window.removeEventListener('bhartiya:feature-change', handleFeatureChange);
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-amber-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Newsletter Subscription (Specification #4) */}
        {features.newsletter && (
          <div id="newsletter" className="mb-14 pb-12 border-b border-slate-800">
            <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-3">
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                    Subscribe Our News Letter
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Receive our Columns, Magazines, Events & programs directly in your inbox.
                  </p>
                </div>

                <div className="lg:col-span-6">
                  <NewsletterForm source="footer-main" variant="compact" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Middle Section: Connect With Us & Social Media */}
        <div className="mb-12 pb-10 border-b border-slate-800/80">
          <div className="bg-slate-900/40 p-6 sm:p-8 rounded-2xl border border-slate-800">
            <h4 className="font-serif text-lg font-bold text-white mb-2">Connect With Us</h4>
            <p className="text-xs text-slate-400 mb-6">
              Stay connected with Bharat Collective Foundation and be a part of our journey.
            </p>

            <div className="flex flex-wrap gap-3">
              {/* Instagram */}
              <a
                href={siteConfig.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all hover:scale-102"
              >
                <span className="text-pink-400 font-bold">IG</span>
                <span>Follow us on Instagram</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              {/* Facebook */}
              <a
                href={siteConfig.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all hover:scale-102"
              >
                <span className="text-blue-400 font-bold">FB</span>
                <span>Connect on Facebook</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              {/* LinkedIn */}
              <a
                href={siteConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all hover:scale-102"
              >
                <span className="text-sky-400 font-bold">in</span>
                <span>Join our professional network</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              {/* X / Twitter */}
              <a
                href={siteConfig.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all hover:scale-102"
              >
                <span className="text-slate-100 font-bold">𝕏</span>
                <span>Follow our updates</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              {/* YouTube */}
              <a
                href={siteConfig.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all hover:scale-102"
              >
                <span className="text-red-400 font-bold">YT</span>
                <span>Subscribe to YouTube channel</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Links Grid: Exact 5-Column Hierarchy (Specification #24) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 pb-12 border-b border-slate-800/80">
          
          {/* Brand & Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/30 flex-shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-white tracking-tight block">
                  {siteConfig.name}
                </span>
                <span className="text-[11px] text-amber-400 block font-medium">
                  {siteConfig.tagline}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {siteConfig.description}
            </p>

            <div className="text-xs text-slate-400 space-y-2.5 pt-2">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{siteConfig.contact.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{siteConfig.contact.email}</span>
              </div>
              <div className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="block">{siteConfig.contact.phone}</span>
                  <span className="block">{siteConfig.contact.phoneSecondary}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Centres/Institutes */}
          {features.research && (
            <div>
              <h4 className="font-serif text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                Centres / Institutes
              </h4>
              <ul className="space-y-2 text-xs">
                {navigationConfig.footerNav.centres.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.path)}
                      className="text-slate-400 hover:text-amber-400 transition-colors text-left cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Research & Action */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Research & Action
            </h4>
            <ul className="space-y-2 text-xs">
              {navigationConfig.footerNav.researchAction
                .filter(item => {
                  if (item.id === 'r-publications') return features.publications;
                  if (item.id === 'r-magazine') return features.magazine;
                  if (item.id === 'r-newsletter') return features.newsletter;
                  if (item.id === 'r-other') return features.news;
                  return true;
                })
                .map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.path)}
                      className="text-slate-400 hover:text-amber-400 transition-colors text-left cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          {/* 3. The Foundation */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              The Foundation
            </h4>
            <ul className="space-y-2 text-xs">
              {navigationConfig.footerNav.foundation
                .filter(item => {
                  if (item.id === 'f-who') return features.experts;
                  if (item.id === 'f-national') return features.nationalTeam;
                  if (item.id === 'f-state') return features.stateTeam;
                  if (item.id === 'f-centres') return features.research;
                  return true;
                })
                .map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.path)}
                      className="text-slate-400 hover:text-amber-400 transition-colors text-left cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          {/* 4. Engage & Portals */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Engage & Portals
            </h4>
            <ul className="space-y-2 text-xs">
              {navigationConfig.footerNav.engagePortals
                .filter(item => {
                  if (item.id === 'e-register') return features.userRegistration;
                  if (item.id === 'e-cfp') return features.callForPapers;
                  if (item.id === 'e-support') return features.donations;
                  if (item.id === 'e-newsletter') return features.newsletter;
                  return true;
                })
                .map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.path)}
                      className="text-slate-400 hover:text-amber-400 transition-colors text-left cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              <li className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/admin')}
                  className="inline-flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Section: Dynamic Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {currentYear} {siteConfig.name}. All Rights Reserved. {siteConfig.legal.registeredSociety}.
          </p>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="text-slate-500 hover:text-slate-400 text-[11px] cursor-pointer"
            >
              Admin Access
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Non-Partisan & Open-Access</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
