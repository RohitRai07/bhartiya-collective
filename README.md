# Core Bhartiya Collective

> **Future-Proof and Non-Breaking Architecture Implementation**  
> Civilizational Wisdom • Rigorous Inquiry • Future-Focused Policy

This application is built in strict adherence to the **25 Architecture Principles** for modular, loosely coupled, non-breaking design. The current implementation delivers the **public-facing Core Bhartiya Collective website (Phase 1)** while establishing clean service boundaries and types for future backend, database, payment gateway, authentication, and admin panel integrations.

---

## 🏛️ Architecture Overview

```
                                  PUBLIC WEBSITE
                 (Home, About, Research, Publications, Events, News)
                                        │
                ┌───────────────────────┴───────────────────────┐
                ▼                                               ▼
       Interactive Modules                             Isolated Modules
  (Newsletter, Registration, CFP)                    (Support Us / Donation)
                │                                               │
                ▼                                               ▼
        newsletterService                              donationService
        registrationService                       (Clean Service Boundary)
          pincodeService                                        │
                │                                               ▼
                └───────────────────────┬───────────────────────┘
                                        ▼
                             Common API Client Layer
                             (apiClient Foundation)
                                        │
                       ┌────────────────┴────────────────┐
                       ▼                                 ▼
               [Phase 1 Active]                  [Future Phases]
              Local Mock Data &                 Backend REST API
             In-Memory Repository                      │
                                                       ▼
                                              Database / Gateways
```

---

## 📂 Project Structure

```text
bhartiya-collective/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── config/                      # Section 6: Configuration-Driven
│   │   ├── siteConfig.ts            # Brand, contact, and legal metadata
│   │   ├── navigationConfig.ts      # Dynamic menu items filtered by feature flags
│   │   ├── themeConfig.ts           # Visual palette tokens (Kesar, Indigo, Terracotta)
│   │   ├── apiConfig.ts             # Base URL, timeout, endpoints, mock-mode toggle
│   │   └── featureConfig.ts         # Feature flags with reactive change dispatch
│   ├── types/                       # Section 4 & 5: Feature Isolation Data Models
│   │   ├── api.ts                   # ApiResponse<T>, ApiError, RequestOptions
│   │   ├── registration.ts          # Strictly validated registration model (+91 10 digits)
│   │   ├── newsletter.ts            # Subscription status & lifecycle states
│   │   ├── donation.ts              # Clean donation intent & cause types
│   │   ├── publication.ts           # Monographs & policy paper metadata
│   │   ├── event.ts                 # Symposia, schedules, and speakers
│   │   ├── research.ts              # Research domains & active projects
│   │   ├── expert.ts                # Scholar fellows & advisory council
│   │   ├── news.ts                  # Perspectives & press releases
│   │   ├── submission.ts            # Call for Papers abstract model
│   │   ├── file.ts                  # File metadata & storage independence
│   │   └── auth.ts                  # Phase 4 auth integration stubs
│   ├── services/                    # Section 3 & 9: Dedicated Service Boundaries
│   │   ├── apiClient.ts             # Section 10: Common HTTP client foundation
│   │   ├── publicationService.ts    # Monographs catalog
│   │   ├── eventService.ts          # Conferences and webinars
│   │   ├── researchService.ts       # Research domains
│   │   ├── expertService.ts         # Fellow bios & advisory council
│   │   ├── newsService.ts           # Communiques and perspectives
│   │   ├── newsletterService.ts     # Section 11: Email validation, duplicate check, unsubscribe
│   │   ├── registrationService.ts   # Section 12-13: Registration intake & Admin CRUD
│   │   ├── pincodeService.ts        # Section 14: Isolated PIN code auto-fetch
│   │   ├── donationService.ts       # Section 2 & 20: Clean payment gateway boundary
│   │   ├── submissionService.ts     # Call for Papers submissions
│   │   ├── fileService.ts           # Section 18: Storage-independent file management
│   │   └── authService.ts           # Section 21: Non-premature auth boundary
│   ├── export/                      # Section 17: Dedicated Export Utilities
│   │   └── registrationCsvExporter.ts # 10-column mapped RFC 4180 CSV engine
│   ├── data/                        # Phase 1 In-Memory & Mock Content
│   │   ├── mockPublications.ts
│   │   ├── mockEvents.ts
│   │   ├── mockResearch.ts
│   │   ├── mockExperts.ts
│   │   └── mockNews.ts
│   ├── components/
│   │   ├── common/                  # Navbar, Footer
│   │   ├── newsletter/              # NewsletterForm (all 5 states)
│   │   ├── registration/            # RegistrationForm (pincode auto-fetch)
│   │   ├── donation/                # DonationSection (zero fake checkout)
│   │   ├── publications/            # PublicationList
│   │   ├── events/                  # EventList
│   │   ├── research/                # ResearchList
│   │   ├── news/                    # NewsList
│   │   └── architecture/            # ArchitectureInspector (live feature toggle drawer)
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ResearchPage.tsx
│   │   ├── PublicationsPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── NewsPage.tsx
│   │   ├── RegistrationPage.tsx
│   │   ├── SupportUsPage.tsx
│   │   ├── ContactPage.tsx
│   │   └── AdminPreviewPage.tsx     # Section 15 & 16: Decoupled Admin CRUD preview
│   └── tests/
│       └── architecture.test.ts     # Automated verification suite (31 tests)
```

