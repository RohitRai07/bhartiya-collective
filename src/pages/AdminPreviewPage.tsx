import React, { useState, useEffect } from 'react';
import { registrationService } from '../services/registrationService';
import { submissionService } from '../services/submissionService';
import { newsletterService } from '../services/newsletterService';
import { authService } from '../services/authService';
import { publicationService } from '../services/publicationService';
import { pdfService } from '../services/pdfService';
import { circularService } from '../services/circularService';
import { eventService } from '../services/eventService';
import { researchService } from '../services/researchService';
import { expertService } from '../services/expertService';
import { newsService } from '../services/newsService';
import { notificationService } from '../services/notificationService';
import { registrationCsvExporter } from '../export/registrationCsvExporter';

import { UserRegistrationRecord } from '../types/registration';
import { PaperSubmissionRecord, PaperSubmissionStatus } from '../types/submission';
import { AuthSession, AdminCredentials } from '../types/auth';
import { Publication } from '../types/publication';
import { Circular } from '../types/circular';
import { EventItem } from '../types/event';
import { ResearchDomain } from '../types/research';
import { ScholarExpert } from '../types/expert';
import { NewsArticle } from '../types/news';
import { NotificationLog, NotificationRecipient } from '../types/notification';
import { EmailGatewayConfig } from '../services/notificationService';
import { DEFAULT_ADMIN_CREDS } from '../services/authService';
import { fileService } from '../services/fileService';
import { careerService } from '../services/careerService';
import { podcastService } from '../services/podcastService';
import { magazineService } from '../services/magazineService';
import { featureConfig, FeatureFlags } from '../config/featureConfig';
import { siteConfig } from '../config/siteConfig';
import { CareerApplicationRecord, CareerApplicationStatus } from '../types/career';
import { PodcastEpisode, PodcastInput } from '../types/podcast';
import { MagazineIssue, MagazineIssueInput } from '../types/magazine';
import { teamService } from '../services/teamService';
import { NationalTeamMember, StateChapter } from '../types/team';

import { AdminLoginForm } from '../components/admin/AdminLoginForm';
import { RegistrationDetailModal } from '../components/admin/RegistrationDetailModal';
import { SendNotificationModal } from '../components/admin/SendNotificationModal';
import { ContentEditorModal, ContentEntityType } from '../components/admin/ContentEditorModal';
import { ImageUploadWithUrl } from '../components/admin/ImageUploadWithUrl';
import { TaxonomyManager } from '../components/admin/TaxonomyManager';
import { CareerDetailModal } from '../components/admin/CareerDetailModal';
import { PodcastEditorModal } from '../components/admin/PodcastEditorModal';
import { MagazineEditorModal } from '../components/admin/MagazineEditorModal';
import { AdminSearchModal, AdminSearchResultItem } from '../components/admin/AdminSearchModal';
import { NationalMemberModal } from '../components/admin/NationalMemberModal';
import { StateChapterModal } from '../components/admin/StateChapterModal';
import { taxonomyService } from '../services/taxonomyService';
import { gazetteSyncService } from '../services/gazetteSyncService';

import { 
  ShieldCheck, 
  Download, 
  Search, 
  CheckCircle, 
  Archive, 
  ArrowLeft, 
  LogOut, 
  RefreshCw, 
  UserCheck, 
  FileText, 
  Mail, 
  Send, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  BookOpen, 
  Calendar, 
  Compass, 
  Newspaper, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Users, 
  UserPlus, 
  Lock, 
  KeyRound, 
  Check, 
  Copy, 
  AlertCircle, 
  Info, 
  SendHorizontal, 
  UploadCloud, 
  Image as ImageIcon, 
  ExternalLink, 
  Scale,
  Tag,
  Briefcase,
  Video,
  Sliders,
  CheckCircle2,
  FileDown,
  MapPin,
  Heart,
  Megaphone
} from 'lucide-react';

interface AdminPreviewPageProps {
  onBackToPublicSite: () => void;
}

type MainTab = 'registrations' | 'careers' | 'content' | 'communications' | 'submissions' | 'newsletter' | 'settings';
type ContentSubTab = 'publications' | 'circulars' | 'events' | 'research' | 'experts' | 'nationalTeam' | 'stateTeam' | 'news' | 'podcasts' | 'magazine' | 'media' | 'taxonomy';

