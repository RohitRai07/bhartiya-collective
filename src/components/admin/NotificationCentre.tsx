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
  NotificationRecipient,
  PublishedContentItem,
  PublishedContentType
} from '../../types/notification';
import { centralizedNotificationService, CentralizedNotificationStats } from '../../services/centralizedNotificationService';
import { 
  notificationService, 
  EmailGatewayConfig,
  WhatsAppGatewayConfig,
  SmsGatewayConfig
} from '../../services/notificationService';
import { backendNotificationService } from '../../services/backendNotificationService';
import { ContactDetailsSection } from './ContactDetailsSection';
import { SendNotificationModal } from './SendNotificationModal';

const COMPOSE_TEMPLATES = [
  { id: 'CUSTOM', label: 'Custom Message (Compose Manually)' },
  { id: 'ADMIN_NOTIFICATION', label: 'Official Secretariat Notice' },
  { id: 'CAREER_UNDER_REVIEW', label: 'Career: Application Under Review' },
  { id: 'CAREER_SHORTLISTED', label: 'Career: Application Shortlisted' },
  { id: 'REGISTRATION_VERIFIED', label: 'Fellowship: Registration Verified' },
  { id: 'CFP_UPDATE', label: 'Call for Papers: Abstract Review Update' },
  { id: 'NEWSLETTER_DIGEST', label: 'Newsletter: Monograph & Digest Announcement' },
];

interface NotificationCentreProps {
  onNavigateToModule?: (tab: string, subTab?: string) => void;
}