---

## 🎯 Verification of Core Architecture Principles

| Requirement | Implementation Detail | Status |
| :--- | :--- | :---: |
| **1. Current vs Future** | Works 100% independently on local data (Phase 1); `apiConfig.useMockData` seamlessly switches to backend API without changing any UI. | ✅ |
| **2. Payment Readiness** | `createDonation(donationData)` in `donationService.ts`. **NO fake payment processing or fake gateway transactions**. Clean intent status returned. | ✅ |
| **3. Service Boundaries** | 12 dedicated domain services in `/services` replacing monolithic dependencies. | ✅ |
| **4. UI/Backend Decoupling** | UI components contain zero database logic, API URLs, or vendor tokens. | ✅ |
| **5. Feature Isolation** | Domain types, services, and UI isolated per feature folder. | ✅ |
| **6. Configuration-Driven** | `siteConfig`, `navigationConfig`, `themeConfig`, `apiConfig`, `featureConfig`. | ✅ |
| **7. Non-Breaking Flags** | Toggling any feature flag (e.g. `paymentIntegration=false`, `adminPanel=false`) does not affect any public page. | ✅ |
| **10. Reusable API Client** | `apiClient.ts` handles baseUrl, timeout (AbortController), auth token, and error envelopes. | ✅ |
| **11. Newsletter** | Email regex validation, loading spinner, success state, duplicate warning, and unsubscribe readiness. | ✅ |
| **12-13. Registration Model** | Full data model with `+91` 10-digit mobile validation, required consent, and auto-generated registration ID. | ✅ |
| **14. Pincode Auto-Fetch** | `pincodeService.getLocationByPincode()` calls India Post directory with fallback and multiple post-office support. | ✅ |
| **15-16. Admin Readiness** | `AdminPreviewPage.tsx` accesses registrations via service CRUD without leaking into public pages. | ✅ |
| **17. CSV Exporter** | Strict 10-column mapped RFC 4180 CSV export in `registrationCsvExporter.ts`. | ✅ |
| **18. File Management** | Storage-agnostic `fileService.ts` for future Cloud Object Storage (S3/GCS). | ✅ |
| **21. Non-Premature Logic** | No fake payments, no fake admin auth, no mock DB engines. | ✅ |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Execution
```bash
# Navigate to project directory
cd "C:\Users\Gabbar\.gemini\antigravity\scratch\bhartiya-collective"

# Run automated architecture verification test suite (31 tests)
npm test

# Run development server
npm run dev

# Run production build
npm run build
```