export const AdminPreviewPage: React.FC<AdminPreviewPageProps> = ({ onBackToPublicSite }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>('registrations');
  const [contentSubTab, setContentSubTab] = useState<ContentSubTab>('publications');
  const [, setLoading] = useState(true);

  // Registrations state
  const [registrations, setRegistrations] = useState<UserRegistrationRecord[]>([]);
  const [regFilter, setRegFilter] = useState<'all' | 'pending' | 'verified' | 'archived'>('all');
  const [regSearch, setRegSearch] = useState('');
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [viewingRecord, setViewingRecord] = useState<UserRegistrationRecord | null>(null);

  // Careers state
  const [careerApplications, setCareerApplications] = useState<CareerApplicationRecord[]>([]);
  const [careerFilter, setCareerFilter] = useState<'all' | 'internship' | 'job' | 'pending' | 'reviewing' | 'shortlisted' | 'rejected'>('all');
  const [careerSearch, setCareerSearch] = useState('');
  const [viewingCareerRecord, setViewingCareerRecord] = useState<CareerApplicationRecord | null>(null);

  // Podcasts state
  const [podcasts, setPodcasts] = useState<PodcastEpisode[]>([]);
  const [podcastEditorOpen, setPodcastEditorOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<PodcastEpisode | null>(null);

  // Magazine state
  const [magazines, setMagazines] = useState<MagazineIssue[]>([]);
  const [magazineEditorOpen, setMagazineEditorOpen] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState<MagazineIssue | null>(null);

  // National Team & State Chapters state
  const [nationalTeam, setNationalTeam] = useState<NationalTeamMember[]>([]);
  const [stateChapters, setStateChapters] = useState<StateChapter[]>([]);
  const [editingNationalMember, setEditingNationalMember] = useState<NationalTeamMember | null>(null);
  const [nationalMemberModalOpen, setNationalMemberModalOpen] = useState(false);
  const [editingStateChapter, setEditingStateChapter] = useState<StateChapter | null>(null);
  const [stateChapterModalOpen, setStateChapterModalOpen] = useState(false);

  // Admin Universal Search Modal
  const [adminSearchModalOpen, setAdminSearchModalOpen] = useState(false);

  // Feature Flags state
  const [features, setFeatures] = useState<FeatureFlags>(featureConfig.get());

  // Content state
  const [publications, setPublications] = useState<Publication[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [domains, setDomains] = useState<ResearchDomain[]>([]);
  const [experts, setExperts] = useState<ScholarExpert[]>([]);
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);

  // Submissions & Newsletter & Logs
  const [submissions, setSubmissions] = useState<PaperSubmissionRecord[]>([]);
  const [cfpSearch, setCfpSearch] = useState('');
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [subSearch, setSubSearch] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [showAddSub, setShowAddSub] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);

  // Modal controls
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyRecipients, setNotifyRecipients] = useState<NotificationRecipient[]>([]);
  const [notifyDefaultSubject, setNotifyDefaultSubject] = useState('');
  const [notifyDefaultMessage, setNotifyDefaultMessage] = useState('');

  const [contentEditorOpen, setContentEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState<ContentEntityType>('publication');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [adminGazetteSyncing, setAdminGazetteSyncing] = useState(false);
  const [adminGazetteSyncMsg, setAdminGazetteSyncMsg] = useState<string | null>(null);

  // Security & Settings state
  const [adminCreds, setAdminCreds] = useState<AdminCredentials>(authService.getAdminCredentials());
  const [credEditName, setCredEditName] = useState(adminCreds.name);
  const [credEditEmail, setCredEditEmail] = useState(adminCreds.email);
  const [credCurrentPassword, setCredCurrentPassword] = useState('');
  const [credNewPassword, setCredNewPassword] = useState('');
  const [credConfirmPassword, setCredConfirmPassword] = useState('');
  const [cred2faEnabled, setCred2faEnabled] = useState(adminCreds.twoFactorEnabled ?? true);
  const [cred2faMethod, setCred2faMethod] = useState<'email_otp' | 'authenticator_app'>(adminCreds.twoFactorMethod || 'email_otp');
  const [credStatusMsg, setCredStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email Gateway state
  const [gatewayConfig, setGatewayConfig] = useState<EmailGatewayConfig>(notificationService.getEmailGatewayConfig());
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [simulated2faCode, setSimulated2faCode] = useState<string | null>(null);

  // Media Library & Uploads state
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [activeUploadUrl, setActiveUploadUrl] = useState('');
  const [copiedMediaId, setCopiedMediaId] = useState<string | null>(null);

  const loadMediaList = () => {
    setMediaList(fileService.getMediaLibrary());
  };

  // Initial Auth Check
  useEffect(() => {
    const existing = authService.getAdminSession();
    if (existing) {
      setSession(existing);
      loadAllData();
      loadMediaList();
    } else {
      setLoading(false);
    }
  }, []);

  // Listen to cross-system content updates
  useEffect(() => {
    const handleUpdate = () => {
      loadAllData();
    };
    window.addEventListener('bharat:content-updated', handleUpdate);
    return () => window.removeEventListener('bharat:content-updated', handleUpdate);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [regs, subs, pubs, circs, evts, doms, exps, nws, logs, nTeam, sChapters] = await Promise.all([
        registrationService.getRegistrations(),
        submissionService.getSubmissions(),
        publicationService.getPublications({ includeDrafts: true }),
        circularService.getCirculars({ includeDrafts: true }),
        eventService.getEvents(true),
        researchService.getDomains(true),
        expertService.getExperts({ includeArchived: true }),
        newsService.getNews(true),
        notificationService.getNotificationLogs(),
        teamService.getNationalTeam({ includeDrafts: true }),
        teamService.getStateChapters({ includeDrafts: true }),
      ]);

      setRegistrations(regs || []);
      setSubmissions(subs || []);
      setPublications(pubs || []);
      setCirculars(circs || []);
      setEvents(evts || []);
      setDomains(doms || []);
      setExperts(exps || []);
      setNewsList(nws || []);
      setNotificationLogs(logs || []);
      setSubscribers(newsletterService.getSubscribers() || []);
      setCareerApplications(careerService.getAll() || []);
      setPodcasts(podcastService.getAll() || []);
      setMagazines(magazineService.getAll() || []);
      setNationalTeam(nTeam || []);
      setStateChapters(sChapters || []);
      setFeatures(featureConfig.get());
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    loadAllData();
  };

  const handleLogout = () => {
    authService.logoutAdmin();
    setSession(null);
  };

  // -------------------------------------------------------------
  // REGISTRATION ACTIONS
  // -------------------------------------------------------------
  const handleRegStatusChange = async (id: string, newStatus: 'pending' | 'verified' | 'archived') => {
    await registrationService.updateStatus(id, newStatus);
    await loadAllData();
    if (viewingRecord && viewingRecord.id === id) {
      setViewingRecord({ ...viewingRecord, status: newStatus });
    }
  };

  const handleBulkStatusChange = async (newStatus: 'pending' | 'verified' | 'archived') => {
    if (selectedRegIds.length === 0) return;
    await registrationService.bulkUpdateStatus(selectedRegIds, newStatus);
    setSelectedRegIds([]);
    await loadAllData();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegIds(filteredRegistrations.map(r => r.id));
    } else {
      setSelectedRegIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedRegIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExportFilteredCsv = () => {
    registrationCsvExporter.downloadBulkRegistrationCsv(filteredRegistrations);
  };

  const handleExportSelectedCsv = () => {
    const selected = registrations.filter(r => selectedRegIds.includes(r.id));
    registrationCsvExporter.downloadBulkRegistrationCsv(
      selected, 
      `bharat_collective_selected_${selected.length}_candidates.csv`
    );
  };

  const openNotifySingle = (record: UserRegistrationRecord) => {
    setNotifyRecipients([{
      id: record.id,
      name: `${record.firstName} ${record.lastName}`.trim(),
      email: record.email,
      phone: record.phoneNumber?.fullFormatted || '',
      category: 'candidate',
    }]);
    setNotifyDefaultSubject(`Important Update Regarding Application ${record.registrationNumber}`);
    setNotifyDefaultMessage(`Namaste ${record.firstName},\n\nWe are writing from the Bharat Collective Foundation regarding your application (${record.registrationNumber}).\n\nWarm regards,\nAcademic Review Secretariat`);
    setNotifyModalOpen(true);
  };

  const openNotifySelected = () => {
    const selected = registrations.filter(r => selectedRegIds.includes(r.id));
    setNotifyRecipients(selected.map(r => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`.trim(),
      email: r.email,
      phone: r.phoneNumber?.fullFormatted || '',
      category: 'candidate',
    })));
    setNotifyDefaultSubject('Official Announcement: Bharat Collective Foundation');
    setNotifyDefaultMessage('Namaste,\n\nWe are pleased to share an update with you regarding our research colloquium and publications.\n\nWarm regards,\nBharat Collective Secretariat');
    setNotifyModalOpen(true);
  };

  const openNotifySubscribers = () => {
    setNotifyRecipients(subscribers.map((s, idx) => ({
      id: s.id || `sub-${idx}`,
      name: s.email.split('@')[0],
      email: s.email,
      phone: '',
      category: 'subscriber',
    })));
    setNotifyDefaultSubject('Bharat Collective Research Digest • Monthly Monograph Release');
    setNotifyDefaultMessage('Namaste,\n\nOur latest policy monograph is now published and accessible on our portal. We invite you to read the executive abstract and engage with our civilizational inquiry.\n\nWarm regards,\nEditorial Secretariat');
    setNotifyModalOpen(true);
  };

  // -------------------------------------------------------------
  // SUBSCRIBERS ACTIONS
  // -------------------------------------------------------------
  const handleAddSubscriberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail || !newSubEmail.trim()) return;
    try {
      await newsletterService.addSubscriberManually(newSubEmail.trim());
      setNewSubEmail('');
      setShowAddSub(false);
      setSubscribers(newsletterService.getSubscribers());
    } catch (err: any) {
      alert(err.message || 'Failed to add subscriber');
    }
  };

  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from subscribers?`)) return;
    await newsletterService.deleteSubscriber(id || email);
    setSubscribers(newsletterService.getSubscribers());
  };

  const handleExportSubscribersCsv = () => {
    const headers = ['Email', 'Subscribed At', 'Source', 'Status'];
    const rows = filteredSubscribers.map(s => [
      s.email,
      s.subscribedAt,
      s.source || 'website-footer',
      s.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bharat_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // CALL FOR PAPERS (SUBMISSIONS) ACTIONS
  // -------------------------------------------------------------
  const handleCfpStatusChange = async (id: string, newStatus: PaperSubmissionStatus) => {
    await submissionService.updateStatus(id, newStatus);
    const updated = await submissionService.getSubmissions();
    setSubmissions(updated);
  };

  const openNotifyAuthor = (sub: PaperSubmissionRecord) => {
    setNotifyRecipients([{
      id: sub.id,
      name: sub.authorName,
      email: sub.authorEmail,
      phone: '',
      category: 'candidate',
    }]);
    setNotifyDefaultSubject(`Update on Your Manuscript Submission: ${sub.submissionCode}`);
    setNotifyDefaultMessage(`Dear ${sub.authorName},\n\nWe have reviewed your abstract "${sub.paperTitle}" (Code: ${sub.submissionCode}).\n\nYour current review status is: ${sub.status.toUpperCase().replace(/_/g, ' ')}.\n\nWarm regards,\nEditorial Review Board\nBharat Collective Foundation`);
    setNotifyModalOpen(true);
  };

  // -------------------------------------------------------------
  // CONTENT MANAGEMENT ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddContent = (type: ContentEntityType) => {
    setEditorType(type);
    setEditingItem(null);
    setContentEditorOpen(true);
  };

  const handleOpenEditContent = (type: ContentEntityType, item: any) => {
    setEditorType(type);
    setEditingItem(item);
    setContentEditorOpen(true);
  };

  const handleSaveContent = async (type: ContentEntityType, data: any, notifyUsers: boolean) => {
    if (type === 'circular') {
      if (editingItem?.id) {
        await circularService.updateCircular(editingItem.id, data);
      } else {
        await circularService.createCircular(data);
      }
    } else if (type === 'publication') {
      if (editingItem?.id) {
        await publicationService.updatePublication(editingItem.id, data);
      } else {
        await publicationService.createPublication(data);
      }
    } else if (type === 'event') {
      if (editingItem?.id) {
        await eventService.updateEvent(editingItem.id, data);
      } else {
        await eventService.createEvent(data);
      }
    } else if (type === 'research') {
      if (editingItem?.id) {
        await researchService.updateDomain(editingItem.id, data);
      } else {
        await researchService.createDomain(data);
      }
    } else if (type === 'expert') {
      if (editingItem?.id) {
        await expertService.updateExpert(editingItem.id, data);
      } else {
        await expertService.createExpert(data);
      }
    } else if (type === 'news') {
      if (editingItem?.id) {
        await newsService.updateArticle(editingItem.id, data);
      } else {
        await newsService.createArticle(data);
      }
    }

    await loadAllData();

    if (notifyUsers) {
      const title = data.title || data.name || 'New Publication';
      setNotifyRecipients(subscribers.map((s, idx) => ({
        id: s.id || `sub-${idx}`,
        name: s.email.split('@')[0],
        email: s.email,
        phone: '',
        category: 'subscriber',
      })));
      setNotifyDefaultSubject(`New Update: ${title} • Bharat Collective`);
      setNotifyDefaultMessage(`Namaste,\n\nWe have just released an important update on our portal: "${title}".\n\nVisit the Bharat Collective Foundation portal to read the full brief and engage with our scholars.\n\nWarm regards,\nBharat Collective Secretariat`);
      setNotifyModalOpen(true);
    }
  };

  const handleDeleteContent = async (type: ContentEntityType, id: string) => {
    if (!window.confirm('Are you sure you wish to delete this item?')) return;
    if (type === 'circular') await circularService.deleteCircular(id);
    if (type === 'publication') await publicationService.deletePublication(id);
    if (type === 'event') await eventService.deleteEvent(id);
    if (type === 'research') await researchService.deleteDomain(id);
    if (type === 'expert') await expertService.deleteExpert(id);
    if (type === 'news') await newsService.deleteArticle(id);
    await loadAllData();
  };

  const handleTogglePublish = async (type: ContentEntityType | 'podcast' | 'magazine' | 'nationalTeam' | 'stateTeam', id: string) => {
    if (type === 'circular') await circularService.togglePublish(id);
    if (type === 'publication') await publicationService.togglePublish(id);
    if (type === 'event') await eventService.togglePublish(id);
    if (type === 'news') await newsService.togglePublish(id);
    if (type === 'research') await researchService.togglePublish(id);
    if (type === 'expert') await expertService.toggleArchive(id);
    if (type === 'podcast') podcastService.togglePublish(id);
    if (type === 'magazine') magazineService.togglePublish(id);
    if (type === 'nationalTeam') await teamService.toggleNationalMemberPublish(id);
    if (type === 'stateTeam') await teamService.toggleStateChapterPublish(id);
    await loadAllData();
  };

  const handleDeleteNationalMember = async (id: string) => {
    if (!window.confirm('Are you sure you wish to delete this national team member?')) return;
    await teamService.deleteNationalMember(id);
    await loadAllData();
  };

  const handleSaveNationalMember = async (data: Omit<NationalTeamMember, 'id'>) => {
    if (editingNationalMember) {
      await teamService.updateNationalMember(editingNationalMember.id, data);
    } else {
      await teamService.createNationalMember(data);
    }
    setNationalMemberModalOpen(false);
    setEditingNationalMember(null);
    await loadAllData();
  };

  const handleDeleteStateChapter = async (id: string) => {
    if (!window.confirm('Are you sure you wish to delete this state chapter?')) return;
    await teamService.deleteStateChapter(id);
    await loadAllData();
  };

  const handleSaveStateChapter = async (data: Omit<StateChapter, 'id'>) => {
    if (editingStateChapter) {
      await teamService.updateStateChapter(editingStateChapter.id, data);
    } else {
      await teamService.createStateChapter(data);
    }
    setStateChapterModalOpen(false);
    setEditingStateChapter(null);
    await loadAllData();
  };

  const handleAdminSearchResult = (item: AdminSearchResultItem) => {
    setActiveTab(item.tab);
    if (item.subTab) {
      setContentSubTab(item.subTab);
    }
    if (item.recordType === 'registration' && item.recordId) {
      const reg = registrations.find(r => r.id === item.recordId);
      if (reg) setViewingRecord(reg);
    }
    if (item.recordType === 'career' && item.recordId) {
      const car = careerApplications.find(c => c.id === item.recordId);
      if (car) setViewingCareerRecord(car);
    }
  };

  const handleAdminGazetteSync = async () => {
    try {
      setAdminGazetteSyncing(true);
      const res = await gazetteSyncService.syncNow();
      setAdminGazetteSyncMsg(res.message);
      setTimeout(() => setAdminGazetteSyncMsg(null), 6000);
      const updated = await circularService.getCirculars({ includeDrafts: true });
      setCirculars(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to sync with official gazette repository');
    } finally {
      setAdminGazetteSyncing(false);
    }
  };

  // -------------------------------------------------------------
  // SECURITY & CREDENTIALS & 2FA ACTIONS
  // -------------------------------------------------------------
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCredStatusMsg(null);

    if (credNewPassword) {
      if (credNewPassword !== credConfirmPassword) {
        setCredStatusMsg({ type: 'error', text: 'New passwords do not match. Please re-type.' });
        return;
      }
      if (credNewPassword.length < 6) {
        setCredStatusMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
        return;
      }
    }

    if (!credCurrentPassword) {
      setCredStatusMsg({ type: 'error', text: 'Please enter your current password to authorize changes.' });
      return;
    }

    const updates: Partial<AdminCredentials> = {
      name: credEditName.trim(),
      email: credEditEmail.trim().toLowerCase(),
      twoFactorEnabled: cred2faEnabled,
      twoFactorMethod: cred2faMethod,
    };

    if (credNewPassword) {
      updates.password = credNewPassword;
    }

    const result = authService.updateAdminCredentials(updates, credCurrentPassword);
    if (!result.success) {
      setCredStatusMsg({ type: 'error', text: result.message });
      return;
    }

    setAdminCreds(result.credentials!);
    setCredCurrentPassword('');
    setCredNewPassword('');
    setCredConfirmPassword('');
    setCredStatusMsg({ type: 'success', text: 'Administrator credentials and security settings updated successfully!' });
    
    // Update active session user if email/name changed
    const currentSession = authService.getAdminSession();
    if (currentSession) setSession(currentSession);
  };

  const handleResetToDefaults = () => {
    if (!window.confirm('Reset admin credentials back to default demo credentials (admin@bharatcollective.org / BharatAdmin@2026)?')) return;
    const result = authService.updateAdminCredentials(DEFAULT_ADMIN_CREDS);
    setAdminCreds(result.credentials || DEFAULT_ADMIN_CREDS);
    setCredEditName(DEFAULT_ADMIN_CREDS.name);
    setCredEditEmail(DEFAULT_ADMIN_CREDS.email);
    setCred2faEnabled(DEFAULT_ADMIN_CREDS.twoFactorEnabled ?? true);
    setCred2faMethod(DEFAULT_ADMIN_CREDS.twoFactorMethod || 'email_otp');
    setCredCurrentPassword('');
    setCredNewPassword('');
    setCredConfirmPassword('');
    setCredStatusMsg({ type: 'success', text: 'Admin credentials reset to defaults.' });
  };

  const handleTrigger2faTest = () => {
    const ch = authService.createTwoFactorChallenge(adminCreds.email);
    setSimulated2faCode(ch.code);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setTestEmailLoading(true);
    setTestEmailStatus(null);
    try {
      await notificationService.sendNotification({
        recipients: [{
          id: `test-${Date.now()}`,
          name: testEmailAddress.split('@')[0],
          email: testEmailAddress.trim(),
          phone: '',
          category: 'subscriber',
        }],
        channel: 'email',
        subject: 'Test Dispatch: Bharat Collective Secretariat Communications',
        message: `Namaste,\n\nThis is a verified test email sent from the Bharat Collective Administrative Security Center.\n\nTime: ${new Date().toLocaleString()}\nGateway Provider: ${gatewayConfig.provider.toUpperCase()}\nStatus: Verified\n\nWarm regards,\nBharat Collective Secretariat`,
      });
      setTestEmailStatus(`Test email successfully generated & logged for ${testEmailAddress}. View it in the Communications tab!`);
      const logs = await notificationService.getNotificationLogs();
      setNotificationLogs(logs);
      setTestEmailAddress('');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch test email.');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleCopyMediaUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedMediaId(id);
    setTimeout(() => setCopiedMediaId(null), 2000);
  };

  const handleDeleteMedia = (id: string) => {
    if (window.confirm('Are you sure you want to remove this image from the Media Library?')) {
      fileService.deleteFromMediaLibrary(id);
      loadMediaList();
    }
  };

  // Career Handlers
  const handleCareerStatusChange = (id: string, newStatus: CareerApplicationStatus) => {
    careerService.updateStatus(id, newStatus);
    setCareerApplications(careerService.getAll());
    if (viewingCareerRecord && viewingCareerRecord.id === id) {
      setViewingCareerRecord({ ...viewingCareerRecord, status: newStatus });
    }
  };

  const handleDeleteCareer = (id: string) => {
    if (window.confirm('Are you sure you want to delete this candidate application record?')) {
      careerService.delete(id);
      setCareerApplications(careerService.getAll());
      if (viewingCareerRecord && viewingCareerRecord.id === id) {
        setViewingCareerRecord(null);
      }
    }
  };

  const handleDownloadCv = (rec: CareerApplicationRecord) => {
    if (!rec.cvDataUrl) {
      alert('CV data not available for this candidate.');
      return;
    }
    const link = document.createElement('a');
    link.href = rec.cvDataUrl;
    link.download = rec.cvFileName || `CV_${rec.fullName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Podcast Handlers
  const handleSavePodcast = async (input: PodcastInput) => {
    if (editingPodcast) {
      podcastService.update(editingPodcast.id, input);
    } else {
      podcastService.create(input);
    }
    setPodcasts(podcastService.getAll());
    setPodcastEditorOpen(false);
    setEditingPodcast(null);
  };

  const handleDeletePodcast = (id: string) => {
    if (window.confirm('Are you sure you want to delete this podcast episode?')) {
      podcastService.delete(id);
      setPodcasts(podcastService.getAll());
    }
  };

  // Magazine Handlers
  const handleSaveMagazine = async (input: MagazineIssueInput) => {
    if (editingMagazine) {
      magazineService.update(editingMagazine.id, input);
    } else {
      magazineService.create(input);
    }
    setMagazines(magazineService.getAll());
    setMagazineEditorOpen(false);
    setEditingMagazine(null);
  };

  const handleDeleteMagazine = (id: string) => {
    if (window.confirm('Are you sure you want to delete this magazine edition?')) {
      magazineService.delete(id);
      setMagazines(magazineService.getAll());
    }
  };

  const handleTestDownloadMagazine = (mag: MagazineIssue) => {
    try {
      magazineService.generateAndDownloadPdf(mag);
    } catch (err) {
      console.error(err);
      alert('Error generating magazine PDF.');
    }
  };

  // Feature Flag Handler
  const handleToggleFeature = (key: keyof FeatureFlags) => {
    const updated = featureConfig.update({ [key]: !features[key] });
    setFeatures(updated);
  };

  // If not logged in as admin, render Admin Login screen
  if (!session) {
    return (
      <AdminLoginForm
        onLoginSuccess={handleLoginSuccess}
        onBackToPublicSite={onBackToPublicSite}
      />
    );
  }

  // Filtered registrations
  const filteredRegistrations = (registrations || []).filter(r => {
    const matchesFilter = regFilter === 'all' || r.status === regFilter;
    const matchesSearch = !regSearch || 
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(regSearch.toLowerCase()) ||
      (r.collegeName || '').toLowerCase().includes(regSearch.toLowerCase()) ||
      (r.city || '').toLowerCase().includes(regSearch.toLowerCase()) ||
      (r.registrationNumber || '').toLowerCase().includes(regSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isAllSelected = filteredRegistrations.length > 0 && 
    filteredRegistrations.every(r => selectedRegIds.includes(r.id));

  // Filtered Career Applications
  const filteredCareerApplications = (careerApplications || []).filter(app => {
    const matchesFilter =
      careerFilter === 'all'
        ? true
        : careerFilter === 'internship' || careerFilter === 'job'
        ? app.type === careerFilter
        : app.status === careerFilter;

    const matchesSearch =
      !careerSearch ||
      app.fullName.toLowerCase().includes(careerSearch.toLowerCase()) ||
      app.email.toLowerCase().includes(careerSearch.toLowerCase()) ||
      app.currentInstitution.toLowerCase().includes(careerSearch.toLowerCase()) ||
      app.qualification.toLowerCase().includes(careerSearch.toLowerCase()) ||
      app.areaOfInterest.toLowerCase().includes(careerSearch.toLowerCase()) ||
      app.applicationCode.toLowerCase().includes(careerSearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Filtered subscribers
  const filteredSubscribers = (subscribers || []).filter(s => 
    !subSearch || s.email.toLowerCase().includes(subSearch.toLowerCase())
  );

  // Filtered CFP Submissions
  const filteredSubmissions = (submissions || []).filter(s =>
    !cfpSearch || 
    s.paperTitle.toLowerCase().includes(cfpSearch.toLowerCase()) ||
    s.authorName.toLowerCase().includes(cfpSearch.toLowerCase()) ||
    s.submissionCode.toLowerCase().includes(cfpSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 text-white px-3 sm:px-8 py-3 sm:py-3.5 border-b border-slate-800 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={onBackToPublicSite}
            className="flex items-center space-x-1 sm:space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold bg-slate-800 hover:bg-slate-700 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors border border-slate-700 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Public Site</span>
          </button>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-6 h-6 rounded-md overflow-hidden bg-white p-0.5 shrink-0 flex items-center justify-center border border-slate-700">
              <img src={siteConfig.emblemUrl} alt="Emblem" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif font-bold text-xs sm:text-sm tracking-wide text-white truncate">
              Bharat Collective • Admin Portal
            </span>
          </div>
        </div>

        {/* Universal Search in Admin Header */}
        <div className="flex-1 max-w-sm mx-2 hidden md:block">
          <button
            type="button"
            onClick={() => setAdminSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Search records, content, team...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-mono">⌘K</kbd>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAdminSearchModalOpen(true)}
          className="md:hidden p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:text-white border border-slate-700 cursor-pointer"
          aria-label="Universal Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2 sm:space-x-4 text-xs shrink-0">
          <div className="hidden lg:flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Administrator: <strong className="text-white font-mono">{session.user.email}</strong></span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-colors font-semibold cursor-pointer text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Main Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200 flex overflow-x-auto no-scrollbar gap-2 sm:flex-wrap">
          {[
            { id: 'registrations', label: `Registrations (${registrations.length})`, icon: UserCheck },
            { id: 'careers', label: `Careers (${careerApplications.length})`, icon: Briefcase },
            { id: 'content', label: 'Website Content Management', icon: BookOpen },
            { id: 'communications', label: `Communications & Logs (${notificationLogs.length})`, icon: Send },
            { id: 'submissions', label: `Call for Papers (${submissions.length})`, icon: FileText },
            { id: 'newsletter', label: `Subscribers (${subscribers.length})`, icon: Mail },
            { id: 'settings', label: 'Security & Settings', icon: KeyRound },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MainTab)}
                className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: REGISTRATIONS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            {/* Section Level Toggle Banner */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-amber-800 shrink-0" />
                  <span className="font-serif font-bold text-slate-900 text-sm">
                    Scholar & Member Registration Portal Visibility
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    features.userRegistration 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {features.userRegistration ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Controls whether the public membership & volunteer registration portal appears in the navigation and at <code>/register</code>.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleToggleFeature('userRegistration')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.userRegistration ? 'bg-amber-800' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.userRegistration ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700">
                  {features.userRegistration ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Filter and Top Action Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'pending', 'verified', 'archived'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRegFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      regFilter === tab
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab} ({tab === 'all' ? registrations.length : registrations.filter(r => r.status === tab).length})
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex-grow sm:flex-grow-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search candidate, college, city..."
                    value={regSearch}
                    onChange={e => setRegSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white w-full sm:w-64"
                  />
                </div>

                <button
                  onClick={handleExportFilteredCsv}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
                  title="Export all matching records using the strict 10-column schema"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download 10-Col CSV ({filteredRegistrations.length})</span>
                </button>
              </div>
            </div>

            {/* Batch Action Bar if items selected */}
            {selectedRegIds.length > 0 && (
              <div className="bg-amber-900 text-white rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center space-x-2 text-xs font-semibold">
                  <span className="bg-amber-700 px-2.5 py-0.5 rounded-md font-mono font-bold text-amber-200">
                    {selectedRegIds.length}
                  </span>
                  <span>candidate(s) selected</span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => handleBulkStatusChange('verified')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Verify Selected</span>
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('archived')}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Archive className="w-3 h-3" />
                    <span>Archive Selected</span>
                  </button>
                  <button
                    onClick={openNotifySelected}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Notify Selected</span>
                  </button>
                  <button
                    onClick={handleExportSelectedCsv}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export Selected CSV</span>
                  </button>
                </div>
              </div>
            )}

            {/* Registrations Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5 w-10 text-center">
                        <button
                          type="button"
                          onClick={() => handleSelectAll(!isAllSelected)}
                          className="text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          {isAllSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="p-3.5">Reg ID</th>
                      <th className="p-3.5">Candidate Name</th>
                      <th className="p-3.5">Phone (+91)</th>
                      <th className="p-3.5">College / Institution</th>
                      <th className="p-3.5">City & State</th>
                      <th className="p-3.5">PIN Code</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRegistrations.map(r => {
                      const isSelected = selectedRegIds.includes(r.id);
                      return (
                        <tr 
                          key={r.id} 
                          className={`transition-colors ${
                            isSelected ? 'bg-amber-50/70' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectOne(r.id)}
                              className="text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-amber-700" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-amber-900 whitespace-nowrap">
                            {r.registrationNumber}
                          </td>
                          <td className="p-3.5 font-medium text-slate-900">
                            <div>{r.firstName} {r.middleName} {r.lastName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{r.email}</div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                            {r.phoneNumber?.fullFormatted || r.phoneNumber?.nationalNumber}
                          </td>
                          <td className="p-3.5 text-slate-700 max-w-xs truncate" title={r.collegeName}>
                            {r.collegeName}
                          </td>
                          <td className="p-3.5 text-slate-700 whitespace-nowrap">
                            {r.city}, {r.state}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">
                            {r.pincode}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              r.status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'archived'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setViewingRecord(r)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1 cursor-pointer"
                              title="View Candidate Dossier"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Dossier</span>
                            </button>

                            <button
                              onClick={() => registrationCsvExporter.downloadSingleRegistrationCsv(r)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                              title="Download Individual 10-Col CSV"
                            >
                              <Download className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => openNotifySingle(r)}
                              className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-lg text-xs transition-colors cursor-pointer"
                              title="Send Email / WhatsApp"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredRegistrations.length === 0 && (
                <div className="text-center py-12 text-xs text-slate-400">
                  No applications found matching the search or filter criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: CAREER APPLICATIONS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'careers' && (
          <div className="space-y-4">
            {/* Section Level Toggle Banner */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-amber-800 shrink-0" />
                  <span className="font-serif font-bold text-slate-900 text-sm">
                    Career & Internship Applications Visibility
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    features.careers 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {features.careers ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Controls whether the career & internship application portal appears in the navigation and at <code>/careers</code>.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleToggleFeature('careers')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.careers ? 'bg-amber-800' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.careers ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700">
                  {features.careers ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Filter and Top Action Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `All (${careerApplications.length})` },
                  { id: 'internship', label: `Internships (${careerApplications.filter(a => a.type === 'internship').length})` },
                  { id: 'job', label: `Jobs (${careerApplications.filter(a => a.type === 'job').length})` },
                  { id: 'pending', label: `Pending (${careerApplications.filter(a => a.status === 'pending').length})` },
                  { id: 'reviewing', label: `Reviewing (${careerApplications.filter(a => a.status === 'reviewing').length})` },
                  { id: 'shortlisted', label: `Shortlisted (${careerApplications.filter(a => a.status === 'shortlisted').length})` },
                  { id: 'rejected', label: `Rejected (${careerApplications.filter(a => a.status === 'rejected').length})` },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setCareerFilter(filter.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      careerFilter === filter.id
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative flex-grow sm:flex-grow-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search candidate, college, area..."
                    value={careerSearch}
                    onChange={e => setCareerSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white w-full sm:w-64"
                  />
                </div>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Candidate & Code</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Institution & Degree</th>
                      <th className="p-3.5">Area of Interest</th>
                      <th className="p-3.5">CV File (PDF)</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCareerApplications.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{app.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{app.applicationCode}</div>
                          <div className="text-[10px] text-slate-500">{app.email} • {app.phone}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            app.type === 'job'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-sky-100 text-sky-900 border-sky-300'
                          }`}>
                            {app.type}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="font-medium text-slate-800 truncate" title={app.currentInstitution}>
                            {app.currentInstitution}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate" title={app.qualification}>
                            {app.qualification}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-700 max-w-xs truncate" title={app.areaOfInterest}>
                          {app.areaOfInterest}
                        </td>
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadCv(app)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                            title="Download PDF CV (Strictly ≤ 1 MB)"
                          >
                            <FileDown className="w-3.5 h-3.5 text-rose-600" />
                            <span className="truncate max-w-[100px]">{app.cvFileName || 'Resume.pdf'}</span>
                          </button>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(app.submittedAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            app.status === 'shortlisted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'reviewing'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setViewingCareerRecord(app)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1 cursor-pointer"
                            title="View Candidate Dossier"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Dossier</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCareer(app.id)}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors inline-flex cursor-pointer"
                            title="Delete Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCareerApplications.length === 0 && (
                <div className="text-center py-12 text-xs text-slate-400">
                  No career applications found matching the search or filter criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: WEBSITE CONTENT MANAGEMENT (CRUD) */}
        {/* ============================================================== */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            
            {/* Content Sub-Tabs Header (Matched exactly to reference design) */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                {[
                  { id: 'publications', label: `Publications (${publications.length})`, icon: BookOpen },
                  { id: 'circulars', label: `Circulars & Legal (${circulars.length})`, icon: Scale },
                  { id: 'events', label: `Symposia & Events (${events.length})`, icon: Calendar },
                  { id: 'research', label: `Research Domains (${domains.length})`, icon: Compass },
                  { id: 'experts', label: `Council & Fellows (${experts.length})`, icon: Users },
                  { id: 'nationalTeam', label: `National Team (${nationalTeam.length})`, icon: Users },
                  { id: 'stateTeam', label: `State Chapters (${stateChapters.length})`, icon: MapPin },
                  { id: 'news', label: `News & Insights (${newsList.length})`, icon: Newspaper },
                  { id: 'podcasts', label: `Podcasts (${podcasts.length})`, icon: Video },
                  { id: 'magazine', label: `Magazine (${magazines.length})`, icon: BookOpen },
                  { id: 'media', label: `Media & Uploads (${mediaList.length})`, icon: UploadCloud },
                  { id: 'taxonomy', label: 'Custom Tags & Dropdowns', icon: Tag },
                ].map(sub => {
                  const Icon = sub.icon;
                  const isActive = contentSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setContentSubTab(sub.id as ContentSubTab)}
                      className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                        isActive
                          ? 'bg-amber-100/90 text-amber-950 border border-amber-300 font-bold shadow-2xs ring-1 ring-amber-400/30'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-800' : 'text-slate-500'}`} />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                {contentSubTab !== 'media' && contentSubTab !== 'taxonomy' && (
                  <button
                    onClick={() => {
                      if (contentSubTab === 'podcasts') {
                        setEditingPodcast(null);
                        setPodcastEditorOpen(true);
                        return;
                      }
                      if (contentSubTab === 'magazine') {
                        setEditingMagazine(null);
                        setMagazineEditorOpen(true);
                        return;
                      }
                      if (contentSubTab === 'nationalTeam') {
                        setEditingNationalMember(null);
                        setNationalMemberModalOpen(true);
                        return;
                      }
                      if (contentSubTab === 'stateTeam') {
                        setEditingStateChapter(null);
                        setStateChapterModalOpen(true);
                        return;
                      }
                      const typeMap: Record<string, ContentEntityType> = {
                        publications: 'publication',
                        circulars: 'circular',
                        events: 'event',
                        research: 'research',
                        experts: 'expert',
                        news: 'news',
                      };
                      if (typeMap[contentSubTab]) {
                        handleOpenAddContent(typeMap[contentSubTab]);
                      }
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      Add New {
                        contentSubTab === 'publications' ? 'Publication' :
                        contentSubTab === 'circulars' ? 'Legal Circular' :
                        contentSubTab === 'events' ? 'Event' :
                        contentSubTab === 'research' ? 'Domain' :
                        contentSubTab === 'experts' ? 'Scholar' :
                        contentSubTab === 'nationalTeam' ? 'National Leader' :
                        contentSubTab === 'stateTeam' ? 'State Chapter' :
                        contentSubTab === 'podcasts' ? 'Podcast Episode' :
                        contentSubTab === 'magazine' ? 'Magazine Edition' : 'Article'
                      }
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* 1. PUBLICATIONS TABLE */}
            {contentSubTab === 'publications' && (
              <div className="space-y-4">
                {/* Section Level Toggle Banner */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        Research Publications & Monographs Visibility
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        features.publications 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.publications ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Controls whether the publications repository and monographs directory appear on <code>/publications</code> and in the main navigation.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('publications')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        features.publications ? 'bg-amber-800' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          features.publications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {features.publications ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Title & Category</th>
                        <th className="p-3.5">Authors</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Featured</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {publications.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 max-w-sm">
                            <div className="font-serif font-bold text-slate-900 text-xs">{p.title}</div>
                            <span className="text-[10px] uppercase font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-0.5 inline-block">
                              {(p.category || 'Monograph').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-700">
                            {Array.isArray(p.authors) ? p.authors.join(', ') : p.authors || 'Editorial Desk'}
                          </td>
                          <td className="p-3.5 text-slate-600 font-mono">
                            {p.publishedDate || '2026-09-15'}
                          </td>
                          <td className="p-3.5">
                            {p.featured ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">Featured</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {p.status || 'published'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={async () => {
                                try {
                                  await pdfService.downloadPublicationPdf(p);
                                } catch (e) {
                                  alert('Error generating PDF');
                                }
                              }}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors inline-flex cursor-pointer"
                              title="Download Scholarly PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleTogglePublish('publication', p.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                            >
                              {p.status === 'published' ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleOpenEditContent('publication', p)}
                              className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded transition-colors inline-flex cursor-pointer"
                              title="Edit Publication"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContent('publication', p.id)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors inline-flex cursor-pointer"
                              title="Delete Publication"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

            {/* 1.5 CIRCULARS & LEGAL GUIDELINES TABLE */}
            {contentSubTab === 'circulars' && (
              <div className="space-y-4">
                {/* Section Level Toggle Banner */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Scale className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        Circulars & Legal Materials Section Visibility
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        features.circulars 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.circulars ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Controls whether the official circulars, notifications, and gazette guidelines appear in the navigation and on <code>/circulars</code>.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('circulars')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        features.circulars ? 'bg-amber-800' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          features.circulars ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {features.circulars ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Live Gazette Ingestion & Synchronization Command Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-4.5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="font-serif font-bold text-sm text-white">
                        e-Gazette & Statutory Repository Auto-Sync
                      </h4>
                      <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Live Feed Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Continuous statutory discovery from official Government of India portals (<code className="text-amber-300 font-mono text-[11px]">egazette.gov.in</code>, <code className="text-amber-300 font-mono text-[11px]">legislative.gov.in</code>, and Supreme Court registry). Ingested enactments include authentic government source URLs for public double-validation.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleAdminGazetteSync}
                      disabled={adminGazetteSyncing}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-70"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${adminGazetteSyncing ? 'animate-spin' : ''}`} />
                      <span>{adminGazetteSyncing ? 'Checking Feeds...' : '⚡ Sync Live e-Gazette Now'}</span>
                    </button>
                  </div>
                </div>

                {/* Admin Sync Notification Alert */}
                {adminGazetteSyncMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-150">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">{adminGazetteSyncMsg}</span>
                    </div>
                    <button
                      onClick={() => setAdminGazetteSyncMsg(null)}
                      className="text-emerald-700 hover:text-emerald-950 font-bold text-xs cursor-pointer ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Title & Reference</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5">Issuing Authority</th>
                          <th className="p-3.5">Official Source & Validation</th>
                          <th className="p-3.5">Enacted Date</th>
                          <th className="p-3.5">PDF Document</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {circulars.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5 max-w-sm">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {c.important && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500 text-white shrink-0">
                                    Landmark
                                  </span>
                                )}
                                {c.isAutoSynced && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-sky-100 text-sky-900 border border-sky-300 shrink-0">
                                    ⚡ e-Gazette
                                  </span>
                                )}
                                <span className="font-serif font-bold text-slate-900 text-xs truncate">
                                  {c.shortTitle || c.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block truncate">
                                {c.circularNumber}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="text-[10px] uppercase font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded">
                                {c.category.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-700 max-w-xs truncate">
                              {c.issuingAuthority}
                            </td>
                            <td className="p-3.5 max-w-[200px]">
                              <div className="text-[11px] font-medium text-slate-800 truncate" title={c.sourceName || 'Government of India Gazette'}>
                                {c.sourceName || 'Official Gazette'}
                              </div>
                              {c.sourceUrl ? (
                                <a
                                  href={c.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold inline-flex items-center space-x-0.5 hover:underline mt-0.5"
                                  title="Verify source on official government portal"
                                >
                                  <span>Double-Validate</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400">Institutional</span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                              {c.releaseDate}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              {c.pdfDataUrl ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <span>Uploaded PDF</span>
                                  <span className="font-mono text-[9px] text-emerald-700">({c.fileSize || 'Local'})</span>
                                </span>
                              ) : c.pdfUrl && c.pdfUrl !== '#' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                  <span>Gazette Link</span>
                                  <span className="font-mono text-[9px] text-blue-700">({c.fileSize || 'PDF'})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                  Institutional PDF
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                c.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {c.status || 'published'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={async () => {
                                  try {
                                    await pdfService.downloadCircularPdf(c);
                                  } catch (e) {
                                    alert('Error downloading circular PDF');
                                  }
                                }}
                                className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded transition-colors inline-flex cursor-pointer"
                                title="Download Official Legal PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleTogglePublish('circular', c.id)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                              >
                                {c.status === 'published' ? 'Unpublish' : 'Publish'}
                              </button>
                              <button
                                onClick={() => handleOpenEditContent('circular', c)}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors inline-flex cursor-pointer"
                                title="Edit Circular / Guidelines"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteContent('circular', c.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors inline-flex cursor-pointer"
                                title="Delete Circular"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. EVENTS TABLE */}
            {contentSubTab === 'events' && (
              <div className="space-y-4">
                {/* Section Level Toggle Banner */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        Conferences & Dialogues Section Visibility
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        features.events 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.events ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Controls whether upcoming and past conferences, roundtables, and symposia appear on the homepage and at <code>/events</code>.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('events')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        features.events ? 'bg-amber-800' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          features.events ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {features.events ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Event Title</th>
                        <th className="p-3.5">Date & Venue</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Flagship</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {events.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 max-w-sm">
                            <div className="font-serif font-bold text-slate-900 text-xs">{e.title}</div>
                            <div className="text-[10px] text-slate-500">{e.location || 'New Delhi'}</div>
                          </td>
                          <td className="p-3.5 text-slate-700">
                            <div className="font-mono text-slate-900">{e.date}</div>
                            <div className="text-[10px] text-slate-500">{e.location || 'Constitutional Club / Hybrid'}</div>
                          </td>
                          <td className="p-3.5 text-slate-600 capitalize">{e.type || (e as any).category || 'Symposium'}</td>
                          <td className="p-3.5">
                            {((e as any).isFlagship || e.id === 'evt-ucc-flagship') ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">Flagship</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              e.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {e.status || 'published'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleTogglePublish('event', e.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                            >
                              {e.status === 'published' ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleOpenEditContent('event', e)}
                              className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded transition-colors inline-flex cursor-pointer"
                              title="Edit Event"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContent('event', e.id)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors inline-flex cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

            {/* 3. RESEARCH DOMAINS (Fully Safe & Resilient) */}
            {contentSubTab === 'research' && (
              <div className="space-y-4">
                {/* Section Level Toggle Banner */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Compass className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        Research Centres & Domains Visibility
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        features.research 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.research ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Controls whether the 6 research centres appear on the homepage, navbar dropdown, and at <code>/centres</code>.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('research')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        features.research ? 'bg-amber-800' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          features.research ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {features.research ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {domains.map(d => {
                  const domainTitle = d.name || (d as any).title || 'Research Domain';
                  const leadPerson = d.leadFellow || (d as any).leadResearcher || 'Senior Fellow';
                  const themes = d.keyThemes || (d as any).focusAreas || [];

                  return (
                    <div key={d.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded uppercase font-semibold">
                              /{d.slug}
                            </span>
                            {d.sanskritName && (
                              <span className="text-[11px] font-serif text-amber-900">
                                {d.sanskritName}
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-bold text-slate-900 text-sm">{domainTitle}</h4>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleTogglePublish('research', d.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                            title="Publish / Unpublish Research Domain"
                          >
                            {d.status === 'draft' ? 'Publish' : 'Unpublish'}
                          </button>
                          <button
                            onClick={() => handleOpenEditContent('research', d)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Domain"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteContent('research', d.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors cursor-pointer"
                            title="Delete Domain"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">{d.description}</p>
                      
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">Lead: <strong className="text-slate-700">{leadPerson}</strong></span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          d.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {d.status || 'published'}
                        </span>
                      </div>

                      <div className="pt-1 flex flex-wrap gap-1">
                        {(themes || []).map((fa, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                            {fa}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

            {/* 4. ADVISORY COUNCIL & FELLOWS */}
            {contentSubTab === 'experts' && (
              <div className="space-y-4">
                {/* Section Level Toggle Banner */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        Governing Council & Fellows Section Visibility (About Page)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        features.experts 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.experts ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Controls whether Section 1 &ldquo;Who is Who: Governing Council & Advisory Board&rdquo; appears on <code>/about#who-is-who</code>.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('experts')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        features.experts ? 'bg-amber-800' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          features.experts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {features.experts ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {experts.map(exp => (
                  <div key={exp.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={exp.photoUrl} 
                          alt={exp.name} 
                          className="w-12 h-12 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="font-serif font-bold text-slate-900 text-sm">{exp.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            exp.councilRole === 'advisory_council' 
                              ? 'bg-amber-100 text-amber-900' 
                              : 'bg-blue-100 text-blue-900'
                          }`}>
                            {exp.councilRole ? exp.councilRole.replace(/_/g, ' ') : 'Fellow Scholar'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{exp.designation}</p>
                      <p className="text-slate-500 text-[11px]">{exp.institution}</p>
                      <p className="text-slate-600 text-xs line-clamp-2 italic">{exp.biography}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        exp.status === 'archived' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {exp.status === 'archived' ? 'draft' : 'published'}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleTogglePublish('expert', exp.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                        >
                          {exp.status === 'archived' ? 'Publish' : 'Unpublish'}
                        </button>
                        <button
                          onClick={() => handleOpenEditContent('expert', exp)}
                          className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded cursor-pointer"
                          title="Edit Scholar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteContent('expert', exp.id)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded cursor-pointer"
                          title="Delete Scholar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

            {/* SUB-TAB: NATIONAL TEAM MANAGEMENT */}
            {contentSubTab === 'nationalTeam' && (
              <div className="space-y-4">
                {/* Section Level Toggle Banner */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        National Executive Team Section Visibility (About Page)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        features.nationalTeam 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.nationalTeam ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Controls whether the executive leadership / national team section appears on <code>/about#national-team</code>.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('nationalTeam')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        features.nationalTeam ? 'bg-amber-800' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          features.nationalTeam ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {features.nationalTeam ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nationalTeam.map(member => (
                    <div key={member.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 inline-block">
                            {member.role}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            member.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-slate-900 text-base">{member.name}</h4>
                        <p className="text-xs font-semibold text-slate-500">{member.affiliation}</p>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{member.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Order: #{member.order || 1}</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleTogglePublish('nationalTeam', member.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer"
                          >
                            {member.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingNationalMember(member);
                              setNationalMemberModalOpen(true);
                            }}
                            className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded cursor-pointer"
                            title="Edit Leader"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNationalMember(member.id)}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded cursor-pointer"
                            title="Delete Leader"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {nationalTeam.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                    No national team members found. Click &quot;Add New National Leader&quot; to add one.
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB: STATE CHAPTERS MANAGEMENT */}
            {contentSubTab === 'stateTeam' && (
              <div className="space-y-4">
                {/* Section Level Toggle Banner */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        State Chapters Section Visibility (About Page)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        features.stateTeam 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.stateTeam ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Controls whether the regional state chapters section appears on <code>/about#state-team</code>.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('stateTeam')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        features.stateTeam ? 'bg-amber-800' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          features.stateTeam ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {features.stateTeam ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stateChapters.map(chap => (
                    <div key={chap.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 text-xs text-amber-800 font-bold truncate">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{chap.state}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            chap.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {chap.status}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-slate-900 text-sm">{chap.convener}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Base: {chap.city}</p>
                        <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100 line-clamp-2">{chap.focus}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleTogglePublish('stateTeam', chap.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          {chap.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingStateChapter(chap);
                            setStateChapterModalOpen(true);
                          }}
                          className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded cursor-pointer"
                          title="Edit Chapter"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStateChapter(chap.id)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded cursor-pointer"
                          title="Delete Chapter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {stateChapters.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                    No state chapters found. Click &quot;Add New State Chapter&quot; to add one.
                  </div>
                )}
              </div>
            )}

            {/* 5. NEWS & INSIGHTS */}
            {contentSubTab === 'news' && (
              <div className="space-y-4">
                {/* Section Level Toggle Banner */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Newspaper className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        Insights & Perspectives Section Visibility
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        features.news 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.news ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Controls whether policy insights, opinion columns, and perspectives appear in the main navigation and on <code>/news</code>.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('news')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        features.news ? 'bg-amber-800' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          features.news ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {features.news ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Title & Category</th>
                        <th className="p-3.5">Author</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newsList.map(n => (
                        <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 max-w-md">
                            <div className="font-serif font-bold text-slate-900 text-xs">{n.title}</div>
                            <span className="text-[10px] uppercase font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-0.5 inline-block">
                              {n.category || 'Discourse'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-700">{n.author || 'Editorial Desk'}</td>
                          <td className="p-3.5 text-slate-600 font-mono">{n.publishedDate || '2026-09-15'}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              n.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {n.status || 'published'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleTogglePublish('news', n.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                            >
                              {n.status === 'published' ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleOpenEditContent('news', n)}
                              className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded transition-colors inline-flex cursor-pointer"
                              title="Edit Article"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContent('news', n.id)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors inline-flex cursor-pointer"
                              title="Delete Article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

            {/* SUB-TAB: PODCASTS MANAGEMENT */}
            {contentSubTab === 'podcasts' && (
              <div className="space-y-4">
                {/* Section Level Toggle Banner */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        Podcasts & Video Dispatches Section Visibility
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        features.podcasts 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.podcasts ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Controls whether the podcasts, video dialogs, and YouTube embeds appear in the main navigation and on <code>/podcasts</code>.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('podcasts')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        features.podcasts ? 'bg-amber-800' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          features.podcasts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {features.podcasts ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Episode Title & Topic</th>
                        <th className="p-3.5">Guest / Speaker</th>
                        <th className="p-3.5">YouTube Stream</th>
                        <th className="p-3.5">Duration</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Featured</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {podcasts.map(pod => (
                        <tr key={pod.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 max-w-sm">
                            <div className="font-serif font-bold text-slate-900 text-xs">{pod.title}</div>
                            <span className="text-[10px] uppercase font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-0.5 inline-block">
                              {pod.topic}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-medium text-slate-900">{pod.speaker}</div>
                            {pod.speakerRole && (
                              <div className="text-[10px] text-slate-500 truncate max-w-xs">{pod.speakerRole}</div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2">
                              {pod.thumbnailUrl && (
                                <img
                                  src={pod.thumbnailUrl}
                                  alt=""
                                  className="w-14 h-9 object-cover rounded border border-slate-200"
                                />
                              )}
                              <a
                                href={pod.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Watch</span>
                              </a>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-600 font-mono">
                            {pod.duration}
                          </td>
                          <td className="p-3.5 text-slate-600 font-mono">
                            {pod.date}
                          </td>
                          <td className="p-3.5">
                            {pod.featured ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">Featured</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              pod.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {pod.status || 'published'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleTogglePublish('podcast', pod.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                            >
                              {pod.status === 'draft' ? 'Publish' : 'Unpublish'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingPodcast(pod);
                                setPodcastEditorOpen(true);
                              }}
                              className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded transition-colors inline-flex cursor-pointer"
                              title="Edit Episode"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePodcast(pod.id)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors inline-flex cursor-pointer"
                              title="Delete Episode"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {podcasts.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No podcast episodes found. Click &quot;Add New Podcast Episode&quot; to publish one.
                  </div>
                )}
              </div>
            </div>
          )}

            {/* SUB-TAB: MAGAZINE MANAGEMENT */}
            {contentSubTab === 'magazine' && (
              <div className="space-y-4">
                {/* Section Level Toggle Banner */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-serif font-bold text-slate-900 text-sm">
                        Bharat Review Magazine Section Visibility
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        features.magazine 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.magazine ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Controls whether the digital magazine editions, downloads, and ₹100 contribution modal appear in the main navigation and on <code>/magazine</code>.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature('magazine')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        features.magazine ? 'bg-amber-800' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          features.magazine ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {features.magazine ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Edition & Volume</th>
                        <th className="p-3.5">Theme / Focus</th>
                        <th className="p-3.5">Publication Date</th>
                        <th className="p-3.5">Pages</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Downloads</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {magazines.map(mag => (
                        <tr key={mag.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 max-w-sm">
                            <div className="font-serif font-bold text-slate-900 text-xs">{mag.title}</div>
                            <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                              {mag.issueNumber}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-700 max-w-xs truncate" title={mag.theme}>
                            {mag.theme}
                          </td>
                          <td className="p-3.5 text-slate-600 font-mono">
                            {mag.publicationDate}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {mag.pageCount} pp
                          </td>
                          <td className="p-3.5 font-bold text-slate-800">
                            ₹{mag.price}
                          </td>
                          <td className="p-3.5 font-mono text-emerald-700 font-semibold">
                            {mag.downloadCount}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              mag.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {mag.status || 'published'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleTestDownloadMagazine(mag)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors inline-flex items-center space-x-1 cursor-pointer"
                              title="Generate and Download Client-Side Compressed PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-800" />
                              <span>Test PDF</span>
                            </button>
                            <button
                              onClick={() => handleTogglePublish('magazine', mag.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                            >
                              {mag.status === 'draft' ? 'Publish' : 'Unpublish'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingMagazine(mag);
                                setMagazineEditorOpen(true);
                              }}
                              className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded transition-colors inline-flex cursor-pointer"
                              title="Edit Magazine Edition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMagazine(mag.id)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors inline-flex cursor-pointer"
                              title="Delete Magazine Edition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {magazines.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No magazine editions found. Click &quot;Add New Magazine Edition&quot; to publish one.
                  </div>
                )}
              </div>
            </div>
          )}

            {/* SUB-TAB 6: MEDIA & UPLOADS */}
            {contentSubTab === 'media' && (
              <div className="space-y-6">
                {/* Hero / Upload Studio */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <h3 className="font-serif font-bold text-slate-900 text-lg flex items-center space-x-2">
                        <UploadCloud className="w-5 h-5 text-amber-700" />
                        <span>Media Upload & Asset Manager</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Upload high-resolution images via Drag & Drop or paste any web image URL. Uploaded files are automatically optimized, converted to web-ready format, and saved to the media library for use across publications, symposia, research domains, scholar portraits, and news articles.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={loadMediaList}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                        title="Reload stored images from browser storage"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Refresh Media ({mediaList.length})</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <ImageUploadWithUrl
                      label="Upload or Link Image Asset"
                      value={activeUploadUrl}
                      onChange={(url) => {
                        setActiveUploadUrl(url);
                        loadMediaList();
                      }}
                      aspectRatio="landscape"
                      helperText="Drag & drop any image file (PNG, JPG, WebP, SVG, GIF) or enter an external image URL. Uploaded items automatically appear in the library below."
                      placeholder="https://images.unsplash.com/..."
                    />

                    {activeUploadUrl && (
                      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium truncate">
                            Active Asset URL: <code className="bg-emerald-100/70 px-1 py-0.5 rounded text-[11px] font-mono">{activeUploadUrl.substring(0, 70)}...</code>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleCopyMediaUrl(activeUploadUrl, 'active')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            {copiedMediaId === 'active' ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Asset URL</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setActiveUploadUrl('')}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium cursor-pointer transition-colors"
                          >
                            Clear / Upload Another
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stored Media Gallery */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-serif font-bold text-slate-900 text-base">
                        Media Library Assets ({mediaList.length})
                      </h4>
                      <p className="text-xs text-slate-500">
                        Click 'Copy URL' on any image to paste it directly into publication covers, event banners, scholar profiles, or article headers.
                      </p>
                    </div>
                  </div>

                  {mediaList.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-700">No media assets in library yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Drag and drop an image in the upload box above or add an image when creating/editing content to automatically build your library.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {mediaList.map((item) => (
                        <div
                          key={item.id}
                          className="group border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-amber-300 hover:shadow-md transition-all flex flex-col"
                        >
                          <div className="relative aspect-video bg-slate-100 overflow-hidden flex items-center justify-center">
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                              {item.sizeKb ? `${item.sizeKb} KB` : 'Image'}
                            </div>
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleCopyMediaUrl(item.url, item.id)}
                                className="p-2 bg-white/95 hover:bg-white text-slate-800 rounded-lg shadow-sm cursor-pointer transition-colors"
                                title="Copy Image URL"
                              >
                                {copiedMediaId === item.id ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white/95 hover:bg-white text-slate-800 rounded-lg shadow-sm cursor-pointer transition-colors"
                                title="Open full image in new tab"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteMedia(item.id)}
                                className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg shadow-sm cursor-pointer transition-colors"
                                title="Remove from Library"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-semibold text-slate-800 truncate" title={item.name}>
                                {item.name || 'Untitled Image'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Saved asset'}
                              </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <button
                                onClick={() => handleCopyMediaUrl(item.url, item.id)}
                                className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1 cursor-pointer"
                              >
                                {copiedMediaId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy URL</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteMedia(item.id)}
                                className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 7: CUSTOM TAGS & DROPDOWN OPTIONS MANAGER */}
            {contentSubTab === 'taxonomy' && (
              <TaxonomyManager />
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: COMMUNICATIONS & AUDIT LOGS */}
        {/* ============================================================== */}
        {activeTab === 'communications' && (
          <div className="space-y-4">
            
            {/* Quick Broadcast Banner */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Send className="w-4 h-4 text-amber-700" />
                  <span>Institutional Communication Gateway</span>
                </h3>
                <p className="text-slate-500 text-xs">
                  Decoupled delivery pipeline for Email & WhatsApp messages with persistent audit tracking.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={openNotifySubscribers}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold border border-amber-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-700" />
                  <span>Message All Subscribers ({subscribers.length})</span>
                </button>

                <button
                  onClick={() => {
                    const verified = registrations.filter(r => r.status === 'verified');
                    setNotifyRecipients(verified.map(r => ({
                      id: r.id,
                      name: `${r.firstName} ${r.lastName}`,
                      email: r.email,
                      phone: r.phoneNumber?.fullFormatted || '',
                      category: 'candidate',
                    })));
                    setNotifyDefaultSubject('Update for Verified Fellows • Bharat Collective Foundation');
                    setNotifyDefaultMessage('Namaste,\n\nWe are pleased to invite you to our upcoming closed-door academic colloquium.\n\nWarm regards,\nBharat Collective Secretariat');
                    setNotifyModalOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Custom Broadcast</span>
                </button>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h4 className="font-serif font-bold text-slate-900 text-sm">
                  Communications Dispatch Log ({notificationLogs.length})
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Log ID & Sent At</th>
                      <th className="p-3.5">Channel</th>
                      <th className="p-3.5">Recipients</th>
                      <th className="p-3.5">Subject / Preview</th>
                      <th className="p-3.5">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {notificationLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-amber-900 block">{log.id}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center space-x-1 ${
                            log.channel === 'whatsapp' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : log.channel === 'email' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
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
                          <div className="text-[11px] text-slate-500 italic truncate">{log.messageSnippet}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Delivered</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {notificationLogs.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400">
                  No communications logged yet. Dispatches will be recorded here.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: CALL FOR PAPERS (SUBMISSIONS) */}
        {/* ============================================================== */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {/* Section Level Toggle Banner */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-amber-800 shrink-0" />
                  <span className="font-serif font-bold text-slate-900 text-sm">
                    Call for Papers & Submissions Intake Visibility
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    features.callForPapers 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {features.callForPapers ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Controls whether the academic Call for Papers intake portal and abstract submission forms appear on <code>/contact#papers</code>.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleToggleFeature('callForPapers')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.callForPapers ? 'bg-amber-800' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.callForPapers ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700">
                  {features.callForPapers ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Top Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  Scholarly Manuscript Abstracts ({submissions.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Submissions received via Call for Papers intake portal.
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search code, title, author..."
                  value={cfpSearch}
                  onChange={e => setCfpSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white w-full sm:w-64"
                />
              </div>
            </div>

            {/* Submissions List */}
            {filteredSubmissions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-500">
                No abstracts found matching search.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubmissions.map(sub => (
                  <div key={sub.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          {sub.submissionCode}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Submitted {new Date(sub.submittedAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 font-semibold">Status:</span>
                        <select
                          value={sub.status}
                          onChange={e => handleCfpStatusChange(sub.id, e.target.value as PaperSubmissionStatus)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-slate-50 font-semibold cursor-pointer"
                        >
                          {taxonomyService.getOptions('cfp_status').map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => openNotifyAuthor(sub)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Notify Author</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-serif text-sm sm:text-base font-bold text-slate-900 mb-1">
                        {sub.paperTitle}
                      </h4>
                      <p className="text-xs text-slate-600">
                        <strong>Author:</strong> {sub.authorName} ({sub.authorEmail}) • <em>{sub.affiliation}</em>
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                      <strong className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Executive Abstract:</strong>
                      {sub.abstract}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: NEWSLETTER SUBSCRIBERS (Full Functional Experience) */}
        {/* ============================================================== */}
        {activeTab === 'newsletter' && (
          <div className="space-y-4">
            {/* Section Level Toggle Banner */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-amber-800 shrink-0" />
                  <span className="font-serif font-bold text-slate-900 text-sm">
                    Research Digest Newsletter Visibility
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    features.newsletter 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {features.newsletter ? 'Section Active (Visible)' : 'Section Disabled (Hidden)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Controls whether the newsletter subscription banner appears on the public website and footer.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleToggleFeature('newsletter')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    features.newsletter ? 'bg-amber-800' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.newsletter ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700">
                  {features.newsletter ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Top Action & Stats Bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-serif text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-amber-700" />
                  <span>Research Digest Subscriptions ({subscribers.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Subscribers receive automated welcome email on signup and monthly policy updates.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAddSub(!showAddSub)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-600" />
                  <span>Add Subscriber</span>
                </button>

                <button
                  onClick={handleExportSubscribersCsv}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={openNotifySubscribers}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Update to All</span>
                </button>
              </div>
            </div>

            {/* Quick Add Subscriber Drawer if open */}
            {showAddSub && (
              <form onSubmit={handleAddSubscriberSubmit} className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
                <div className="flex-1 min-w-[240px]">
                  <input
                    type="email"
                    required
                    placeholder="Enter scholar email address (e.g. professor@jnu.ac.in)..."
                    value={newSubEmail}
                    onChange={e => setNewSubEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white transition-colors cursor-pointer"
                >
                  Save Subscription
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSub(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter subscriber emails..."
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white w-full"
                />
              </div>

              <span className="text-xs text-slate-500">
                Showing <strong>{filteredSubscribers.length}</strong> of <strong>{subscribers.length}</strong> subscribers
              </span>
            </div>

            {/* Subscribers Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Subscriber Email</th>
                      <th className="p-3.5">Subscribed At</th>
                      <th className="p-3.5">Acquisition Source</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubscribers.map((s, idx) => (
                      <tr key={s.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-medium text-slate-900">{s.email}</td>
                        <td className="p-3.5 text-slate-600 font-mono">
                          {new Date(s.subscribedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                            {s.source || 'website-footer'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setNotifyRecipients([{
                                id: s.id || `sub-${idx}`,
                                name: s.email.split('@')[0],
                                email: s.email,
                                phone: '',
                                category: 'subscriber',
                              }]);
                              setNotifyDefaultSubject('Update from Bharat Collective Foundation');
                              setNotifyDefaultMessage(`Namaste,\n\nWe are pleased to share our latest research brief with you.\n\nWarm regards,\nBharat Collective Secretariat`);
                              setNotifyModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded text-xs font-semibold transition-colors cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Notify</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSubscriber(s.id, s.email)}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors inline-flex cursor-pointer"
                            title="Remove Subscriber"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredSubscribers.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400">
                  No subscribers match your search.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: SECURITY & 2FA SETTINGS + EMAIL GATEWAY */}
        {/* ============================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Security Status Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Administrative Security & Access Center</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  Credentials, 2FA Protection & Email Delivery
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Manage administrator credentials, configure Two-Factor Authentication (2FA) enforcement, and set up the email delivery gateway so notification emails are dispatched properly.
                </p>
              </div>

              <div className="flex items-center space-x-3 bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80 flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${cred2faEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
                <div className="text-xs">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">2FA Security Status</div>
                  <div className="font-bold text-white">
                    {cred2faEnabled ? '2FA ACTIVE (PROTECTED)' : '2FA DISABLED'}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Alert Banner */}
            {credStatusMsg && (
              <div className={`p-4 rounded-xl flex items-center space-x-2.5 text-xs font-semibold animate-in fade-in duration-200 ${
                credStatusMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}>
                {credStatusMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                <span>{credStatusMsg.text}</span>
              </div>
            )}

            {/* Feature Flags & Module Visibility Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                    <Sliders className="w-4 h-4" />
                    <span>Public Feature Flags & Module Visibility</span>
                  </div>
                  <h3 className="font-serif font-bold text-slate-900 text-lg">
                    Website Section Toggles
                  </h3>
                  <p className="text-xs text-slate-500 max-w-2xl">
                    Configure which specialized sections appear in the public navigation and footer. Changes take effect immediately across all visitors without redeploying code.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Governing Council & Advisory Board */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Governing Council & Advisory Board
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.experts ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.experts ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls Section 1 &ldquo;Who is Who: Governing Council & Advisory Board&rdquo; on <code>/about#who-is-who</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('experts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.experts ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.experts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 2. National Executive Team */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        National Executive Team Section
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.nationalTeam ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.nationalTeam ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls Section 2 &ldquo;National Executive Team&rdquo; on the public About page at <code>/about#national-team</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('nationalTeam')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.nationalTeam ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.nationalTeam ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 3. State Chapters */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        State Team & Regional Chapters Section
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.stateTeam ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.stateTeam ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls Section 3 &ldquo;State Team & Regional Chapters&rdquo; on the public About page at <code>/about#state-team</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('stateTeam')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.stateTeam ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.stateTeam ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 4. Publications */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Publications & Research Monographs
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.publications ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.publications ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls research papers repository in main navigation, homepage featured studies, and <code>/publications</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('publications')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.publications ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.publications ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 5. Circulars & Legal Materials */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Scale className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Circulars & Legal Materials
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.circulars ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.circulars ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Official gazettes & legal notifications. Controls presence in navigation and <code>/circulars</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('circulars')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.circulars ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.circulars ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 6. Events */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Conferences & Dialogues (Events)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.events ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.events ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls upcoming conferences, symposia, and roundtables in navigation, homepage, and <code>/events</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('events')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.events ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.events ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 7. Research Centres */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Compass className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Research Centres & Working Domains
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.research ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.research ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls the 6 specialized research centres across homepage, navbar dropdown, and <code>/centres</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('research')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.research ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.research ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 8. News / Insights */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Newspaper className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Insights & Perspectives (Articles)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.news ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.news ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls policy insights, opinion columns, and perspectives in the main navigation and <code>/news</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('news')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.news ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.news ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 9. Podcasts */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Podcasts & Video Dispatches
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.podcasts ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.podcasts ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Interactive video dialogs and YouTube embed cards located at <code>/podcasts</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('podcasts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.podcasts ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.podcasts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 10. Magazine */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Magazine (Bharat Review)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.magazine ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.magazine ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Quarterly digital magazine with ₹100 contribution modal and client-side PDF engine at <code>/magazine</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('magazine')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.magazine ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.magazine ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 11. Careers */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Career & Internship Applications
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.careers ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.careers ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Internship and job application form with strict 1 MB PDF CV upload at <code>/careers</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('careers')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.careers ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.careers ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 12. Call for Papers */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Send className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Call for Papers & Submissions Intake
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.callForPapers ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.callForPapers ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Academic manuscript abstract submission portal and tracking located at <code>/contact#papers</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('callForPapers')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.callForPapers ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.callForPapers ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 13. Donations & Support */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Donations & Patronage Gateway
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.donations ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.donations ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls &ldquo;Support Us&rdquo; action button in navbar, homepage contribution callout, and <code>/support-us</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('donations')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.donations ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.donations ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 14. Member Registration */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Scholar & Member Registration
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.userRegistration ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.userRegistration ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls &ldquo;Join Us&rdquo; button in navbar, homepage intake section, and registration portal at <code>/register</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('userRegistration')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.userRegistration ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.userRegistration ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 15. Newsletter */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Research Digest Newsletter
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.newsletter ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.newsletter ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls the newsletter signup banner on the homepage and site-wide footer subscription box.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('newsletter')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.newsletter ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.newsletter ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 16. Flagship Announcement Ticker */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Megaphone className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">
                        Flagship Dialogue Announcement Ticker
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        features.flagshipBanner ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {features.flagshipBanner ? 'Live on Site' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Controls the top announcement bar running across all pages above the main navigation header.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('flagshipBanner')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.flagshipBanner ? 'bg-amber-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      features.flagshipBanner ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* CARD 1: UPDATE CREDENTIALS */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-5 h-5 text-amber-700" />
                    <h3 className="font-serif font-bold text-base text-slate-900">Administrator Credentials</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                    {session?.user?.email}
                  </span>
                </div>

                <form onSubmit={handleSaveCredentials} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Administrator Full Name
                    </label>
                    <input
                      type="text"
                      value={credEditName}
                      onChange={(e) => setCredEditName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Administrator Login Email Address
                    </label>
                    <input
                      type="email"
                      value={credEditEmail}
                      onChange={(e) => setCredEditEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600 font-mono bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        New Password <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="password"
                        value={credNewPassword}
                        onChange={(e) => setCredNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={credConfirmPassword}
                        onChange={(e) => setCredConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        disabled={!credNewPassword}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600 disabled:bg-slate-50 bg-white"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                    <label className="block text-xs font-bold text-amber-900">
                      Authorization: Enter Current Password
                    </label>
                    <input
                      type="password"
                      value={credCurrentPassword}
                      onChange={(e) => setCredCurrentPassword(e.target.value)}
                      placeholder="Enter current password to authorize changes"
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600"
                    />
                    <div className="text-[11px] text-amber-800 flex items-center justify-between">
                      <span>Default Demo: <code className="font-bold text-amber-950 font-mono">BharatAdmin@2026</code></span>
                      <button
                        type="button"
                        onClick={() => setCredCurrentPassword(adminCreds.password)}
                        className="underline text-[10px] text-amber-900 hover:text-amber-950 font-semibold cursor-pointer"
                      >
                        Auto-fill
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Save & Apply Updates</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetToDefaults}
                      className="text-xs text-slate-500 hover:text-red-700 underline font-medium cursor-pointer"
                    >
                      Reset to Default Credentials
                    </button>
                  </div>
                </form>
              </div>

              {/* CARD 2: TWO-FACTOR AUTHENTICATION (2FA) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-amber-700" />
                    <h3 className="font-serif font-bold text-base text-slate-900">Two-Factor Authentication (2FA)</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    cred2faEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cred2faEnabled ? 'Enforced' : 'Disabled'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Enforce 2FA on Admin Login</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Requires a second-step 6-digit OTP verification code when logging in.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cred2faEnabled}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setCred2faEnabled(val);
                          authService.updateAdminCredentials({ twoFactorEnabled: val });
                          setAdminCreds(authService.getAdminCredentials());
                          setCredStatusMsg({
                            type: 'success',
                            text: `Two-Factor Authentication (2FA) is now ${val ? 'ENABLED' : 'DISABLED'}.`,
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-700"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary 2FA Verification Channel
                    </label>
                    <select
                      value={cred2faMethod}
                      onChange={(e) => {
                        const method = e.target.value as 'email_otp' | 'authenticator_app';
                        setCred2faMethod(method);
                        authService.updateAdminCredentials({ twoFactorMethod: method });
                        setAdminCreds(authService.getAdminCredentials());
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600 bg-white"
                    >
                      <option value="email_otp">Email One-Time Passcode (OTP to Admin Email)</option>
                      <option value="authenticator_app">Authenticator App (Google Authenticator / Authy / TOTP)</option>
                    </select>
                  </div>

                  {/* Secret Key & Testing Simulator */}
                  <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-400">2FA Secret Key (RFC 6238 TOTP):</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(adminCreds.twoFactorSecret || 'BHARAT-2FA-SEC-2026');
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                      </button>
                    </div>

                    <div className="font-mono text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center tracking-wider text-amber-300 font-bold">
                      {adminCreds.twoFactorSecret || 'BHARAT-2FA-SEC-2026'}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-[11px]">
                      <span className="text-slate-400">
                        Universal Dev Bypass Code: <strong className="font-mono text-emerald-400">123456</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleTrigger2faTest}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                      >
                        Test 2FA Simulator Code
                      </button>
                    </div>

                    {simulated2faCode && (
                      <div className="bg-emerald-950/80 border border-emerald-500/40 p-2.5 rounded-lg text-emerald-200 text-xs text-center animate-in fade-in">
                        Active Simulation Code: <strong className="font-mono text-base text-white tracking-widest">{simulated2faCode}</strong> (Expires in 5 min)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 3: EMAIL DELIVERY GATEWAY & WEBHOOK CONFIGURATION */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 lg:col-span-2">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-amber-700" />
                    <div>
                      <h3 className="font-serif font-bold text-base text-slate-900">
                        Email Delivery Gateway & Webhook Integration
                      </h3>
                      <p className="text-xs text-slate-500">
                        Manage newsletter subscription confirmations and external email forwarding.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                    Active Mode: {gatewayConfig.provider.toUpperCase()}
                  </span>
                </div>

                {/* Educational Callout */}
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 text-xs text-amber-950 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-amber-900">
                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>Why don't subscriber emails arrive in real Gmail/Outlook inboxes automatically?</span>
                  </div>
                  <p className="leading-relaxed text-amber-900/90">
                    This web application is currently executing client-side in your web browser. Browsers enforce security boundaries that prevent opening raw TCP sockets for SMTP mail transmission (ports 25, 465, or 587).
                  </p>
                  <p className="leading-relaxed text-amber-900/90">
                    <strong>How we solved this:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-amber-900">
                    <li>
                      <strong>On-Screen Letterhead Preview:</strong> Whenever someone subscribes in the website footer, an instant "View Received Welcome Email" interactive modal displays the official letterhead and message.
                    </li>
                    <li>
                      <strong>Admin Communications Log:</strong> Every generated confirmation is logged in the <em>Communications & Logs</em> tab.
                    </li>
                    <li>
                      <strong>Live Webhook Gateway:</strong> Enter a webhook endpoint below (e.g., Zapier, Make, Formspree, Resend, or your custom server) to forward real emails directly to personal inboxes!
                    </li>
                  </ul>
                </div>

                {/* Gateway Settings Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Dispatch Mode
                    </label>
                    <select
                      value={gatewayConfig.provider}
                      onChange={(e) => {
                        const newProvider = e.target.value as 'simulation' | 'webhook' | 'mailto';
                        const updated = notificationService.updateEmailGatewayConfig({ provider: newProvider });
                        setGatewayConfig(updated);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600 bg-white"
                    >
                      <option value="simulation">Browser Simulation + Letterhead Modal (Local Default)</option>
                      <option value="webhook">Live Webhook API (Zapier / Make / Formspree / Resend)</option>
                      <option value="mailto">Native Mail Client Bridge (mailto:)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sender Name Display
                    </label>
                    <input
                      type="text"
                      value={gatewayConfig.senderName}
                      onChange={(e) => {
                        const updated = notificationService.updateEmailGatewayConfig({ senderName: e.target.value });
                        setGatewayConfig(updated);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sender Email Address
                    </label>
                    <input
                      type="email"
                      value={gatewayConfig.senderEmail}
                      onChange={(e) => {
                        const updated = notificationService.updateEmailGatewayConfig({ senderEmail: e.target.value });
                        setGatewayConfig(updated);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-600 focus:border-amber-600 font-mono bg-white"
                    />
                  </div>
                </div>

                {/* Webhook URL Input */}
                {gatewayConfig.provider === 'webhook' && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                    <label className="block text-xs font-bold text-slate-800">
                      Webhook POST URL (Receives JSON payload on subscription & notifications)
                    </label>
                    <input
                      type="url"
                      value={gatewayConfig.webhookUrl}
                      onChange={(e) => {
                        const updated = notificationService.updateEmailGatewayConfig({ webhookUrl: e.target.value });
                        setGatewayConfig(updated);
                      }}
                      placeholder="e.g. https://formspree.io/f/your_id or https://hooks.zapier.com/hooks/catch/..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:ring-1 focus:ring-amber-600 focus:border-amber-600"
                    />
                    <p className="text-[11px] text-slate-500">
                      When a user subscribes, a POST request containing subject, recipient, body, and timestamp is delivered to this URL.
                    </p>
                  </div>
                )}

                {/* Send Live Test Email to Personal Inbox */}
                <div className="bg-slate-100/80 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 w-full md:w-auto">
                    <span className="font-bold text-xs text-slate-900 block">
                      Test Dispatcher: Send Test Verification Email
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Enter your personal email to test dispatch and verify the communication pipeline.
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 w-full md:w-auto">
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="Enter personal email (e.g. user@gmail.com)"
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white w-full sm:w-64 focus:ring-1 focus:ring-amber-600 focus:border-amber-600"
                    />
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={testEmailLoading || !testEmailAddress}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1 flex-shrink-0 cursor-pointer"
                    >
                      <SendHorizontal className="w-3.5 h-3.5" />
                      <span>{testEmailLoading ? 'Sending...' : 'Send Test'}</span>
                    </button>
                  </div>
                </div>

                {testEmailStatus && (
                  <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    {testEmailStatus}
                  </p>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Candidate Dossier Detail Modal */}
      <RegistrationDetailModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
        onStatusChange={handleRegStatusChange}
        onOpenNotify={openNotifySingle}
      />

      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        recipients={notifyRecipients}
        defaultSubject={notifyDefaultSubject}
        defaultMessage={notifyDefaultMessage}
        onSuccess={loadAllData}
      />

      {/* Content Editor Modal (CRUD) */}
      <ContentEditorModal
        isOpen={contentEditorOpen}
        type={editorType}
        initialData={editingItem}
        onClose={() => setContentEditorOpen(false)}
        onSave={handleSaveContent}
      />

      {/* Career Application Dossier Detail Modal */}
      <CareerDetailModal
        record={viewingCareerRecord}
        onClose={() => setViewingCareerRecord(null)}
        onStatusChange={handleCareerStatusChange}
      />

      {/* Podcast Editor Modal */}
      <PodcastEditorModal
        isOpen={podcastEditorOpen}
        initialData={editingPodcast}
        onClose={() => {
          setPodcastEditorOpen(false);
          setEditingPodcast(null);
        }}
        onSave={handleSavePodcast}
      />

      {/* Magazine Editor Modal */}
      <MagazineEditorModal
        isOpen={magazineEditorOpen}
        initialData={editingMagazine}
        onClose={() => {
          setMagazineEditorOpen(false);
          setEditingMagazine(null);
        }}
        onSave={handleSaveMagazine}
      />

      {/* Admin Universal Search Modal */}
      <AdminSearchModal
        isOpen={adminSearchModalOpen}
        onClose={() => setAdminSearchModalOpen(false)}
        registrations={registrations}
        careerApplications={careerApplications}
        publications={publications}
        circulars={circulars}
        events={events}
        domains={domains}
        experts={experts}
        nationalTeam={nationalTeam}
        stateChapters={stateChapters}
        podcasts={podcasts}
        magazines={magazines}
        subscribers={subscribers}
        submissions={submissions}
        onSelectResult={handleAdminSearchResult}
      />

      {/* National Member Editor Modal */}
      <NationalMemberModal
        isOpen={nationalMemberModalOpen}
        initialData={editingNationalMember}
        onClose={() => {
          setNationalMemberModalOpen(false);
          setEditingNationalMember(null);
        }}
        onSave={handleSaveNationalMember}
      />

      {/* State Chapter Editor Modal */}
      <StateChapterModal
        isOpen={stateChapterModalOpen}
        initialData={editingStateChapter}
        onClose={() => {
          setStateChapterModalOpen(false);
          setEditingStateChapter(null);
        }}
        onSave={handleSaveStateChapter}
      />

    </div>
  );
};
