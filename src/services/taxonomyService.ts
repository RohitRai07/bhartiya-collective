/**
 * Dynamic Taxonomy & Dropdown Options Service
 * 
 * Manages custom dropdown choices, categories, roles, and tags across the Admin Portal.
 * Enables administrators to create, customize, and delete dropdown options and tags on the fly,
 * persisting them across sessions and reflecting them reactively on the public website.
 */

export interface DropdownOption {
  value: string;
  label: string;
  isCustom?: boolean;
}

export type TaxonomyGroupKey = 
  | 'circular_category'
  | 'circular_language'
  | 'publication_category'
  | 'event_category'
  | 'research_domain'
  | 'centre_theme'
  | 'centre_role'
  | 'expert_role'
  | 'national_team_role'
  | 'state_chapter_region'
  | 'state_chapter_focus'
  | 'news_category'
  | 'podcast_topic'
  | 'magazine_theme'
  | 'media_type'
  | 'career_type'
  | 'career_department'
  | 'career_status'
  | 'registration_category'
  | 'registration_status'
  | 'content_status'
  | 'cfp_status';

const STORAGE_KEY = 'bharat_collective_taxonomy_options';
const TAGS_STORAGE_KEY = 'bharat_collective_taxonomy_tags';

const DEFAULT_OPTIONS: Record<TaxonomyGroupKey, DropdownOption[]> = {
  circular_category: [
    { value: 'constitution', label: 'Constitutional Framework & Amendment' },
    { value: 'acts_statutes', label: 'Central Act & Statutory Code' },
    { value: 'circulars_rules', label: 'Administrative Circular & Rules' },
    { value: 'guidelines', label: 'Legal Guideline & Advisory' },
    { value: 'model_bills', label: 'Model Legislative Bill & Blueprint' },
  ],
  circular_language: [
    { value: 'English', label: 'English' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Bilingual', label: 'Bilingual (English + Hindi)' },
    { value: 'Sanskrit', label: 'Sanskrit' },
  ],
  publication_category: [
    { value: 'Monograph', label: 'Monograph' },
    { value: 'Policy Paper', label: 'Policy Paper' },
    { value: 'Occasional Paper', label: 'Occasional Paper' },
    { value: 'Journal Article', label: 'Journal Article' },
    { value: 'Civilizational Brief', label: 'Civilizational Brief' },
    { value: 'Working Paper', label: 'Working Paper' },
  ],
  event_category: [
    { value: 'Symposium', label: 'Symposium' },
    { value: 'Roundtable', label: 'Roundtable' },
    { value: 'Panel Discussion', label: 'Panel Discussion' },
    { value: 'Public Lecture', label: 'Public Lecture' },
    { value: 'Workshop', label: 'Workshop' },
    { value: 'National Colloquium', label: 'National Colloquium' },
  ],
  research_domain: [
    { value: 'constitutional_jurisprudence', label: 'Constitutional Jurisprudence & Decolonization' },
    { value: 'political_philosophy', label: 'Civilizational Political Philosophy & Statecraft' },
    { value: 'criminal_law_reform', label: 'Criminal Law Reform & Indigenous Evidence' },
    { value: 'decentralized_governance', label: 'Decentralized Public Policy & Municipal Governance' },
    { value: 'tech_sovereignty', label: 'Tech Sovereignty, AI Ethics & Digital Infrastructure' },
    { value: 'dharmic_institutions', label: 'Temple Governance & Dharmic Institutions' },
  ],
  centre_theme: [
    { value: 'human_rights_legal_aid', label: 'Human Rights, Constitutional Advocacy & Legal Aid Clinics' },
    { value: 'labour_rights_policy', label: 'Labour Rights, Gig Economy Welfare & Shreni Guilds' },
    { value: 'public_policy_studies', label: 'Public Policy, Comparative Federalism & Civil Services' },
    { value: 'women_rights', label: 'Women Rights, Succession Equity & Family Law Reconciliation' },
    { value: 'ipr_studies', label: 'Intellectual Property, Traditional Knowledge & Bio-piracy' },
    { value: 'engineering_ai', label: 'Engineering, AI Ethics & Civilizational Cybernetics' },
  ],
  centre_role: [
    { value: 'centre_convener', label: 'Centre Convener / Lead Scholar' },
    { value: 'senior_chair', label: 'Senior Research Chair' },
    { value: 'lead_fellow', label: 'Lead Fellow' },
    { value: 'visiting_fellow', label: 'Visiting Scholar' },
    { value: 'research_associate', label: 'Research Associate' },
    { value: 'legal_advisor', label: 'Pro-Bono Legal Advisor' },
  ],
  expert_role: [
    { value: 'advisory_council', label: 'Advisory Council Member' },
    { value: 'senior_fellow', label: 'Senior Research Fellow' },
    { value: 'visiting_fellow', label: 'Visiting Research Scholar' },
    { value: 'distinguished_fellow', label: 'Distinguished Fellow' },
    { value: 'honorary_patron', label: 'Honorary Patron' },
  ],
  national_team_role: [
    { value: 'patron_founder', label: 'Patron-in-Chief & Founder' },
    { value: 'director_general', label: 'Director General & Executive Trustee' },
    { value: 'senior_vp_research', label: 'Senior Vice President (Research)' },
    { value: 'general_secretary', label: 'General Secretary & Legal Counsel' },
    { value: 'national_convener', label: 'National Convener (Public Policy)' },
    { value: 'director_academics', label: 'Director of Academic Affairs' },
    { value: 'head_communications', label: 'Head of Strategic Communications' },
  ],
  state_chapter_region: [
    { value: 'north_zone', label: 'North Zone (Delhi, UP, Punjab, Haryana, Uttarakhand)' },
    { value: 'south_zone', label: 'South Zone (Karnataka, Tamil Nadu, Telangana, Kerala)' },
    { value: 'west_zone', label: 'West Zone (Maharashtra, Gujarat, Rajasthan, Goa)' },
    { value: 'east_zone', label: 'East Zone (West Bengal, Odisha, Bihar, Jharkhand)' },
    { value: 'central_zone', label: 'Central Zone (Madhya Pradesh, Chhattisgarh)' },
    { value: 'northeast_zone', label: 'Northeast Zone (Assam, Meghalaya, Manipur)' },
  ],
  state_chapter_focus: [
    { value: 'grassroots_legal_aid', label: 'Grassroots Legal Clinics & Citizen Redressal' },
    { value: 'vernacular_translation', label: 'Vernacular Legal Hermeneutics & Translation' },
    { value: 'panchayati_raj', label: 'Rural Decentralization & Panchayati Raj Strengthening' },
    { value: 'customary_law', label: 'Tribal Customary Law & Forest Rights Defense' },
    { value: 'youth_colloquia', label: 'University Youth Chapters & Policy Colloquia' },
  ],
  news_category: [
    { value: 'Discourse', label: 'Discourse' },
    { value: 'Perspective', label: 'Perspective' },
    { value: 'Press Release', label: 'Press Release' },
    { value: 'Announcement', label: 'Announcement' },
    { value: 'Editorial', label: 'Editorial' },
    { value: 'Analytical Brief', label: 'Analytical Brief' },
  ],
  podcast_topic: [
    { value: 'uniform_civil_code', label: 'Uniform Civil Code & Constitutional Equality' },
    { value: 'decolonizing_nyaya', label: 'Decolonizing Legal Hermeneutics: From Macaulay to Nyaya' },
    { value: 'arthashastra_geopolitics', label: 'Arthashastra for Multipolar Geopolitics' },
    { value: 'indigenous_jurisprudence', label: 'Indigenous Jurisprudence & Statutory Reform' },
    { value: 'tech_sovereignty', label: 'Tech Sovereignty, AI Ethics & Digital Bharat' },
    { value: 'dharmic_statecraft', label: 'Dharmic Statecraft & Civilizational Resilience' },
  ],
  magazine_theme: [
    { value: 'civilizational_renaissance', label: 'Civilizational Renaissance & Statecraft' },
    { value: 'decolonial_jurisprudence', label: 'Decolonial Jurisprudence & Nyaya Shastra' },
    { value: 'strategic_autonomy', label: 'Strategic Autonomy & Economic Self-Reliance' },
    { value: 'cultural_continuity', label: 'Cultural Continuity & Heritage Preservation' },
    { value: 'digital_bharat', label: 'Digital Public Infrastructure & Tech Sovereignty' },
  ],
  media_type: [
    { value: 'publication_pdf', label: 'Scholarly Monograph / PDF Paper' },
    { value: 'legal_gazette_pdf', label: 'Official Gazette & Circular Document' },
    { value: 'scholar_portrait', label: 'Scholar & Leadership Portrait' },
    { value: 'event_banner', label: 'Event Banner & Cover Art' },
    { value: 'infographic_chart', label: 'Infographic & Policy Data Chart' },
  ],
  career_type: [
    { value: 'internship', label: 'Research Internship (3–6 Months)' },
    { value: 'fellowship', label: 'Research Fellowship (1–2 Years)' },
    { value: 'legal_associate', label: 'Legal Research Associate (Full-Time)' },
    { value: 'policy_analyst', label: 'Public Policy Analyst (Full-Time)' },
    { value: 'editorial_fellow', label: 'Editorial & Publications Fellow' },
    { value: 'outreach_coordinator', label: 'Grassroots Outreach Coordinator' },
  ],
  career_department: [
    { value: 'constitutional_law', label: 'Constitutional Jurisprudence & Legal Aid' },
    { value: 'public_policy', label: 'Public Policy & Comparative Studies' },
    { value: 'engineering_ai', label: 'Centre for Engineering & AI' },
    { value: 'editorial_secretariat', label: 'Editorial Secretariat & Publications' },
    { value: 'digital_communications', label: 'Strategic Communications & Media' },
    { value: 'grassroots_operations', label: 'State Chapters & Grassroots Operations' },
  ],
  career_status: [
    { value: 'pending', label: 'Pending Review' },
    { value: 'reviewing', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted for Interview' },
    { value: 'selected', label: 'Selected & Offer Sent' },
    { value: 'rejected', label: 'Rejected / Application Closed' },
  ],
  registration_category: [
    { value: 'student_scholar', label: 'Student / Research Scholar' },
    { value: 'legal_practitioner', label: 'Legal Practitioner / Advocate' },
    { value: 'academician', label: 'Academician / University Faculty' },
    { value: 'policy_professional', label: 'Policy Professional / Civil Servant' },
    { value: 'civil_society', label: 'Civil Society Activist / Volunteer' },
  ],
  registration_status: [
    { value: 'pending', label: 'Pending Verification' },
    { value: 'verified', label: 'Verified & Approved' },
    { value: 'archived', label: 'Archived / Inactive' },
  ],
  content_status: [
    { value: 'published', label: 'Published (Visible on Website)' },
    { value: 'draft', label: 'Draft (Admin Only)' },
    { value: 'archived', label: 'Archived' },
  ],
  cfp_status: [
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
  ],
};

const DEFAULT_TAGS: string[] = [
  'Constitution',
  'Fundamental Rights',
  'Article 44',
  'Directive Principles',
  'Bare Act',
  'Criminal Law',
  'BNS 2023',
  'Penal Reform',
  'Community Service',
  'Criminal Procedure',
  'BNSS 2023',
  'Forensics',
  'Zero FIR',
  'Data Protection',
  'Privacy',
  'MeitY',
  'Uniform Civil Code',
  'Good Governance',
  'Women in Governance',
  'Judicial Transparency',
  'Epistemology',
  'Statecraft',
  'Civilizational Jurisprudence',
  'Dharma',
  'Decolonization',
  'Policy Brief',
  'Monograph'
];

// In-memory cache for fast access and Node environment testing
let inMemoryOptions: Record<string, DropdownOption[]> = { ...DEFAULT_OPTIONS };
let inMemoryTags: string[] = [...DEFAULT_TAGS];

function loadTaxonomy(): Record<string, DropdownOption[]> {
  if (typeof window === 'undefined') return inMemoryOptions;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_OPTIONS));
      return { ...DEFAULT_OPTIONS };
    }
    const parsed = JSON.parse(raw);
    // Ensure all default groups exist
    const merged: Record<string, DropdownOption[]> = { ...DEFAULT_OPTIONS };
    Object.keys(parsed).forEach(k => {
      merged[k] = parsed[k];
    });
    // Ensure newly added default groups are always populated
    Object.keys(DEFAULT_OPTIONS).forEach(k => {
      if (!merged[k] || !Array.isArray(merged[k]) || merged[k].length === 0) {
        merged[k] = [...DEFAULT_OPTIONS[k as TaxonomyGroupKey]];
      }
    });
    return merged;
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
}

