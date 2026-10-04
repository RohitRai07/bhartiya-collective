/**
 * Centralized Site Configuration for Bharat Collective Foundation
 * Connecting Bharat, Bringing Minds Together
 */
export const siteConfig = {
  name: 'Bharat Collective Foundation',
  shortName: 'Bharat Collective',
  tagline: 'Connecting Bharat, Bringing Minds Together',
  secondaryMotto: 'Empowering Citizens. Advancing Policy. Transforming Bharat.',
  description: 'An independent, non-partisan institution bridging legal aid, grassroots empowerment, and policy reform rooted in Indian values.',
  establishedYear: 2024,
  organizationType: 'Non-Profit Research & Policy Foundation',
  contact: {
    email: 'contact@bharatcollective.org',
    pressEmail: 'media@bharatcollective.org',
    phone: '+91 80768 02450',
    phoneSecondary: '+91 77658 32852',
    phones: ['+91 80768 02450', '+91 77658 32852'],
    address: 'Jasmine Grove Apartment, H-1, 410, Ghaziabad, UP: 201002',
  },
  // Official verified social media channels
  socials: {
    instagram: 'https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=91naw9n',
    facebook: 'https://www.facebook.com/share/1Hbj3Caetg/',
    linkedin: 'https://www.linkedin.com/in/bharat-collective-foundation-undefined-757609438?utm_source=share_via&utm_content=profile&utm_medium=member_android',
    twitter: 'https://x.com/Bharat_collect',
    youtube: 'https://youtube.com/@bharatcollectivefoundation?si=mewvfGQCneImmMo4',
  },
  // Flagship event spotlight
  flagshipEvent: {
    title: '#BharatDialogue on UNIFORM CIVIL CODE',
    subtitle: 'A Dialogue on Law, Equality & Constitutional Values',
    status: 'COMING SOON',
    venue: 'Constitution Club of India, Rafi Marg, Sansad Marg Area, New Delhi, Delhi 110001',
    bannerImage: '/images/bharat-dialogue-ucc-banner.jpg',
  },
  legal: {
    registeredSociety: 'Registered under Societies Registration Act XXI of 1860',
    panTaxExemptionStatus: '80G & 12A compliant (Application in pipeline)',
  }
} as const;

export type SiteConfig = typeof siteConfig;
