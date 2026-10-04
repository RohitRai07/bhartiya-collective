/**
 * Centralized Feature Flag Configuration
 * 
 * Future capabilities can be toggled without breaking the existing website.
 * All UI components and services check feature flags gracefully.
 */

export interface FeatureFlags {
  /** Public donation info / Support Us section */
  donations: boolean;
  /** Public user registration form */
  userRegistration: boolean;
  /** Newsletter subscription forms */
  newsletter: boolean;
  /** Live Payment Gateway integration (Phase 5) - False for now */
  paymentIntegration: boolean;
  /** Admin Dashboard & Management UI (Phase 3) - False for public site */
  adminPanel: boolean;
  /** User Authentication & Login (Phase 4) - False for public site */
  authentication: boolean;
  /** Call for Papers submission workflow */
  callForPapers: boolean;
  /** Public events and symposia listing */
  events: boolean;
  /** Research domains and working papers */
  research: boolean;
  /** Publications catalogue */
  publications: boolean;
  /** Auto-fetch location details from PIN code API */
  pincodeAutoFetch: boolean;
  /** Real-time Architecture Inspector widget for pair-programming and review */
  architectureInspector: boolean;
  /** Circulars & Legal Materials public section (Disabled by default, toggleable via admin) */
  circulars: boolean;
  /** Podcasts section */
  podcasts: boolean;
  /** Magazine section */
  magazine: boolean;
  /** Career section */
  careers: boolean;
  /** National Team section on About page */
  nationalTeam: boolean;
  /** State Team & Regional Chapters section on About page */
  stateTeam: boolean;
}

export const defaultFeatureConfig: FeatureFlags = {
  donations: true,
  userRegistration: true,
  newsletter: true,
  paymentIntegration: false,    // Payment gateway is NOT required currently (clean service boundary only)
  adminPanel: false,            // Isolated from public website
  authentication: false,        // Deferred to future Phase 4
  callForPapers: true,
  events: true,
  research: true,
  publications: true,
  pincodeAutoFetch: true,       // Integrated via isolated pincodeService
  architectureInspector: true,  // Handy debug/architecture audit tool
  circulars: false,             // Disabled by default per user specification #18 & #19
  podcasts: true,
  magazine: true,
  careers: true,
  nationalTeam: true,
  stateTeam: true,
};

const STORAGE_KEY = 'bharat_feature_flags';

function loadStoredFeatures(): FeatureFlags {
  if (typeof window === 'undefined') return { ...defaultFeatureConfig };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultFeatureConfig };
    const parsed = JSON.parse(raw);
    return { ...defaultFeatureConfig, ...parsed };
  } catch {
    return { ...defaultFeatureConfig };
  }
}

function saveFeatures(flags: FeatureFlags) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    } catch {}
  }
}

// Runtime state that can be observed or overridden during testing
let currentFeatures: FeatureFlags = loadStoredFeatures();

export const featureConfig = {
  /**
   * Get the current snapshot of feature flags
   */
  get(): FeatureFlags {
    return { ...currentFeatures };
  },

  /**
   * Check if a specific feature is enabled
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    return !!currentFeatures[feature];
  },

  /**
   * Dynamically toggle or update feature flags at runtime (persists to localStorage)
   */
  update(newFlags: Partial<FeatureFlags>): FeatureFlags {
    currentFeatures = { ...currentFeatures, ...newFlags };
    saveFeatures(currentFeatures);
    // Notify listeners if needed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bhartiya:feature-change', { detail: currentFeatures }));
    }
    return { ...currentFeatures };
  },

  /**
   * Reset to pristine defaults
   */
  reset(): FeatureFlags {
    currentFeatures = { ...defaultFeatureConfig };
    saveFeatures(currentFeatures);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bhartiya:feature-change', { detail: currentFeatures }));
    }
    return { ...currentFeatures };
  }
};