function saveTaxonomy(data: Record<string, DropdownOption[]>) {
  inMemoryOptions = { ...data };
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('bharat:taxonomy-updated'));
    window.dispatchEvent(new CustomEvent('bharat:content-updated'));
  } catch (e) {
    console.warn('Could not save taxonomy options:', e);
  }
}

function loadTags(): string[] {
  if (typeof window === 'undefined') return inMemoryTags;
  try {
    const raw = localStorage.getItem(TAGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(DEFAULT_TAGS));
      return [...DEFAULT_TAGS];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_TAGS];
  }
}

function saveTags(tags: string[]) {
  inMemoryTags = [...tags];
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
    window.dispatchEvent(new CustomEvent('bharat:taxonomy-updated'));
    window.dispatchEvent(new CustomEvent('bharat:content-updated'));
  } catch (e) {
    console.warn('Could not save taxonomy tags:', e);
  }
}

export const taxonomyService = {
  /**
   * Get all dropdown options for a given group key
   */
  getOptions(groupKey: string): DropdownOption[] {
    const all = loadTaxonomy();
    return all[groupKey] || DEFAULT_OPTIONS[groupKey as TaxonomyGroupKey] || [];
  },

  /**
   * Add a new custom option to a dropdown group
   */
  addOption(groupKey: string, label: string, customValue?: string): DropdownOption {
    const cleanLabel = label.trim();
    if (!cleanLabel) {
      throw new Error('Option label cannot be empty.');
    }

    const value = (customValue || cleanLabel)
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]/g, '')
      .toLowerCase();

    const all = loadTaxonomy();
    const currentList = all[groupKey] ? [...all[groupKey]] : (DEFAULT_OPTIONS[groupKey as TaxonomyGroupKey] ? [...DEFAULT_OPTIONS[groupKey as TaxonomyGroupKey]] : []);

    // Check if option value or label already exists
    const existing = currentList.find(
      opt => opt.value.toLowerCase() === value.toLowerCase() || opt.label.toLowerCase() === cleanLabel.toLowerCase()
    );

    if (existing) {
      return existing;
    }

    const newOption: DropdownOption = {
      value: customValue ? customValue.trim() : (groupKey === 'publication_category' || groupKey === 'expert_role' || groupKey === 'event_category' || groupKey === 'news_category' ? cleanLabel : value),
      label: cleanLabel,
      isCustom: true,
    };

    all[groupKey] = [...currentList, newOption];
    saveTaxonomy(all);
    return newOption;
  },

  /**
   * Remove / delete an option from a dropdown group
   */
  removeOption(groupKey: string, value: string): void {
    const all = loadTaxonomy();
    const currentList = all[groupKey] || DEFAULT_OPTIONS[groupKey as TaxonomyGroupKey] || [];
    all[groupKey] = currentList.filter(opt => opt.value !== value);
    saveTaxonomy(all);
  },

  /**
   * Get all active suggested tags
   */
  getAllTags(): string[] {
    return loadTags();
  },

  /**
   * Alias for getAllTags
   */
  getTags(): string[] {
    return this.getAllTags();
  },

  /**
   * Add a custom tag to the global suggestion pool
   */
  addTag(tag: string): string {
    const clean = tag.trim().replace(/^#+/, '');
    if (!clean) return '';

    const list = loadTags();
    const exists = list.some(t => t.toLowerCase() === clean.toLowerCase());
    if (!exists) {
      const updated = [clean, ...list];
      saveTags(updated);
    }
    return clean;
  },

  /**
   * Remove a tag from the global suggestion pool
   */
  removeTag(tag: string): void {
    const list = loadTags();
    const filtered = list.filter(t => t.toLowerCase() !== tag.toLowerCase());
    saveTags(filtered);
  },

  /**
   * Reset a dropdown group back to system default options
   */
  resetGroup(groupKey: TaxonomyGroupKey): void {
    const all = loadTaxonomy();
    all[groupKey] = [...DEFAULT_OPTIONS[groupKey]];
    saveTaxonomy(all);
  }
};
