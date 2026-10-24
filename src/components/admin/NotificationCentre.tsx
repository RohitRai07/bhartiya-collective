import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Users, 
  Mail, 
  Phone, 
  Smartphone, 
  Send, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  History, 
  Download, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  ChevronRight, 
  Briefcase, 
  FileText, 
  UserCheck, 
  MessageSquare, 
  ExternalLink, 
  Layers, 
  ShieldCheck, 
  X, 
  Info,
  Calendar,
  Eye,
  RotateCcw,
  Ban
} from 'lucide-react';
import { 
  AggregatedRecipient, 
  RecipientSourceModule, 
  NotificationChannel, 
  NotificationLog, 
  NotificationRecipient 
} from '../../types/notification';
import { centralizedNotificationService, CentralizedNotificationStats } from '../../services/centralizedNotificationService';
import { notificationService, EmailGatewayConfig } from '../../services/notificationService';
import { SendNotificationModal } from './SendNotificationModal';

interface NotificationCentreProps {
  onNavigateToModule?: (tab: string, subTab?: string) => void;
}

export const NotificationCentre: React.FC<NotificationCentreProps> = ({
  onNavigateToModule,
}) => {
  // Navigation sub-tabs inside Notification Centre
  const [subTab, setSubTab] = useState<'directory' | 'logs' | 'gateway'>('directory');

  // Directory Data & Filtering
  const [recipients, setRecipients] = useState<AggregatedRecipient[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<'all' | RecipientSourceModule>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'has_email' | 'has_phone' | 'has_both'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'notified' | 'unnotified' | 'failed'>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection for bulk messaging
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Modals
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [targetRecipients, setTargetRecipients] = useState<NotificationRecipient[]>([]);
  const [modalDefaultSubject, setModalDefaultSubject] = useState('');
  const [modalDefaultMessage, setModalDefaultMessage] = useState('');
  const [modalDefaultTemplate, setModalDefaultTemplate] = useState('CUSTOM');
  const [modalContextText, setModalContextText] = useState('');
  const [modalSourceModule, setModalSourceModule] = useState<string | undefined>(undefined);

  // Detail / Dossier Modal
  const [inspectingRecipient, setInspectingRecipient] = useState<AggregatedRecipient | null>(null);
  const [recipientLogs, setRecipientLogs] = useState<NotificationLog[]>([]);

  // Email Gateway Config State
  const [gatewayConfig, setGatewayConfig] = useState<EmailGatewayConfig>(notificationService.getEmailGatewayConfig());
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  // Load and synchronize data
  const loadData = () => {
    try {
      const allRecipients = centralizedNotificationService.getAggregatedRecipients();
      setRecipients(allRecipients);
      const allLogs = notificationService.getLogsForRecipient(); // gets all logs
      setLogs(allLogs);
    } catch (e) {
      console.error('Failed to load notification centre data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Event listeners for cross-module two-way synchronization
    const handleNotificationDispatched = () => loadData();
    const handleCareerUpdated = () => loadData();
    const handleContentUpdated = () => loadData();
    const handleInquiriesUpdated = () => loadData();

    window.addEventListener('bharat:notification-dispatched', handleNotificationDispatched);
    window.addEventListener('bharat:career-updated', handleCareerUpdated);
    window.addEventListener('bharat:content-updated', handleContentUpdated);
    window.addEventListener('bharat:inquiries-updated', handleInquiriesUpdated);

    return () => {
      window.removeEventListener('bharat:notification-dispatched', handleNotificationDispatched);
      window.removeEventListener('bharat:career-updated', handleCareerUpdated);
      window.removeEventListener('bharat:content-updated', handleContentUpdated);
      window.removeEventListener('bharat:inquiries-updated', handleInquiriesUpdated);
    };
  }, []);

  // Update inspected recipient logs if inspecting
  useEffect(() => {
    if (inspectingRecipient) {
      const history = notificationService.getLogsForRecipient(
        inspectingRecipient.id,
        inspectingRecipient.email,
        inspectingRecipient.phone
      );
      setRecipientLogs(history);
    }
  }, [inspectingRecipient, logs]);

  // Compute filtered list
  const filteredRecipients = useMemo(() => {
    return centralizedNotificationService.filterRecipients(recipients, {
      sourceModule: sourceFilter,
      channelAvailability: channelFilter,
      notificationStatus: statusFilter,
      dateRange,
      searchQuery,
    });
  }, [recipients, sourceFilter, channelFilter, statusFilter, dateRange, searchQuery]);

  // Compute stats
  const stats: CentralizedNotificationStats = useMemo(() => {
    return centralizedNotificationService.getStatistics(recipients);
  }, [recipients]);

  // Bulk selection handlers
  const handleToggleSelect = (key: string) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedKeys.length === filteredRecipients.length && filteredRecipients.length > 0) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(filteredRecipients.map(r => r.recordKey));
    }
  };

  const handleDeselectAll = () => {
    setSelectedKeys([]);
  };

  // Open notification modal for a single recipient
  const handleOpenNotifySingle = (recipient: AggregatedRecipient) => {
    setTargetRecipients([centralizedNotificationService.toNotificationRecipient(recipient)]);
    setModalDefaultSubject(`Important Communication • Bharat Collective Foundation`);
    setModalDefaultMessage(`Namaste ${recipient.name},\n\nWe are writing from the Bharat Collective Foundation regarding your ${recipient.sourceLabel} (${recipient.referenceCode || ''}).\n\nWarm regards,\nSecretariat • Bharat Collective Foundation`);
    
    // Choose appropriate default template
    if (recipient.sourceModule === 'career') {
      setModalDefaultTemplate('CAREER_UNDER_REVIEW');
    } else if (recipient.sourceModule === 'registration') {
      setModalDefaultTemplate('REGISTRATION_VERIFIED');
    } else if (recipient.sourceModule === 'submission') {
      setModalDefaultTemplate('CFP_UPDATE');
    } else if (recipient.sourceModule === 'newsletter') {
      setModalDefaultTemplate('NEWSLETTER_DIGEST');
    } else {
      setModalDefaultTemplate('CUSTOM');
    }

    setModalContextText(`Direct dispatch to ${recipient.name} [${recipient.sourceLabel}]`);
    setModalSourceModule(recipient.sourceModule);
    setNotifyModalOpen(true);
  };

  // Open notification modal for all selected recipients
  const handleOpenNotifySelected = () => {
    const selected = recipients.filter(r => selectedKeys.includes(r.recordKey));
    if (selected.length === 0) return;

    setTargetRecipients(selected.map(r => centralizedNotificationService.toNotificationRecipient(r)));
    setModalDefaultSubject(`Official Communication • Bharat Collective Foundation`);
    setModalDefaultMessage(`Namaste,\n\nWe are pleased to connect with you from the Bharat Collective Foundation.\n\nWarm regards,\nSecretariat • Bharat Collective Foundation`);
    setModalDefaultTemplate('CUSTOM');
    setModalContextText(`Bulk broadcast to ${selected.length} recipient(s) across selected modules`);
    setModalSourceModule(sourceFilter !== 'all' ? sourceFilter : undefined);
    setNotifyModalOpen(true);
  };

  // Export filtered recipients to CSV
  const handleExportCsv = () => {
    if (filteredRecipients.length === 0) {
      alert('No recipients match the current filter criteria.');
      return;
    }

    const headers = ['Record Key', 'Source Module', 'Reference Code', 'Full Name', 'Email', 'Phone', 'Status', 'Submitted At', 'Notification Count', 'Last Contacted', 'Opted In'];
    const rows = filteredRecipients.map(r => [
      `"${r.recordKey}"`,
      `"${r.sourceLabel}"`,
      `"${r.referenceCode || ''}"`,
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      `"${r.status}"`,
      `"${new Date(r.submittedAt).toLocaleDateString('en-IN')}"`,
      r.notificationCount,
      `"${r.lastContactedAt ? new Date(r.lastContactedAt).toLocaleDateString('en-IN') : 'Never'}"`,
      r.isSubscribed ? 'Yes' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bharat_Collective_Recipients_${sourceFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Test Email Handler
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }

    setTestEmailLoading(true);
    setTestEmailStatus(null);

    try {
      await notificationService.sendNotification({
        recipients: [{
          id: `test-${Date.now()}`,
          name: 'Administrator',
          email: testEmailAddress,
          phone: '',
          category: 'custom',
          sourceModule: 'general'
        }],
        channel: 'email',
        sourceModule: 'general',
        subject: 'Test Dispatch: Bharat Collective Notification Gateway Verification',
        message: `Namaste,\n\nThis is a verified gateway test dispatch generated from the Bharat Collective Notification Centre.\n\nTime: ${new Date().toLocaleString('en-IN')}\nProvider Mode: ${gatewayConfig.provider.toUpperCase()}\nStatus: Verified\n\nWarm regards,\nBharat Collective Secretariat`,
      });

      setTestEmailStatus(`Test notification dispatched for ${testEmailAddress}. Recorded in the Audit Trail!`);
      loadData();
      setTestEmailAddress('');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch test notification.');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const getSourceBadge = (source: RecipientSourceModule) => {
    switch (source) {
      case 'career':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Career</span>;
      case 'newsletter':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">Newsletter</span>;
      case 'registration':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">Registration</span>;
      case 'submission':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">Call for Papers</span>;
      case 'contact':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300">Inquiry</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">General</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-serif font-bold text-white tracking-wide">
                Centralized Notification Centre
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live Synchronized
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Unified communication hub aggregating all people who submitted data across Careers, Newsletter, Scholar Registrations, Call for Papers, and Secretariat Inquiries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedKeys(recipients.map(r => r.recordKey));
                handleOpenNotifySelected();
              }}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast All ({recipients.length})</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Directory</span>
            </button>

            <button
              onClick={loadData}
              title="Refresh and resynchronize records across all modules"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Aggregation Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Contacts</span>
            <span className="text-lg font-bold font-mono text-white">{stats.totalContacts}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Across 5 modules</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reachable Email</span>
            <span className="text-lg font-bold font-mono text-blue-400">{stats.totalWithEmail}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {stats.totalContacts ? `${Math.round((stats.totalWithEmail / stats.totalContacts) * 100)}% coverage` : '0%'}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">SMS / WhatsApp</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{stats.totalWithPhone}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Valid cellular beats</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Both Channels</span>
            <span className="text-lg font-bold font-mono text-purple-400">{stats.totalWithBoth}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Multi-channel reach</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Already Contacted</span>
            <span className="text-lg font-bold font-mono text-amber-400">{stats.notifiedCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{stats.neverNotifiedCount} pending first touch</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Dispatches</span>
            <span className="text-lg font-bold font-mono text-white">{logs.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Logged & synchronized</span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setSubTab('directory')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'directory'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Recipients Directory ({filteredRecipients.length})</span>
          </button>

          <button
            onClick={() => setSubTab('logs')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'logs'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Communications Audit Log ({logs.length})</span>
          </button>

          <button
            onClick={() => setSubTab('gateway')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'gateway'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Gateway & Provider Health</span>
          </button>
        </div>

        {subTab === 'directory' && selectedKeys.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg">
              {selectedKeys.length} Selected
            </span>
            <button
              onClick={handleOpenNotifySelected}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Notify Selected</span>
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: RECIPIENTS DIRECTORY */}
      {/* ============================================================== */}
      {subTab === 'directory' && (
        <div className="space-y-4">
          
          {/* Source Module Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-2.5 rounded-2xl border border-slate-200 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] px-2">Module Source:</span>
            {[
              { id: 'all', label: `All Sources (${stats.totalContacts})` },
              { id: 'career', label: `Careers (${stats.byModule.career})` },
              { id: 'newsletter', label: `Newsletter (${stats.byModule.newsletter})` },
              { id: 'registration', label: `Registrations (${stats.byModule.registration})` },
              { id: 'submission', label: `Call for Papers (${stats.byModule.submission})` },
              { id: 'contact', label: `Contact Inquiries (${stats.byModule.contact})` },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setSourceFilter(m.id as any)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  sourceFilter === m.id
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search & Channel Filters Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, phone, reference code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Channel Availability */}
              <select
                value={channelFilter}
                onChange={e => setChannelFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">All Channels</option>
                <option value="has_email">Has Email Only</option>
                <option value="has_phone">Has Phone Only</option>
                <option value="has_both">Has Both Email & Phone</option>
              </select>

              {/* Notification Status */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">All Notification States</option>
                <option value="notified">Already Contacted</option>
                <option value="unnotified">Never Contacted</option>
                <option value="failed">Failed / Pending</option>
              </select>

              {/* Date Range */}
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>

              <button
                onClick={handleSelectAllFiltered}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                {selectedKeys.length === filteredRecipients.length && filteredRecipients.length > 0 ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    <span>Select All ({filteredRecipients.length})</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Aggregated Recipients Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedKeys.length === filteredRecipients.length && filteredRecipients.length > 0}
                        onChange={handleSelectAllFiltered}
                        className="w-3.5 h-3.5 text-amber-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Recipient & Code</th>
                    <th className="p-3.5">Source Module</th>
                    <th className="p-3.5">Contact Coordinates</th>
                    <th className="p-3.5">Channels</th>
                    <th className="p-3.5">Notification History</th>
                    <th className="p-3.5">Status & Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecipients.map(r => {
                    const isSelected = selectedKeys.includes(r.recordKey);
                    return (
                      <tr key={r.recordKey} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}>
                        
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(r.recordKey)}
                            className="w-3.5 h-3.5 text-amber-600 rounded cursor-pointer"
                          />
                        </td>

                        {/* Name & Subtitle */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>{r.name}</span>
                            {!r.isSubscribed && (
                              <span title="Unsubscribed from marketing digests" className="text-rose-500 shrink-0">
                                <Ban className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          {r.referenceCode && (
                            <span className="font-mono text-[11px] text-amber-800 font-semibold block">
                              {r.referenceCode}
                            </span>
                          )}
                          {r.subtitle && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                              {r.subtitle}
                            </span>
                          )}
                        </td>

                        {/* Source Module */}
                        <td className="p-3.5">
                          {getSourceBadge(r.sourceModule)}
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {r.sourceLabel}
                          </span>
                        </td>

                        {/* Contact Coordinates */}
                        <td className="p-3.5 space-y-0.5">
                          {r.email && (
                            <div className="flex items-center space-x-1.5 text-slate-700">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <a href={`mailto:${r.email}`} className="hover:text-amber-700 truncate max-w-xs">
                                {r.email}
                              </a>
                            </div>
                          )}
                          {r.phone && (
                            <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <a href={`tel:${r.phone}`} className="hover:text-amber-700">
                                {r.phone}
                              </a>
                            </div>
                          )}
                        </td>

                        {/* Channels Available */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-1">
                            <span 
                              title={r.hasEmail ? 'Email Available' : 'No Email on Record'}
                              className={`p-1 rounded ${r.hasEmail ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'}`}
                            >
                              <Mail className="w-3 h-3" />
                            </span>
                            <span 
                              title={r.hasPhone ? 'SMS Available' : 'No Phone on Record'}
                              className={`p-1 rounded ${r.hasPhone ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'}`}
                            >
                              <MessageSquare className="w-3 h-3" />
                            </span>
                            <span 
                              title={r.hasPhone ? 'WhatsApp Available' : 'No Phone on Record'}
                              className={`p-1 rounded ${r.hasPhone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}
                            >
                              <Smartphone className="w-3 h-3" />
                            </span>
                          </div>
                        </td>

                        {/* Notification History */}
                        <td className="p-3.5">
                          {r.notificationCount > 0 ? (
                            <div>
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                <History className="w-3 h-3 text-amber-700" />
                                <span>{r.notificationCount} Sent</span>
                              </span>
                              {r.lastContactedAt && (
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Last: {new Date(r.lastContactedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Never contacted
                            </span>
                          )}
                        </td>

                        {/* Status & Date */}
                        <td className="p-3.5">
                          <span className="capitalize font-semibold text-slate-700 block">
                            {r.status}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(r.submittedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenNotifySingle(r)}
                            className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold transition-colors cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Notify</span>
                          </button>

                          <button
                            onClick={() => setInspectingRecipient(r)}
                            title="View Person Dossier & Full Notification History"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>History</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRecipients.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">No recipients match your filter criteria.</p>
                <p>Try resetting filters or adjusting your search term.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: COMMUNICATIONS AUDIT TRAIL */}
      {/* ============================================================== */}
      {subTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-slate-900 text-sm">
                  Complete Communications Dispatch Audit Log ({logs.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Real-time synchronized audit log tracking all dispatches from the Notification Centre, Career, Registrations, and Newsletters.
                </p>
              </div>

              <button
                onClick={loadData}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Log ID & Sent At</th>
                    <th className="p-3.5">Source & Template</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Recipients</th>
                    <th className="p-3.5">Subject & Content Preview</th>
                    <th className="p-3.5">Delivery Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-amber-900 block">{log.id}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {log.sourceModule || 'Direct'}
                        </span>
                        {log.templateId && (
                          <span className="font-mono text-[10px] text-amber-800 block mt-1">
                            {log.templateId}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center space-x-1 ${
                          log.channel === 'whatsapp' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : log.channel === 'email' 
                            ? 'bg-blue-100 text-blue-800' 
                            : log.channel === 'sms'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          <span>{log.channel}</span>
                        </span>
                      </td>

                      <td className="p-3.5 font-medium text-slate-800">
                        {log.recipientSummary}
                        <span className="block text-[10px] text-slate-400">Total: {log.recipientCount}</span>
                      </td>

                      <td className="p-3.5 max-w-sm">
                        {log.subject && <div className="font-semibold text-slate-900">{log.subject}</div>}
                        <div className="text-[11px] text-slate-500 italic line-clamp-2">{log.messageSnippet}</div>
                      </td>

                      <td className="p-3.5">
                        {log.status === 'delivered' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Delivered</span>
                          </span>
                        ) : log.status === 'failed' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Simulated / Pending Setup</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        {log.status === 'failed' && (
                          <button
                            onClick={async () => {
                              await notificationService.retryFailedNotification(log.id);
                              loadData();
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[11px] font-semibold cursor-pointer inline-flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {logs.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-400">
                No communications logged yet. Dispatches will be recorded here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: GATEWAY & CHANNEL CONFIGURATION */}
      {/* ============================================================== */}
      {subTab === 'gateway' && (
        <div className="space-y-6">
          
          {/* Provider Readiness Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Email Gateway */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Email Channel</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  gatewayConfig.provider === 'simulation'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {gatewayConfig.provider.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Supports real-time Webhook forwarding, SMTP server integration, or client-side Simulation letterhead previews.
              </p>
              <div className="text-[11px] text-slate-600 space-y-1 border-t border-slate-100 pt-2 font-mono">
                <div>Sender: {gatewayConfig.senderEmail}</div>
                <div>Provider: {gatewayConfig.provider}</div>
              </div>
            </div>

            {/* WhatsApp Business API */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Channel</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                  Ready for API Key
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Configured for Meta WhatsApp Business Cloud API. Dispatches pre-approved templates for candidate alerts and updates.
              </p>
              <div className="text-[11px] text-slate-600 space-y-1 border-t border-slate-100 pt-2 font-mono">
                <div>Endpoint: https://graph.facebook.com/v18.0</div>
                <div>Status: Decoupled / Simulated Fallback Active</div>
              </div>
            </div>

            {/* SMS Gateway */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <span>SMS Channel</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                  DLT Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connects to Indian SMS gateways (MSG91 / Textlocal / Twilio) adhering to TRAI DLT registration templates.
              </p>
              <div className="text-[11px] text-slate-600 space-y-1 border-t border-slate-100 pt-2 font-mono">
                <div>Route: Transactional 4</div>
                <div>Country: +91 (India)</div>
              </div>
            </div>

          </div>

          {/* Test Dispatch Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-serif font-bold text-slate-900 text-sm">
              Live Test Dispatch (Gateway Verification)
            </h4>
            <p className="text-xs text-slate-500">
              Send a test communication to your own email to verify gateway readiness without notifying public users.
            </p>

            <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-3 max-w-xl text-xs">
              <input
                type="email"
                required
                placeholder="Enter test destination email (e.g. rohitraicr10@gmail.com)"
                value={testEmailAddress}
                onChange={e => setTestEmailAddress(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={testEmailLoading}
                className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white rounded-xl font-semibold shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testEmailLoading ? 'Dispatching...' : 'Send Gateway Test'}</span>
              </button>
            </form>

            {testEmailStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{testEmailStatus}</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* RECIPIENT DOSSIER & COMPLETE NOTIFICATION HISTORY MODAL */}
      {/* ============================================================== */}
      {inspectingRecipient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-800/80 p-2 rounded-xl text-amber-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold tracking-tight">
                      {inspectingRecipient.name}
                    </h2>
                    {getSourceBadge(inspectingRecipient.sourceModule)}
                  </div>
                  <p className="text-xs text-amber-400 font-mono tracking-wider">
                    {inspectingRecipient.referenceCode || inspectingRecipient.recordKey}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingRecipient(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              
              {/* Profile Coordinates Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email</span>
                  <a href={`mailto:${inspectingRecipient.email}`} className="font-semibold text-amber-900 hover:underline">
                    {inspectingRecipient.email || 'None on record'}
                  </a>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mobile / WhatsApp</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {inspectingRecipient.phone || 'None on record'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Source Record</span>
                  <span className="font-medium text-slate-900">
                    {inspectingRecipient.sourceLabel} ({inspectingRecipient.status})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Submission Timestamp</span>
                  <span className="font-medium text-slate-900">
                    {new Date(inspectingRecipient.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </span>
                </div>
              </div>

              {/* Complete Synchronized Notification History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4 text-amber-700" />
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Synchronized Notification Timeline ({recipientLogs.length})
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      const rec = inspectingRecipient;
                      setInspectingRecipient(null);
                      handleOpenNotifySingle(rec);
                    }}
                    className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send New Communication</span>
                  </button>
                </div>

                {recipientLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <Mail className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">No notifications dispatched to this recipient yet.</p>
                    <p className="text-[11px]">Click "Send New Communication" above to dispatch via Email, SMS, or WhatsApp.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recipientLogs.map(log => (
                      <div key={log.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' :
                              log.channel === 'email' ? 'bg-blue-100 text-blue-800' :
                              log.channel === 'sms' ? 'bg-purple-100 text-purple-800' :
                              'bg-indigo-100 text-indigo-800'
                            }`}>
                              {log.channel}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">{log.subject || 'Administrative Notice'}</span>
                          </div>

                          <span className="text-[10px] text-slate-400">
                            {new Date(log.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </span>
                        </div>

                        <p className="text-slate-700 whitespace-pre-wrap font-sans text-xs leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                          {log.fullMessage || log.messageSnippet}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span>Origin Module: <strong className="capitalize">{log.sourceModule || 'Direct'}</strong></span>
                          <span className={`font-semibold ${
                            log.status === 'delivered' ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {log.status === 'delivered' ? '✓ Delivered via Gateway' : '• Simulated / Gateway Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectingRecipient(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Dispatch Notification Modal */}
      <SendNotificationModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        recipients={targetRecipients}
        defaultSubject={modalDefaultSubject}
        defaultMessage={modalDefaultMessage}
        defaultTemplateId={modalDefaultTemplate}
        contextText={modalContextText}
        sourceModule={modalSourceModule}
        onSuccess={() => {
          loadData();
        }}
      />

    </div>
  );
};
