/**
 * Centralized API & Networking Configuration
 * 
 * Provides base URLs, mock mode toggles, timeouts, and route endpoints.
 * Services reference this configuration without hardcoding endpoints in UI or business logic.
 */

export const apiConfig = {
  // Base configuration
  baseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api',
  timeoutMs: 10000,
  
  // Phase 1 Default: Use local mock/in-memory data layer
  // In Phase 2: Set VITE_USE_MOCK_DATA=false to switch to live backend without altering UI!
  useMockData: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCK_DATA === 'false') ? false : true,

  // 2FA / OTP Provider status: false until real third-party provider credentials are configured
  isRealOtpProviderConfigured: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OTP_PROVIDER_CONFIGURED === 'true') ? true : false,

  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-App': 'Bhartiya-Collective-Web',
    'X-Client-Version': '1.0.0',
  },

  // Service Endpoints (for future backend routing)
  endpoints: {
    publications: '/publications',
    events: '/events',
    research: '/research',
    experts: '/experts',
    news: '/news',
    newsletter: {
      subscribe: '/newsletter/subscribe',
      unsubscribe: '/newsletter/unsubscribe',
      status: '/newsletter/status',
    },
    registration: {
      submit: '/registration/apply',
      status: '/registration/status',
      adminList: '/admin/registrations',
      adminExport: '/admin/registrations/export',
    },
    pincode: {
      // Free public India Post PIN code resolution API
      indiaPost: 'https://api.postalpincode.in/pincode',
    },
    donations: {
      create: '/donations/create',
      verify: '/donations/verify',
      receipt: '/donations/receipt',
    },
    submissions: {
      callForPapers: '/submissions/papers',
      status: '/submissions/status',
    },
    files: {
      upload: '/files/upload',
      getDownloadUrl: '/files/download-url',
    },
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      requestOtp: '/auth/otp/request',
      verifyOtp: '/auth/otp/verify',
      session: '/auth/session',
    }
  }
} as const;

export type ApiConfig = typeof apiConfig;
