import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  BookOpen, 
  Calendar, 
  Compass, 
  UserCheck, 
  Newspaper,
  Upload,
  Sparkles,
  BellRing,
  Image as ImageIcon,
  Scale,
  FileText
} from 'lucide-react';
import { Publication, PublicationCategory, ContentStatus } from '../../types/publication';
import { Circular, CircularCategory, CircularStatus } from '../../types/circular';
import { EventItem, EventCategory } from '../../types/event';
import { ResearchDomain } from '../../types/research';
import { ScholarExpert, ExpertRole } from '../../types/expert';
import { NewsArticle } from '../../types/news';
import { ImageUploadWithUrl } from './ImageUploadWithUrl';
import { PdfUploadWithUrl } from './PdfUploadWithUrl';

export type ContentEntityType = 'publication' | 'circular' | 'event' | 'research' | 'expert' | 'news';

interface ContentEditorModalProps {
  isOpen: boolean;
  type: ContentEntityType;
  initialData?: any | null; // existing record if editing, null if creating
  onClose: () => void;
  onSave: (type: ContentEntityType, data: any, notifyUsers: boolean) => Promise<void>;
}

export const ContentEditorModal: React.FC<ContentEditorModalProps> = ({
  isOpen,
  type,
  initialData,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialData?.id);
  const [notifyUsers, setNotifyUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states initialized according to entity type
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (initialData) {
      const mapped = { ...initialData };
      if (type === 'research') {
        mapped.title = initialData.title || initialData.name || '';
        mapped.leadResearcher = initialData.leadResearcher || initialData.leadFellow || '';
        mapped.focusAreas = initialData.focusAreas || initialData.keyThemes || [];
      } else if (type === 'event') {
        mapped.category = initialData.category || initialData.type || 'Symposium';
        mapped.venue = initialData.venue || initialData.location || '';
      } else if (type === 'publication') {
        mapped.publicationDate = initialData.publicationDate || initialData.publishedDate || new Date().toISOString().split('T')[0];
      } else if (type === 'circular') {
        mapped.keyProvisions = Array.isArray(initialData.keyProvisions)
          ? initialData.keyProvisions.join('\n')
          : (initialData.keyProvisions || '');
        mapped.tags = Array.isArray(initialData.tags)
          ? initialData.tags.join(', ')
          : (initialData.tags || '');
      }
      setFormData(mapped);
    } else {
      // Default initial states based on type
      if (type === 'circular') {
        setFormData({
          title: '',
          shortTitle: '',
          circularNumber: `BCF-LEG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          category: 'guidelines' as CircularCategory,
          issuingAuthority: 'Bharat Collective Legal Secretariat',
          releaseDate: new Date().toISOString().split('T')[0],
          effectiveDate: new Date().toISOString().split('T')[0],
          summary: '',
          keyProvisions: '§ 1. Institutional Governance Scope\n§ 2. Procedural Guidelines & Standard Operating Procedures\n§ 3. Statutory Compliance and Redressal',
          pdfUrl: '',
          pdfDataUrl: '',
          fileName: 'Official_Circular.pdf',
          fileSize: '1.2 MB',
          pageCount: 16,
          language: 'English',
          important: false,
          status: 'published' as CircularStatus,
          tags: 'Legal, Guidelines, Policy, Constitution',
          contentPreview: ''
        });
      } else if (type === 'publication') {
        setFormData({
          title: '',
          authors: 'Dr. Scholar Name',
          category: 'Monograph' as PublicationCategory,
          abstract: '',
          publicationDate: new Date().toISOString().split('T')[0],
          doi: '10.5281/zenodo.' + Math.floor(1000000 + Math.random() * 9000000),
          featured: false,
          status: 'published' as ContentStatus,
          tags: 'Dharma, Policy, Governance',
          coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        });
      } else if (type === 'event') {
        setFormData({
          title: '',
          category: 'Symposium' as EventCategory,
          date: '2026-10-15',
          time: '10:00 AM – 4:30 PM IST',
          location: 'New Delhi & Hybrid Live-Stream',
          venue: 'Vigyan Bhawan / India International Centre',
          description: '',
          isOnline: true,
          isFlagship: false,
          registrationOpen: true,
          capacity: 250,
          status: 'published' as ContentStatus,
          imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
        });
      } else if (type === 'research') {
        setFormData({
          title: '',
          slug: '',
          description: '',
          focusAreas: 'Civilizational Governance, Constitutional Jurisprudence, Indic Ethics',
          leadResearcher: 'Prof. Senior Scholar',
          iconName: 'BookOpen',
          status: 'published' as ContentStatus,
        });
      } else if (type === 'expert') {
        setFormData({
          name: '',
          designation: 'Senior Research Fellow',
          institution: 'Bharat Collective Foundation & Former Academic Chair',
          biography: '',
          focusAreas: 'Constitutional History, Dharma Shastra, Public Policy',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          publicationsCount: 12,
          councilRole: 'senior_fellow' as ExpertRole,
          status: 'active',
        });
      } else if (type === 'news') {
        setFormData({
          title: '',
          slug: '',
          category: 'Discourse',
          excerpt: '',
          content: '',
          author: 'Bharat Collective Editorial Desk',
          authorTitle: 'Policy & Research Secretariat',
          publishedDate: new Date().toISOString().split('T')[0],
          readTime: '4 min read',
          imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
          status: 'published' as ContentStatus,
        });
      }
    }
  }, [type, initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Process comma separated lists to arrays
      const payload = { ...formData };
      if (typeof payload.authors === 'string') {
        payload.authors = payload.authors.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (typeof payload.focusAreas === 'string') {
        payload.focusAreas = payload.focusAreas.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (typeof payload.tags === 'string') {
        payload.tags = payload.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      if (type === 'research') {
        const dTitle = payload.title || payload.name || 'Research Domain';
        payload.title = dTitle;
        payload.name = dTitle;
        payload.leadFellow = payload.leadResearcher || payload.leadFellow || 'Senior Fellow';
        payload.leadResearcher = payload.leadFellow;
        const themes = Array.isArray(payload.focusAreas) ? payload.focusAreas : [];
        payload.keyThemes = themes;
        payload.focusAreas = themes;
        if (!payload.slug) {
          payload.slug = dTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
      } else if (type === 'event') {
        payload.type = payload.category || payload.type || 'Symposium';
        payload.category = payload.type;
        payload.mode = payload.isOnline ? 'Hybrid' : 'In-Person';
        if (!payload.speakers) {
          payload.speakers = [{ name: 'Senior Council Jurist', affiliation: 'Bharat Collective', role: 'Keynote Speaker' }];
        }
      } else if (type === 'publication') {
        payload.publishedDate = payload.publicationDate || payload.publishedDate || new Date().toISOString().split('T')[0];
        payload.publicationDate = payload.publishedDate;
        if (!payload.pages) payload.pages = 32;
        if (!payload.authors || payload.authors.length === 0) payload.authors = ['Editorial Desk'];
      } else if (type === 'circular') {
        payload.shortTitle = payload.shortTitle || payload.title;
        if (typeof payload.keyProvisions === 'string') {
          payload.keyProvisions = payload.keyProvisions.split('\n').map((s: string) => s.trim()).filter(Boolean);
        }
        if (typeof payload.tags === 'string') {
          payload.tags = payload.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        if (!payload.pageCount) payload.pageCount = 12;
        if (!payload.fileName) payload.fileName = `${(payload.shortTitle || 'Circular').replace(/\s+/g, '_')}.pdf`;
      }

      await onSave(type, payload, notifyUsers);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save item. Please verify fields.');
    } finally {
      setSaving(false);
    }
  };

  const getModalTitle = () => {
    const action = isEditing ? 'Edit' : 'Create / Add New';
    switch (type) {
      case 'circular': return `${action} Circular / Legal Guideline`;
      case 'publication': return `${action} Research Publication / Monograph`;
      case 'event': return `${action} Symposium / Dialogue Event`;
      case 'research': return `${action} Research Domain / Center`;
      case 'expert': return `${action} Advisory Council & Fellow Scholar`;
      case 'news': return `${action} News Article & Insight Perspective`;
      default: return `${action} Content`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              {type === 'circular' && <Scale className="w-5 h-5" />}
              {type === 'publication' && <BookOpen className="w-5 h-5" />}
              {type === 'event' && <Calendar className="w-5 h-5" />}
              {type === 'research' && <Compass className="w-5 h-5" />}
              {type === 'expert' && <UserCheck className="w-5 h-5" />}
              {type === 'news' && <Newspaper className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white">
                {getModalTitle()}
              </h3>
              <p className="text-[11px] text-slate-400">
                Changes will reflect reactively across the public Bharat Collective website
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs">
              {error}
            </div>
          )}

          {/* 0. CIRCULAR & LEGAL FIELDS */}
          {type === 'circular' && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-slate-900">Document Full Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. The Constitution of India (With Preamble & Key Amendments)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Short / Citation Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.shortTitle || ''}
                    onChange={e => setFormData({ ...formData, shortTitle: e.target.value })}
                    placeholder="e.g. Constitution of India"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Document Category *</label>
                  <select
                    value={formData.category || 'guidelines'}
                    onChange={e => setFormData({ ...formData, category: e.target.value as CircularCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                  >
                    <option value="constitution">Constitutional Framework & Amendment</option>
                    <option value="acts_statutes">Central Act & Statutory Code</option>
                    <option value="circulars_rules">Administrative Circular & Rules</option>
                    <option value="guidelines">Legal Guideline & Advisory</option>
                    <option value="model_bills">Model Legislative Bill & Blueprint</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Gazette Ref / Circular Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.circularNumber || ''}
                    onChange={e => setFormData({ ...formData, circularNumber: e.target.value })}
                    placeholder="e.g. Act No. 45 of 2023 • Gazette Ext. Part II"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Issuing Authority / Ministry *</label>
                  <input
                    type="text"
                    required
                    value={formData.issuingAuthority || ''}
                    onChange={e => setFormData({ ...formData, issuingAuthority: e.target.value })}
                    placeholder="e.g. Ministry of Law & Justice, Govt. of India"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Release / Gazette Date</label>
                  <input
                    type="date"
                    value={formData.releaseDate || ''}
                    onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Effective Date</label>
                  <input
                    type="date"
                    value={formData.effectiveDate || ''}
                    onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Official Language</label>
                  <select
                    value={formData.language || 'English'}
                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Bilingual">Bilingual (English + Hindi)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Statement of Objects & Scope *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.summary || ''}
                  onChange={e => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Comprehensive summary of legislative scope, historical context, constitutional background..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Key Statutory Provisions (One item per line)</label>
                <textarea
                  rows={3}
                  value={formData.keyProvisions || ''}
                  onChange={e => setFormData({ ...formData, keyProvisions: e.target.value })}
                  placeholder="§ 1. Preamble & Constitutional Foundation&#10;§ 2. Fundamental Rights and Judicial Review&#10;§ 3. Directive Principles of State Policy"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
                />
              </div>

              {/* Drag & Drop PDF Document Zone */}
              <PdfUploadWithUrl
                label="Official Document PDF (Drag & Drop or Gazette URL)"
                value={formData.pdfDataUrl || formData.pdfUrl || ''}
                fileName={formData.fileName}
                fileSize={formData.fileSize}
                onChange={({ url, fileName, fileSize, pageCount }) => {
                  setFormData({
                    ...formData,
                    pdfDataUrl: url.startsWith('data:') ? url : '',
                    pdfUrl: url.startsWith('data:') ? '' : url,
                    fileName: fileName || formData.fileName,
                    fileSize: fileSize || formData.fileSize,
                    pageCount: pageCount || formData.pageCount || 12,
                  });
                }}
                helperText="Upload official PDF file or link external gazette document"
              />

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Taxonomy & Citation Tags (Comma separated)</label>
                <input
                  type="text"
                  value={formData.tags || ''}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Constitution, Article 44, Criminal Code, Bare Act"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="important-circ"
                  checked={Boolean(formData.important)}
                  onChange={e => setFormData({ ...formData, important: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="important-circ" className="text-xs font-medium text-slate-800">
                  Pin as Landmark / Priority Legal Document
                </label>
              </div>
            </>
          )}

          {/* 1. PUBLICATION FIELDS */}
          {type === 'publication' && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-slate-900">Publication Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Dharma, Artha and the Modern Indian State"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Category</label>
                  <select
                    value={formData.category || 'monograph'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <option value="monograph">Monograph</option>
                    <option value="policy_brief">Policy Brief</option>
                    <option value="research_paper">Research Paper</option>
                    <option value="commentary">Commentary</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Author(s) (comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(formData.authors) ? formData.authors.join(', ') : formData.authors || ''}
                    onChange={e => setFormData({ ...formData, authors: e.target.value })}
                    placeholder="Prof. A. Someshwar, Dr. M. Sundaram"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Executive Abstract *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.abstract || ''}
                  onChange={e => setFormData({ ...formData, abstract: e.target.value })}
                  placeholder="Comprehensive summary of research findings, methodology, and policy recommendations..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">DOI / Persistent Identifier</label>
                  <input
                    type="text"
                    value={formData.doi || ''}
                    onChange={e => setFormData({ ...formData, doi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Publication Date</label>
                  <input
                    type="date"
                    value={formData.publicationDate || ''}
                    onChange={e => setFormData({ ...formData, publicationDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Status</label>
                  <select
                    value={formData.status || 'published'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <ImageUploadWithUrl
                label="Monograph / Publication Cover Image (Drag & Drop or URL)"
                value={formData.coverImageUrl || formData.imageUrl || ''}
                onChange={url => setFormData({ ...formData, coverImageUrl: url, imageUrl: url })}
                aspectRatio="portrait"
                helperText="Drag & drop cover book art or paste external URL"
                placeholder="https://..."
              />

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-pub"
                  checked={Boolean(formData.featured)}
                  onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="featured-pub" className="text-xs font-medium text-slate-800">
                  Feature this publication prominently on the Homepage
                </label>
              </div>
            </>
          )}

          {/* 2. EVENT FIELDS */}
          {type === 'event' && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-slate-900">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. National Symposium on Epistemic De-colonization"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Category</label>
                  <select
                    value={formData.category || 'symposium'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <option value="symposium">Symposium</option>
                    <option value="roundtable">Roundtable</option>
                    <option value="colloquium">Colloquium</option>
                    <option value="lecture">Public Lecture</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Time</label>
                  <input
                    type="text"
                    value={formData.time || ''}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    placeholder="10:00 AM – 4:00 PM IST"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">City / Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="New Delhi, India"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Venue</label>
                  <input
                    type="text"
                    value={formData.venue || ''}
                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Vigyan Bhawan / Hybrid Online"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Event Overview & Rationale</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of dialogue themes, key speakers, and agenda..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isFlagship)}
                    onChange={e => setFormData({ ...formData, isFlagship: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Flagship Event</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isOnline)}
                    onChange={e => setFormData({ ...formData, isOnline: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Live Streamed</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.registrationOpen)}
                    onChange={e => setFormData({ ...formData, registrationOpen: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Registration Open</span>
                </label>

                <div className="space-y-0.5">
                  <select
                    value={formData.status || 'published'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <ImageUploadWithUrl
                label="Event Banner / Poster (Drag & Drop or URL)"
                value={formData.imageUrl || formData.bannerImage || ''}
                onChange={url => setFormData({ ...formData, imageUrl: url, bannerImage: url })}
                aspectRatio="landscape"
                helperText="Drag & drop symposium banner or paste event poster image URL"
                placeholder="https://..."
              />
            </>
          )}

          {/* 3. RESEARCH DOMAIN FIELDS */}
          {type === 'research' && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-slate-900">Research Domain Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Indic Epistemic Systems & Philosophy of Science"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Lead Researcher / Chair</label>
                <input
                  type="text"
                  value={formData.leadResearcher || ''}
                  onChange={e => setFormData({ ...formData, leadResearcher: e.target.value })}
                  placeholder="Dr. Scholar Name, Senior Fellow"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Thematic Mandate & Description</label>
                <textarea
                  rows={4}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Thematic core, research methodology, and contemporary applications..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Focus Areas (comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.focusAreas) ? formData.focusAreas.join(', ') : formData.focusAreas || ''}
                  onChange={e => setFormData({ ...formData, focusAreas: e.target.value })}
                  placeholder="Nyaya, Epistemology, Computational Panini"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <ImageUploadWithUrl
                label="Research Domain Banner (Drag & Drop or URL)"
                value={formData.bannerImage || formData.imageUrl || ''}
                onChange={url => setFormData({ ...formData, bannerImage: url, imageUrl: url })}
                aspectRatio="landscape"
                helperText="Optional thematic banner for the research domain"
                placeholder="https://..."
              />
            </>
          )}

          {/* 4. EXPERT / ADVISORY COUNCIL / FELLOW FIELDS */}
          {type === 'expert' && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-slate-900">Scholar Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Prof. Ananya Someshwar"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Council / Fellowship Role</label>
                  <select
                    value={formData.councilRole || 'advisory_council'}
                    onChange={e => setFormData({ ...formData, councilRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                  >
                    <option value="advisory_council">Advisory Council Member</option>
                    <option value="senior_fellow">Senior Research Fellow</option>
                    <option value="visiting_fellow">Visiting Research Scholar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Designation / Role Title</label>
                  <input
                    type="text"
                    value={formData.designation || ''}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Senior Fellow & Chair, Statecraft Initiative"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Academic / Institutional Affiliation</label>
                <input
                  type="text"
                  value={formData.institution || ''}
                  onChange={e => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="Former Professor, National Law School of India University"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Scholarly Biography</label>
                <textarea
                  rows={3}
                  value={formData.biography || ''}
                  onChange={e => setFormData({ ...formData, biography: e.target.value })}
                  placeholder="Distinguished career highlights, publications, and advisory appointments..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Focus Areas (comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.focusAreas) ? formData.focusAreas.join(', ') : formData.focusAreas || ''}
                  onChange={e => setFormData({ ...formData, focusAreas: e.target.value })}
                  placeholder="Rajadharma, Comparative Law"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <ImageUploadWithUrl
                label="Scholar Portrait Photo (Drag & Drop or URL)"
                value={formData.photoUrl || formData.avatarUrl || ''}
                onChange={url => setFormData({ ...formData, photoUrl: url, avatarUrl: url })}
                aspectRatio="square"
                helperText="Upload scholar headshot portrait or paste image link"
                placeholder="https://..."
              />
            </>
          )}

          {/* 5. NEWS & INSIGHTS FIELDS */}
          {type === 'news' && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-slate-900">Article Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Bhartiya Collective Concludes Bilateral Roundtable on Maritime Heritage"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Category</label>
                  <select
                    value={formData.category || 'Discourse'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <option value="Discourse">Discourse</option>
                    <option value="Perspective">Perspective</option>
                    <option value="Press Release">Press Release</option>
                    <option value="Announcement">Announcement</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Author</label>
                  <input
                    type="text"
                    value={formData.author || ''}
                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Status</label>
                  <select
                    value={formData.status || 'published'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Short Excerpt *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.excerpt || ''}
                  onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief synopsis appearing in previews and news cards..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900">Full Article Content</label>
                <textarea
                  rows={5}
                  value={formData.content || ''}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Complete text of the communique, essay, or announcement..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <ImageUploadWithUrl
                label="Article Feature Header Image (Drag & Drop or URL)"
                value={formData.imageUrl || ''}
                onChange={url => setFormData({ ...formData, imageUrl: url })}
                aspectRatio="landscape"
                helperText="Upload article header photo or paste web image URL"
                placeholder="https://..."
              />
            </>
          )}

          {/* Broadcast / Notify Checkbox */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start space-x-2.5">
            <input
              type="checkbox"
              id="notify-users-toggle"
              checked={notifyUsers}
              onChange={e => setNotifyUsers(e.target.checked)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="notify-users-toggle" className="cursor-pointer text-xs text-amber-950">
              <span className="font-bold block flex items-center space-x-1">
                <BellRing className="w-3.5 h-3.5 text-amber-700" />
                <span>Prompt to Notify Members & Subscribers</span>
              </span>
              <span className="text-[11px] text-amber-800">
                Immediately launch the notification gateway after saving to broadcast this update via Email & WhatsApp.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : isEditing ? 'Update & Save Changes' : 'Create & Publish Content'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
