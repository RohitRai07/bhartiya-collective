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
};

// In-memory runtime state that can be observed or overridden during testing
let currentFeatures: FeatureFlags = { ...defaultFeatureConfig };

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
   * Dynamically toggle or update feature flags at runtime (useful for demonstration)
   */
  update(newFlags: Partial<FeatureFlags>): FeatureFlags {
    currentFeatures = { ...currentFeatures, ...newFlags };
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bhartiya:feature-change', { detail: currentFeatures }));
    }
    return { ...currentFeatures };
  }
};
