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
  | 'expert_role'
  | 'news_category'
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
  ],
  event_category: [
    { value: 'Symposium', label: 'Symposium' },
    { value: 'Roundtable', label: 'Roundtable' },
    { value: 'Panel Discussion', label: 'Panel Discussion' },
    { value: 'Public Lecture', label: 'Public Lecture' },
    { value: 'Workshop', label: 'Workshop' },
  ],
  expert_role: [
    { value: 'advisory_council', label: 'Advisory Council Member' },
    { value: 'senior_fellow', label: 'Senior Research Fellow' },
    { value: 'visiting_fellow', label: 'Visiting Research Scholar' },
  ],
  news_category: [
    { value: 'Discourse', label: 'Discourse' },
    { value: 'Perspective', label: 'Perspective' },
    { value: 'Press Release', label: 'Press Release' },
    { value: 'Announcement', label: 'Announcement' },
    { value: 'Editorial', label: 'Editorial' },
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
