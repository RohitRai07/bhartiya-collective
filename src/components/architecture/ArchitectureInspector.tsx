import React, { useState, useEffect } from 'react';
import { featureConfig, FeatureFlags } from '../../config/featureConfig';
import { apiConfig } from '../../config/apiConfig';
import { registrationService } from '../../services/registrationService';
import { registrationCsvExporter } from '../../export/registrationCsvExporter';
import { UserRegistrationRecord } from '../../types/registration';
import { 
  Sliders, 
  X, 
  Layers, 
  Download, 
  Database, 
  CreditCard, 
  Check, 
  ExternalLink,
  Shield,
  Activity,
  Server,
  FileSpreadsheet
} from 'lucide-react';

interface ArchitectureInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdmin?: () => void;
}

export const ArchitectureInspector: React.FC<ArchitectureInspectorProps> = ({ 
  isOpen, 
  onClose,
  onNavigateToAdmin 
}) => {
  const [flags, setFlags] = useState<FeatureFlags>(featureConfig.get());
  const [useMock, setUseMock] = useState<boolean>(apiConfig.useMockData);
  const [registrations, setRegistrations] = useState<UserRegistrationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'flags' | 'boundaries' | 'phases' | 'export'>('flags');

  useEffect(() => {
    if (isOpen) {
      setFlags(featureConfig.get());
      registrationService.getRegistrations().then(setRegistrations);
    }
  }, [isOpen]);

  const handleToggleFlag = (key: keyof FeatureFlags) => {
    const updated = featureConfig.update({ [key]: !flags[key] });
    setFlags(updated);
  };

  const handleDownloadCsv = () => {
    registrationCsvExporter.downloadCsv(registrations);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-serif text-lg font-bold">Architecture & Feature Inspector</h2>
              <p className="text-[11px] text-slate-400">Verifying Modular, Loosely-Coupled System Boundaries</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          {[
            { id: 'flags', label: 'Feature Flags' },
            { id: 'phases', label: '6-Phase Roadmap' },
            { id: 'boundaries', label: 'Service Boundaries' },
            { id: 'export', label: 'Admin CSV Export' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-600 text-amber-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: FEATURE FLAGS */}
          {activeTab === 'flags' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
                <strong>Non-Breaking Architecture Guarantee:</strong> Toggling any feature ON or OFF here updates the system in real-time. Notice how disabling payment integration, user registration, or donations never causes existing navigation or public pages to break.
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Feature Flags (src/config/featureConfig.ts)
                </h3>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {(Object.keys(flags) as (keyof FeatureFlags)[]).map(key => (
                    <div key={key} className="flex items-center justify-between p-3.5 hover:bg-slate-50">
                      <div>
                        <span className="font-mono text-xs font-semibold text-slate-800">{key}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {key === 'paymentIntegration' && 'Phase 5: Real payment gateway activation (currently isolated service boundary)'}
                          {key === 'adminPanel' && 'Phase 3: Back-office administration & management'}
                          {key === 'userRegistration' && 'Phase 1: Student and scholar membership intake form'}
                          {key === 'donations' && 'Phase 1: Support Us section & donation intent'}
                          {key === 'newsletter' && 'Phase 1: Research digest email subscription'}
                          {key === 'pincodeAutoFetch' && 'Phase 1: Postal PIN code location resolution'}
                          {key === 'authentication' && 'Phase 4: OTP and user login framework'}
                          {key === 'callForPapers' && 'Phase 1: Academic submission intake'}
                          {key === 'events' && 'Phase 1: Symposia and public lectures catalog'}
                          {key === 'research' && 'Phase 1: Research domains and projects'}
                          {key === 'publications' && 'Phase 1: Monographs & paper downloads'}
                          {key === 'architectureInspector' && 'Developer audit modal & diagnostics'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleFlag(key)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                          flags[key] ? 'bg-amber-600 justify-end' : 'bg-slate-200 justify-start'
                        }`}
                      >
                        <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Source Configuration */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>Data Layer Source (apiConfig.useMockData)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Currently running in: <span className="font-mono font-semibold text-amber-800">
                    {useMock ? 'Mock / Local Storage Layer (Phase 1)' : 'Live API Client (Phase 2)'}
                  </span>.
                  The public frontend consumes domain services without knowing whether mock data or the live REST API is responding.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: 6-PHASE ROADMAP */}
          {activeTab === 'phases' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                The Core Bhartiya Collective architecture is structured in 6 non-breaking phases. Each phase expands capabilities without rewriting earlier UI or data models:
              </p>

              <div className="space-y-3">
                {[
                  { phase: 'Phase 1', title: 'Public Website + Mock/Local Data', status: 'ACTIVE & DELIVERED', desc: 'Public website, domain services, isolated pincodeService, newsletterService, mock repository, registration form.' },
                  { phase: 'Phase 2', title: 'API Services + Backend + Database', status: 'READY (apiClient wired)', desc: 'Backend REST API connected via common apiClient without rewriting any UI components.' },
                  { phase: 'Phase 3', title: 'Admin Panel + CRUD Architecture', status: 'PREVIEW READY', desc: 'Separate admin workspace sharing types and CSV exporter for registration management.' },
                  { phase: 'Phase 4', title: 'Authentication + OTP + User Accounts', status: 'BOUNDARY DEFINED', desc: 'authService integration boundary defined; no fake auth logic implemented prematurely.' },
                  { phase: 'Phase 5', title: 'Donations + Payment Integration', status: 'FUTURE READY', desc: 'createDonation() service boundary ready for Razorpay/UPI/Stripe without UI modification.' },
                  { phase: 'Phase 6', title: 'Advanced CMS, Search & Notifications', status: 'PLANNED', desc: 'Decoupled fileService and indexing engines added incrementally.' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono text-amber-800">{item.phase}: {item.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SERVICE BOUNDARIES */}
          {activeTab === 'boundaries' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                To prevent giant shared dependencies (Rule 9: Avoid appService.js), every domain capability lives in an isolated service:
              </p>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Service File</th>
                      <th className="p-2.5">Domain Responsibility</th>
                      <th className="p-2.5">Backend Bridge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-mono text-amber-800">apiClient.ts</td>
                      <td className="p-2.5">Base HTTP client, headers, timeout, envelope</td>
                      <td className="p-2.5 text-slate-500">Universal Foundation</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-amber-800">registrationService.ts</td>
                      <td className="p-2.5">User registrations & phone normalization</td>
                      <td className="p-2.5 text-slate-500">/registration/apply</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-amber-800">pincodeService.ts</td>
                      <td className="p-2.5">Postal PIN code auto-fetch & validation</td>
                      <td className="p-2.5 text-slate-500">India Post REST API</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-amber-800">newsletterService.ts</td>
                      <td className="p-2.5">Email validation & subscription lifecycle</td>
                      <td className="p-2.5 text-slate-500">/newsletter/subscribe</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-amber-800">donationService.ts</td>
                      <td className="p-2.5">Donation intent & payment gateway bridge</td>
                      <td className="p-2.5 text-slate-500">/donations/create</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-amber-800">publicationService.ts</td>
                      <td className="p-2.5">Monographs, policy briefs, search & filter</td>
                      <td className="p-2.5 text-slate-500">/publications</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-amber-800">eventService.ts</td>
                      <td className="p-2.5">Symposia, roundtables, speaker schedules</td>
                      <td className="p-2.5 text-slate-500">/events</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-amber-800">fileService.ts</td>
                      <td className="p-2.5">File upload & cloud object storage</td>
                      <td className="p-2.5 text-slate-500">/files/upload</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-amber-800">authService.ts</td>
                      <td className="p-2.5">Session, OTP request & verification stubs</td>
                      <td className="p-2.5 text-slate-500">/auth/otp/verify</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN CSV EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Section 17: Isolated CSV Export Engine</span>
                </div>
                <p className="text-xs text-slate-600">
                  The CSV generator (<code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">src/export/registrationCsvExporter.ts</code>) has an explicit 10-column mapping as mandated:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                  {registrationCsvExporter.columns.map((col, idx) => (
                    <div key={idx} className="flex items-center space-x-1">
                      <span className="text-slate-400">{idx + 1}.</span>
                      <span>{col.header}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Export Active Registrations</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {registrations.length} record(s) currently in in-memory repository.
                  </p>
                </div>

                <button
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              {onNavigateToAdmin && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToAdmin();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-1.5"
                  >
                    <span>Open Admin Panel Preview</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
