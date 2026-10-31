/**
 * Centralized Site Configuration for Bharat Collective Foundation
 * Connecting Bharat, Bringing Minds Together
 */
const rawBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
  ? import.meta.env.BASE_URL
  : '/';
const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

// Centralized official office email (configurable via VITE_OFFICE_EMAIL)
const officeEmail = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OFFICE_EMAIL)
  || 'office@bharatcollective.in';

// Centralized official contact mobile (configurable via VITE_OFFICE_PHONE)
const officePhone = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OFFICE_PHONE)
  || '+91 80768 02450';

const officePhoneSecondary = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OFFICE_PHONE_SECONDARY)
  || '+91 77658 32852';

const cleanPhone = officePhone.replace(/[\s-]/g, '');
const cleanPhoneSecondary = officePhoneSecondary.replace(/[\s-]/g, '');

const defaultEmailSubject = 'Bharat Collective Foundation – General Enquiry';
const callForPapersEmailSubject = 'Call for Papers - Bharat Collective Foundation';

export const siteConfig = {
  name: 'Bharat Collective Foundation',
  shortName: 'Bharat Collective',
  tagline: 'Connecting Bharat, Bringing Minds Together',
  secondaryMotto: 'Empowering Citizens. Advancing Policy. Transforming Bharat.',
  logoUrl: `${baseUrl}images/bharat-collective-logo.jpg`,
  emblemUrl: `${baseUrl}images/bharat-collective-emblem.png`,
  description: 'An independent, non-partisan institution bridging legal aid, grassroots empowerment, and policy reform rooted in Indian values.',
  establishedYear: 2024,
  organizationType: 'Non-Profit Research & Policy Foundation',
  contact: {
    email: officeEmail,
    pressEmail: officeEmail,
    officeEmail,
    phone: officePhone,
    phoneSecondary: officePhoneSecondary,
    phones: [officePhone, officePhoneSecondary],
    phoneClean: cleanPhone,
    phoneSecondaryClean: cleanPhoneSecondary,
    address: 'Jasmine Grove Apartment, H-1, 410, Ghaziabad, UP: 201002',
    defaultEmailSubject,
    callForPapersEmailSubject,
    defaultMailto: `mailto:${officeEmail}?subject=${encodeURIComponent(defaultEmailSubject)}`,
    callForPapersMailto: `mailto:${officeEmail}?subject=${encodeURIComponent(callForPapersEmailSubject)}`,
    phoneTel: `tel:${cleanPhone}`,
    phoneSecondaryTel: `tel:${cleanPhoneSecondary}`,
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
    bannerImage: `${baseUrl}images/bharat-dialogue-ucc-banner.jpg`,
  },
  legal: {
    registeredSociety: 'Registered under Societies Registration Act XXI of 1860',
    panTaxExemptionStatus: '80G & 12A compliant (Application in pipeline)',
  }
} as const;

export type SiteConfig = typeof siteConfig;
