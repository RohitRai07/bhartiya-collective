import { featureConfig } from './featureConfig';

export interface NavChildItem {
  id: string;
  label: string;
  path: string;
  sanskritName?: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  description?: string;
  featureFlag?: keyof import('./featureConfig').FeatureFlags;
  isAction?: boolean;
  children?: NavChildItem[];
}

export const navigationConfig = {
  mainNav: [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'about', label: 'About', path: '/about' },
    { 
      id: 'centres', 
      label: 'Centres', 
      path: '/centres', 
      featureFlag: 'research',
      children: [
        { id: 'c-all', label: 'All Centres Overview', path: '/centres' },
        { id: 'c-hr', label: 'Center for Human Rights & Legal Aid', path: '/centres#human-rights-legal-aid', sanskritName: 'मानव अधिकार एवं विधि सहायता' },
        { id: 'c-labour', label: 'Center for Labour Rights Policy', path: '/centres#labour-rights-policy', sanskritName: 'श्रम अधिकार एवं नीति' },
        { id: 'c-policy', label: 'Center for Public Policy / Studies', path: '/centres#public-policy-studies', sanskritName: 'लोक नीति एवं अध्ययन' },
        { id: 'c-women', label: 'Center for Women Rights', path: '/centres#women-rights', sanskritName: 'स्त्री अधिकार एवं कल्याण' },
        { id: 'c-ipr', label: 'Center for IPR Studies', path: '/centres#ipr-studies', sanskritName: 'बौद्धिक संपदा अधिकार' },
        { id: 'c-ai', label: 'Center for Engineering & AI', path: '/centres#engineering-ai', sanskritName: 'अभियांत्रिकी एवं कृत्रिम मेधा' },
      ]
    },
    { id: 'publications', label: 'Publications', path: '/publications', featureFlag: 'publications' },
    { id: 'magazine', label: 'Magazine', path: '/magazine', featureFlag: 'magazine' },
    { id: 'podcasts', label: 'Podcasts', path: '/podcasts', featureFlag: 'podcasts' },
    { id: 'events', label: 'Event', path: '/events', featureFlag: 'events' },
    { id: 'news', label: 'Insights', path: '/news' },
    { id: 'careers', label: 'Career', path: '/careers', featureFlag: 'careers' },
    { id: 'circulars', label: 'Circulars & Legal', path: '/circulars', featureFlag: 'circulars' },
    { id: 'contact', label: 'Contact', path: '/contact' },
  ] as NavItem[],

  actionNav: [
    { id: 'register', label: 'Join Us', path: '/register', featureFlag: 'userRegistration', isAction: true },
    { id: 'support', label: 'Support Us', path: '/support-us', featureFlag: 'donations', isAction: true },
  ] as NavItem[],

  footerNav: {
    centres: [
      { id: 'centre-hr', label: 'Center for Human Rights & Legal Aid', path: '/centres#human-rights-legal-aid' },
      { id: 'centre-labour', label: 'Center for Labour Rights Policy', path: '/centres#labour-rights-policy' },
      { id: 'centre-policy', label: 'Center for Public Policy / Studies', path: '/centres#public-policy-studies' },
      { id: 'centre-women', label: 'Center for Women Rights', path: '/centres#women-rights' },
      { id: 'centre-ipr', label: 'Center for IPR Studies', path: '/centres#ipr-studies' },
      { id: 'centre-ai', label: 'Center for Engineering & AI', path: '/centres#engineering-ai' },
    ],
    researchAction: [
      { id: 'r-publications', label: 'Publications', path: '/publications' },
      { id: 'r-magazine', label: 'Magazine (Issue)', path: '/magazine' },
      { id: 'r-newsletter', label: 'Newsletter', path: '#newsletter' },
      { id: 'r-other', label: 'Other', path: '/news' },
    ],
    foundation: [
      { id: 'f-who', label: 'Who is Who', path: '/about#who-is-who' },
      { id: 'f-national', label: 'National Team', path: '/about#national-team' },
      { id: 'f-state', label: 'State Team', path: '/about#state-team' },
      { id: 'f-centres', label: 'Our Centres', path: '/centres' },
    ],
    engagePortals: [
      { id: 'e-register', label: 'Membership & Volunteership', path: '/register' },
      { id: 'e-cfp', label: 'Call for Papers', path: '/contact#papers' },
      { id: 'e-support', label: 'Support Us', path: '/support-us' },
      { id: 'e-newsletter', label: 'Newsletters', path: '/publications' },
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