export const NotificationCentre: React.FC<NotificationCentreProps> = ({
  onNavigateToModule,
}) => {
  // Navigation sub-tabs inside Notification Centre
  const [subTab, setSubTab] = useState<'directory' | 'published' | 'compose' | 'logs' | 'gateway'>('directory');

  // Direct Compose & Contact Details State
  const [composeTemplate, setComposeTemplate] = useState('CUSTOM');
  const [composeSubject, setComposeSubject] = useState('Official Communication • Bharat Collective Foundation');
  const [composeMessage, setComposeMessage] = useState('Namaste,\n\nWe are pleased to connect with you from the Bharat Collective Foundation.\n\nWarm regards,\nSecretariat • Bharat Collective Foundation');
  const [composeValidatedData, setComposeValidatedData] = useState<{
    emails: any;
    phones: any;
    allValid: boolean;
    recipients: NotificationRecipient[];
    channels: { email: boolean; sms: boolean; whatsapp: boolean };
  } | null>(null);
  const [composeDispatching, setComposeDispatching] = useState(false);
  const [composeFeedback, setComposeFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Published Content State & Filters
  const [publishedItems, setPublishedItems] = useState<PublishedContentItem[]>([]);
  const [publishedSearchQuery, setPublishedSearchQuery] = useState('');
  const [publishedTypeFilter, setPublishedTypeFilter] = useState<'all' | string>('all');
  const [publishedBroadcastFilter, setPublishedBroadcastFilter] = useState<'all' | 'broadcasted' | 'unbroadcasted'>('all');
  const [selectedPublishedContentId, setSelectedPublishedContentId] = useState<string>('');

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

  // Gateway Config States (Email, WhatsApp, SMS)
  const [gatewayConfig, setGatewayConfig] = useState<EmailGatewayConfig>(notificationService.getEmailGatewayConfig());
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppGatewayConfig>(notificationService.getWhatsAppGatewayConfig());
  const [smsConfig, setSmsConfig] = useState<SmsGatewayConfig>(notificationService.getSmsGatewayConfig());
  const [gatewaySavedToast, setGatewaySavedToast] = useState<string | null>(null);

  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  // Load and synchronize data
  const loadData = async () => {
    try {
      const allRecipients = centralizedNotificationService.getAggregatedRecipients();
      setRecipients(allRecipients);
      const allLogs = notificationService.getLogsForRecipient(); // gets all logs
      setLogs(allLogs);

      const pubItems = await centralizedNotificationService.getPublishedContent();
      setPublishedItems(pubItems);
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

  // Compute filtered published content
  const filteredPublishedItems = useMemo(() => {
    return publishedItems.filter(item => {
      // Type filter
      if (publishedTypeFilter !== 'all' && item.contentType !== publishedTypeFilter) {
        return false;
      }
      // Broadcast status filter
      if (publishedBroadcastFilter === 'broadcasted' && item.notificationCount === 0) {
        return false;
      }
      if (publishedBroadcastFilter === 'unbroadcasted' && item.notificationCount > 0) {
        return false;
      }
      // Search query
      if (publishedSearchQuery.trim()) {
        const q = publishedSearchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchType = item.contentTypeLabel.toLowerCase().includes(q);
        const matchAuthor = (item.authorOrSpeaker || '').toLowerCase().includes(q);
        const matchSummary = (item.summary || '').toLowerCase().includes(q);
        if (!matchTitle && !matchType && !matchAuthor && !matchSummary) {
          return false;
        }
      }
      return true;
    });
  }, [publishedItems, publishedTypeFilter, publishedBroadcastFilter, publishedSearchQuery]);

  // Available published content types with counts
  const availablePublishedTypes = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const item of publishedItems) {
      const existing = map.get(item.contentType);
      if (existing) {
        existing.count++;
      } else {
        map.set(item.contentType, { label: item.contentTypeLabel, count: 1 });
      }
    }
    return Array.from(map.entries()).map(([type, data]) => ({
      type,
      label: data.label,
      count: data.count,
    }));
  }, [publishedItems]);

  // Open notification modal for a published content item
  const handleOpenBroadcastPublished = (item: PublishedContentItem) => {
    // Target subscribers or all directory recipients
    const subscribers = recipients.filter(r => r.isSubscribed || r.sourceModule === 'newsletter');
    const targetAudience = subscribers.length > 0 ? subscribers : recipients;
    
    setTargetRecipients(targetAudience.map(r => centralizedNotificationService.toNotificationRecipient(r)));
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const fullPublicUrl = item.publicUrl.startsWith('http') ? item.publicUrl : `${baseUrl}${item.publicUrl}`;

    setModalDefaultSubject(`New Publication: ${item.title} • Bharat Collective`);
    setModalDefaultMessage(
      `Namaste,\n\nWe are pleased to announce the official release of "${item.title}" (${item.contentTypeLabel}).\n\n` +
      (item.authorOrSpeaker ? `Author / Speaker: ${item.authorOrSpeaker}\n` : '') +
      (item.summary ? `${item.summary}\n\n` : '\n') +
      `Access and explore the full content here:\n${fullPublicUrl}\n\n` +
      `Warm regards,\nSecretariat • Bharat Collective Foundation`
    );
    setModalDefaultTemplate('NEWSLETTER_DIGEST');
    setModalContextText(`Broadcast Announcement for Published Item: "${item.title}" (${item.contentTypeLabel})`);
    setModalSourceModule(item.contentType);
    setNotifyModalOpen(true);
  };

  // Populate Compose form when a published content item is selected
  const handleSelectPublishedForCompose = (contentId: string) => {
    setSelectedPublishedContentId(contentId);
    if (!contentId) return;

    const item = publishedItems.find(p => p.id === contentId);
    if (!item) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const fullPublicUrl = item.publicUrl.startsWith('http') ? item.publicUrl : `${baseUrl}${item.publicUrl}`;

    setComposeSubject(`New Release: ${item.title} • Bharat Collective`);
    setComposeMessage(
      `Namaste,\n\nWe are pleased to announce the official release of "${item.title}" (${item.contentTypeLabel}).\n\n` +
      (item.authorOrSpeaker ? `Author / Speaker: ${item.authorOrSpeaker}\n` : '') +
      (item.summary ? `${item.summary}\n\n` : '\n') +
      `Access and explore the full content here:\n${fullPublicUrl}\n\n` +
      `Warm regards,\nSecretariat • Bharat Collective Foundation`
    );
    setComposeTemplate('NEWSLETTER_DIGEST');
  };

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

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = notificationService.updateEmailGatewayConfig(gatewayConfig);
    setGatewayConfig(updated);
    setGatewaySavedToast('Email Delivery Gateway configuration saved successfully.');
    setTimeout(() => setGatewaySavedToast(null), 3000);
  };

  const handleSaveWhatsAppConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = notificationService.updateWhatsAppGatewayConfig(whatsAppConfig);
    setWhatsAppConfig(updated);
    setGatewaySavedToast('WhatsApp Business Cloud API credentials saved successfully.');
    setTimeout(() => setGatewaySavedToast(null), 3000);
  };

  const handleSaveSmsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = notificationService.updateSmsGatewayConfig(smsConfig);
    setSmsConfig(updated);
    setGatewaySavedToast('SMS Gateway (DLT) credentials saved successfully.');
    setTimeout(() => setGatewaySavedToast(null), 3000);
  };

  const handleComposeTemplateChange = (templateId: string) => {
    setComposeTemplate(templateId);
    switch (templateId) {
      case 'ADMIN_NOTIFICATION':
        setComposeSubject('Official Secretariat Notice • Bharat Collective Foundation');
        setComposeMessage('Namaste,\n\nThis is an official administrative notice from the Bharat Collective Foundation Secretariat regarding our ongoing academic initiatives.\n\nWarm regards,\nSecretariat • Bharat Collective Foundation');
        break;
      case 'CAREER_UNDER_REVIEW':
        setComposeSubject('Update on Your Application • Bharat Collective Foundation');
        setComposeMessage('Namaste,\n\nYour application is currently under active review by our academic panel. We will communicate the next steps shortly.\n\nWarm regards,\nCareers Committee • Bharat Collective Foundation');
        break;
      case 'CAREER_SHORTLISTED':
        setComposeSubject('Congratulations! Application Shortlisted • Bharat Collective');
        setComposeMessage('Namaste,\n\nWe are pleased to inform you that your application has been shortlisted by the Review Committee. Our secretariat will connect with you soon regarding the schedule for your panel discussion.\n\nWarm regards,\nCareers Secretariat');
        break;
      case 'REGISTRATION_VERIFIED':
        setComposeSubject('Fellowship Registration Status Verified • Bharat Collective');
        setComposeMessage('Namaste,\n\nYour National Youth Scholar & Fellow registration has been verified by the Secretariat. You now have full access to our closed-door symposiums and policy monographs.\n\nWarm regards,\nAcademic Review Council');
        break;
      case 'CFP_UPDATE':
        setComposeSubject('Scholarly Abstract Review Decision • Bharat Collective Call for Papers');
        setComposeMessage('Namaste,\n\nWe are writing to provide an update on your manuscript abstract. The Editorial Committee has completed its initial peer review and invites you to submit the full draft.\n\nWarm regards,\nEditorial Secretariat');
        break;
      case 'NEWSLETTER_DIGEST':
        setComposeSubject('New Research Monograph Published • Bharat Collective Foundation');
        setComposeMessage('Namaste,\n\nWe are pleased to announce the release of our latest peer-reviewed policy monograph. You can now access the full digital edition on our portal.\n\nWarm regards,\nBharat Collective Secretariat');
        break;
      default:
        // Keep current or custom
        break;
    }
  };

  const handleComposeDispatch = async (data?: {
    recipients: NotificationRecipient[];
    channels: { email: boolean; sms: boolean; whatsapp: boolean };
    channel: NotificationChannel;
  }) => {
    const targetList = data?.recipients || composeValidatedData?.recipients || [];
    const targetChannels = data?.channels || composeValidatedData?.channels || { email: true, sms: false, whatsapp: true };

    if (targetList.length === 0) {
      alert('No valid contacts to dispatch.');
      return;
    }

    if (!composeSubject.trim() || !composeMessage.trim()) {
      alert('Please provide both a subject and message content before dispatching.');
      return;
    }

    if (!window.confirm(`Are you sure you want to dispatch this notification to ${targetList.length} contact(s)? All events will be recorded in the audit trail and synced across original modules.`)) {
      return;
    }

    setComposeDispatching(true);
    setComposeFeedback(null);

    try {
      // Map entered contacts against existing directory records for cross-module sync
      const enrichedRecipients: NotificationRecipient[] = targetList.map((contact, idx) => {
        // Find existing match by email or phone
        const existing = recipients.find(r => 
          (contact.email && r.email && r.email.toLowerCase() === contact.email.toLowerCase()) ||
          (contact.phone && r.phone && r.phone.replace(/\D/g, '') === contact.phone.replace(/\D/g, ''))
        );

        return {
          ...contact,
          id: existing ? existing.id : contact.id || `direct-${Date.now()}-${idx}`,
          name: existing ? existing.name : contact.name,
          sourceModule: existing ? existing.sourceModule : 'general',
          referenceCode: existing ? existing.referenceCode : undefined,
          isSubscribed: existing ? existing.isSubscribed : true,
          category: existing ? existing.sourceModule : 'custom',
        };
      });

      // Dispatch via backendNotificationService broadcast
      const result: any = await backendNotificationService.broadcast(
        enrichedRecipients,
        composeTemplate === 'CUSTOM' ? 'ADMIN_NOTIFICATION' : composeTemplate,
        {
          title: composeSubject,
          subject: composeSubject,
          message: composeMessage,
          body: composeMessage,
          sourceModule: 'notification-centre',
        },
        targetChannels
      );

      const statusNote = result?.status === 'delivered' 
        ? 'Delivered through live gateway'
        : 'Logged to audit trail (Simulation / Provider Pending Setup)';

      setComposeFeedback({
        type: 'success',
        text: `Successfully dispatched notification to ${enrichedRecipients.length} contact(s). [${statusNote}]. Cross-module audit logs updated.`,
      });

      loadData();
      window.dispatchEvent(new CustomEvent('bharat:notification-dispatched'));
    } catch (err: any) {
      console.error(err);
      setComposeFeedback({
        type: 'error',
        text: err.message || 'Failed to dispatch notification to entered contacts.',
      });
    } finally {
      setComposeDispatching(false);
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
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setSubTab('directory')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              subTab === 'directory'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Recipients Directory ({filteredRecipients.length})</span>
          </button>

          <button
            onClick={() => setSubTab('published')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              subTab === 'published'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Published Content ({publishedItems.length})</span>
          </button>

          <button
            onClick={() => setSubTab('compose')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              subTab === 'compose'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Contact Details & Direct Dispatch</span>
          </button>

          <button
            onClick={() => setSubTab('logs')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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
          <div className="flex flex-wrap items-center gap-2 text-xs pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
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
              <table className="w-full min-w-[850px] text-left text-xs">
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
      {/* SUB-TAB: PUBLISHED CONTENT & CENTRAL BROADCAST */}
      {/* ============================================================== */}
      {subTab === 'published' && (
        <div className="space-y-4">
          
          {/* Header & Description Banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-slate-900 text-base flex items-center space-x-2">
                <Layers className="w-5 h-5 text-amber-700" />
                <span>Published Website Content & Notification Hub</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                All live content across Symposia & Events, Publications, Circulars, Research Domains, News, Podcasts, Magazines, and Centres. Send multi-channel broadcasts to subscribers and members centrally without re-publishing.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl">
                {publishedItems.length} Live Items Available
              </span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={publishedSearchQuery}
                  onChange={e => setPublishedSearchQuery(e.target.value)}
                  placeholder="Search published content by title, speaker, lead, summary..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                {publishedSearchQuery && (
                  <button
                    onClick={() => setPublishedSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Broadcast Status Filter */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs shrink-0">
                <button
                  onClick={() => setPublishedBroadcastFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    publishedBroadcastFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({publishedItems.length})
                </button>
                <button
                  onClick={() => setPublishedBroadcastFilter('unbroadcasted')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    publishedBroadcastFilter === 'unbroadcasted'
                      ? 'bg-white text-amber-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Never Broadcast ({publishedItems.filter(p => p.notificationCount === 0).length})
                </button>
                <button
                  onClick={() => setPublishedBroadcastFilter('broadcasted')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    publishedBroadcastFilter === 'broadcasted'
                      ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Broadcasted ({publishedItems.filter(p => p.notificationCount > 0).length})
                </button>
              </div>
            </div>

            {/* Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase px-1">Content Type:</span>
              <button
                onClick={() => setPublishedTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  publishedTypeFilter === 'all'
                    ? 'bg-amber-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Modules ({publishedItems.length})
              </button>
              {availablePublishedTypes.map(t => (
                <button
                  key={t.type}
                  onClick={() => setPublishedTypeFilter(t.type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    publishedTypeFilter === t.type
                      ? 'bg-amber-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>
          </div>

          {/* List of Published Content Items */}
          <div className="space-y-3">
            {filteredPublishedItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
                <p className="font-semibold text-sm text-slate-700">No published content matching filters</p>
                <p className="text-xs text-slate-400">
                  {publishedSearchQuery ? 'Try clearing your search query or choosing another type.' : 'No eligible published items found across website modules.'}
                </p>
              </div>
            ) : (
              filteredPublishedItems.map(item => (
                <div
                  key={`${item.contentType}-${item.id}`}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                        {item.contentTypeLabel}
                      </span>
                      {item.publicationDate && (
                        <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{item.publicationDate}</span>
                        </span>
                      )}
                      {item.notificationCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Broadcasted {item.notificationCount}x</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Never Broadcast</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-serif font-bold text-slate-900 hover:text-amber-800 transition-colors">
                      {item.title}
                    </h4>

                    {item.authorOrSpeaker && (
                      <p className="text-xs text-slate-600 font-medium">
                        By / Featuring: <span className="text-slate-800">{item.authorOrSpeaker}</span>
                      </p>
                    )}

                    {item.summary && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <a
                        href={item.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-amber-700 hover:text-amber-800 font-semibold hover:underline"
                      >
                        <span>View Public Page ({item.publicUrl})</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {item.lastNotifiedAt && (
                        <span className="text-slate-400 text-[11px]">
                          • Last broadcast: {new Date(item.lastNotifiedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Broadcast Action Button */}
                  <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => handleOpenBroadcastPublished(item)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-xl text-xs shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Broadcast Update</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB: CONTACT DETAILS & DIRECT DISPATCH */}
      {/* ============================================================== */}
      {subTab === 'compose' && (
        <div className="space-y-6">
          
          {/* Feedback Banner */}
          {composeFeedback && (
            <div className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
              composeFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="flex items-center space-x-2">
                {composeFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span className="font-semibold">{composeFeedback.text}</span>
              </div>
              <button
                onClick={() => setComposeFeedback(null)}
                className="p-1 hover:opacity-75 text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section 1: Message Template & Content */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>1. Select Template & Message Content</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose an institutional template or compose a custom communication.
                </p>
              </div>

              {/* Template Selector Dropdown */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-semibold hidden sm:inline">Template:</span>
                <select
                  value={composeTemplate}
                  onChange={e => handleComposeTemplateChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs cursor-pointer"
                >
                  {COMPOSE_TEMPLATES.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{tpl.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Published Content Auto-filler */}
            {publishedItems.length > 0 && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 space-y-1.5">
                <label className="block text-[11px] font-bold text-amber-950 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-700" />
                  <span>Connect Published Content to this Notification (Optional):</span>
                </label>
                <select
                  value={selectedPublishedContentId}
                  onChange={e => handleSelectPublishedForCompose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">-- Compose Manually or Select Published Content --</option>
                  {publishedItems.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.contentTypeLabel}] {p.title} {p.publicationDate ? `(${p.publicationDate})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-amber-800">
                  Selecting a published item automatically fills the heading, summary, and public URL link into the notification.
                </p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Subject / Heading:
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Enter communication subject..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">
                    Message Body:
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {composeMessage.length} chars • {composeMessage.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={composeMessage}
                  onChange={e => setComposeMessage(e.target.value)}
                  placeholder="Enter message body..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-y"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Details Section (Separate Email & Phone) */}
          <ContactDetailsSection
            onValidatedContactsChange={summary => setComposeValidatedData(summary)}
            onDispatch={handleComposeDispatch}
            isDispatching={composeDispatching}
          />

          {/* Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 space-y-0.5 text-center sm:text-left">
              <div className="font-bold text-slate-800">
                {composeValidatedData?.allValid ? (
                  <span className="text-emerald-700 inline-flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ready to dispatch to {composeValidatedData.recipients.length} validated contact(s)</span>
                  </span>
                ) : (
                  <span className="text-amber-700 inline-flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Sending disabled until all entered contacts pass strict validation</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Automatic +91 applied to phone numbers without country code. All events logged and synced across modules.
              </p>
            </div>

            <button
              type="button"
              disabled={!composeValidatedData?.allValid || composeDispatching || !composeSubject.trim() || !composeMessage.trim()}
              onClick={() => handleComposeDispatch()}
              className="w-full sm:w-auto px-6 py-3 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {composeDispatching 
                  ? 'Dispatching Communications...' 
                  : `Dispatch Notification (${composeValidatedData?.recipients.length || 0} Contacts)`}
              </span>
            </button>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: COMMUNICATIONS AUDIT TRAIL */}
      {/* ============================================================== */}
      {subTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer shrink-0 w-full sm:w-auto"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-xs">
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
          
          {/* Notification / Toast for Config Saved */}
          {gatewaySavedToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{gatewaySavedToast}</span>
              </div>
              <button
                onClick={() => setGatewaySavedToast(null)}
                className="p-1 hover:opacity-75 text-emerald-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Interactive Provider Configuration & Ready-to-Paste API Key Forms */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* 1. EMAIL DELIVERY GATEWAY */}
            <form onSubmit={handleSaveEmailConfig} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Email Gateway</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    gatewayConfig.provider === 'webhook' && gatewayConfig.webhookUrl
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {gatewayConfig.provider === 'webhook' && gatewayConfig.webhookUrl ? 'Live Configured' : gatewayConfig.provider.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Configure SMTP Webhook API or local letterhead simulations.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Mode:</label>
                    <select
                      value={gatewayConfig.provider}
                      onChange={e => setGatewayConfig({ ...gatewayConfig, provider: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-xs text-slate-800"
                    >
                      <option value="simulation">Simulation Mode (Safe Letterhead Preview)</option>
                      <option value="webhook">Live Webhook (Zapier / Make / Resend / Formspree)</option>
                      <option value="mailto">Native Mail Client Bridge (mailto:)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sender Name:</label>
                    <input
                      type="text"
                      value={gatewayConfig.senderName}
                      onChange={e => setGatewayConfig({ ...gatewayConfig, senderName: e.target.value })}
                      placeholder="e.g. Bharat Collective Secretariat"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sender Email:</label>
                    <input
                      type="email"
                      value={gatewayConfig.senderEmail}
                      onChange={e => setGatewayConfig({ ...gatewayConfig, senderEmail: e.target.value })}
                      placeholder="e.g. secretariat@bharatcollective.org"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Webhook POST URL (Paste API Endpoint):
                    </label>
                    <input
                      type="url"
                      value={gatewayConfig.webhookUrl}
                      onChange={e => setGatewayConfig({ ...gatewayConfig, webhookUrl: e.target.value })}
                      placeholder="https://hooks.zapier.com/... or https://formspree.io/f/..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
              >
                Save Email Gateway Settings
              </button>
            </form>

            {/* 2. WHATSAPP BUSINESS CLOUD API */}
            <form onSubmit={handleSaveWhatsAppConfig} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Cloud API</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    whatsAppConfig.provider === 'meta_cloud' && whatsAppConfig.apiKey && whatsAppConfig.phoneNumberId
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {whatsAppConfig.provider === 'meta_cloud' && whatsAppConfig.apiKey ? 'Live Connected' : 'Ready for API Key'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Meta WhatsApp Business Cloud API integration for template notifications.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Provider Mode:</label>
                    <select
                      value={whatsAppConfig.provider}
                      onChange={e => setWhatsAppConfig({ ...whatsAppConfig, provider: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-xs text-slate-800"
                    >
                      <option value="simulation">Simulation Mode (Decoupled Fallback)</option>
                      <option value="meta_cloud">Meta WhatsApp Cloud API (Live Production)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phone Number ID:
                    </label>
                    <input
                      type="text"
                      value={whatsAppConfig.phoneNumberId}
                      onChange={e => setWhatsAppConfig({ ...whatsAppConfig, phoneNumberId: e.target.value })}
                      placeholder="Paste Phone Number ID (e.g. 104857291029384)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Meta Access Token / API Key:
                    </label>
                    <input
                      type="password"
                      value={whatsAppConfig.apiKey}
                      onChange={e => setWhatsAppConfig({ ...whatsAppConfig, apiKey: e.target.value })}
                      placeholder="Paste Permanent System User Token (Bearer EAA...)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      WhatsApp Business Account ID:
                    </label>
                    <input
                      type="text"
                      value={whatsAppConfig.businessAccountId}
                      onChange={e => setWhatsAppConfig({ ...whatsAppConfig, businessAccountId: e.target.value })}
                      placeholder="Paste WABA ID (e.g. 981273645019)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
              >
                Save WhatsApp Credentials
              </button>
            </form>

            {/* 3. SMS GATEWAY (TRAI DLT INDIA) */}
            <form onSubmit={handleSaveSmsConfig} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span>SMS Gateway (DLT)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    smsConfig.provider !== 'simulation' && smsConfig.apiKey
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {smsConfig.provider !== 'simulation' && smsConfig.apiKey ? 'Live Configured' : 'DLT Ready'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Indian SMS gateway with TRAI DLT header & registered template routing.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">SMS Provider:</label>
                    <select
                      value={smsConfig.provider}
                      onChange={e => setSmsConfig({ ...smsConfig, provider: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-xs text-slate-800"
                    >
                      <option value="simulation">Simulation Mode (DLT Test Log)</option>
                      <option value="msg91">MSG91 (India Transactional)</option>
                      <option value="textlocal">Textlocal (India DLT)</option>
                      <option value="twilio">Twilio Programmable SMS</option>
                      <option value="custom_http">Custom HTTP POST Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      SMS API Key / Auth Token:
                    </label>
                    <input
                      type="password"
                      value={smsConfig.apiKey}
                      onChange={e => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                      placeholder="Paste SMS Provider API Key / Auth Token"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      DLT Sender ID / Header:
                    </label>
                    <input
                      type="text"
                      value={smsConfig.senderId}
                      onChange={e => setSmsConfig({ ...smsConfig, senderId: e.target.value })}
                      placeholder="e.g. BCFNDN"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Gateway API POST Endpoint:
                    </label>
                    <input
                      type="url"
                      value={smsConfig.apiUrl}
                      onChange={e => setSmsConfig({ ...smsConfig, apiUrl: e.target.value })}
                      placeholder="https://api.smsprovider.com/v1/send"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
              >
                Save SMS Credentials
              </button>
            </form>

          </div>

          {/* Backend Production .env Cheat Sheet Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-sm text-amber-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Backend Production Environment Variables (`server/.env`)</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                server/.env.example
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Credentials entered in the cards above are persisted in your Admin session. For production Node.js servers, you can also paste these exact keys into your server environment variables:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
              <div className="space-y-1">
                <span className="text-blue-400 font-bold block"># Email Gateway</span>
                <div>EMAIL_HOST=smtp.sendgrid.net</div>
                <div>EMAIL_PORT=587</div>
                <div>EMAIL_USER=apikey</div>
                <div>EMAIL_PASS=your_api_key</div>
              </div>
              <div className="space-y-1">
                <span className="text-emerald-400 font-bold block"># WhatsApp Business API</span>
                <div>WHATSAPP_PHONE_NUMBER_ID=...</div>
                <div>WHATSAPP_API_KEY=EAA...</div>
                <div>WHATSAPP_BUSINESS_ACCOUNT_ID=...</div>
              </div>
              <div className="space-y-1">
                <span className="text-purple-400 font-bold block"># SMS DLT Gateway</span>
                <div>SMS_API_URL=https://...</div>
                <div>SMS_API_KEY=your_sms_key</div>
                <div>SMS_SENDER_ID=BCFNDN</div>
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
