import { featureConfig } from './featureConfig';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  description?: string;
  featureFlag?: keyof import('./featureConfig').FeatureFlags;
  isAction?: boolean;
}

export const navigationConfig = {
  mainNav: [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'about', label: 'About', path: '/about' },
    { id: 'research', label: 'Research', path: '/research', featureFlag: 'research' },
    { id: 'publications', label: 'Publications', path: '/publications', featureFlag: 'publications' },
    { id: 'circulars', label: 'Circulars & Legal', path: '/circulars' },
    { id: 'events', label: 'Events', path: '/events', featureFlag: 'events' },
    { id: 'news', label: 'Insights & News', path: '/news' },
    { id: 'contact', label: 'Contact', path: '/contact' },
  ] as NavItem[],

  actionNav: [
    { id: 'register', label: 'Join Collective', path: '/register', featureFlag: 'userRegistration', isAction: true },
    { id: 'support', label: 'Support Us', path: '/support-us', featureFlag: 'donations', isAction: true },
  ] as NavItem[],

  footerNav: {
    initiatives: [
      { id: 'circulars-legal', label: 'Statutory Circulars & Lex', path: '/circulars' },
      { id: 'research-domains', label: 'Research Domains', path: '/research' },
      { id: 'monographs', label: 'Monographs & Papers', path: '/publications' },
      { id: 'symposia', label: 'National Symposia', path: '/events' },
      { id: 'fellowships', label: 'Visiting Fellowships', path: '/register' },
    ],
    collective: [
      { id: 'charter', label: 'Civilizational Charter', path: '/about' },
      { id: 'leadership', label: 'Advisory Council', path: '/about#advisory' },
      { id: 'ethics', label: 'Research Integrity & Ethics', path: '/about#ethics' },
      { id: 'careers', label: 'Scholarly Opportunities', path: '/contact' },
    ],
    participate: [
      { id: 'register-link', label: 'Membership & Registration', path: '/register' },
      { id: 'support-link', label: 'Support the Collective', path: '/support-us' },
      { id: 'submissions', label: 'Call for Papers', path: '/contact#papers' },
      { id: 'newsletter', label: 'Policy Digest', path: '#newsletter' },
    ]
  },

  /**
   * Returns only navigation items whose feature flags are currently active
   */
  getActiveMainNav(): NavItem[] {
    return this.mainNav.filter(item => {
      if (!item.featureFlag) return true;
      return featureConfig.isEnabled(item.featureFlag);
    });
  },

  getActiveActionNav(): NavItem[] {
    return this.actionNav.filter(item => {
      if (!item.featureFlag) return true;
      return featureConfig.isEnabled(item.featureFlag);
    });
  }
};
