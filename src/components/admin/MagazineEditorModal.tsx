import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, IndianRupee, Image as ImageIcon, FileText } from 'lucide-react';
import { MagazineIssue, MagazineIssueInput } from '../../types/magazine';

interface MagazineEditorModalProps {
  isOpen: boolean;
  initialData?: MagazineIssue | null;
  onClose: () => void;
  onSave: (data: MagazineIssueInput) => Promise<void>;
}

export const MagazineEditorModal: React.FC<MagazineEditorModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialData?.id);
  const [formData, setFormData] = useState<MagazineIssueInput>({
    title: '',
    issueNumber: '',
    theme: '',
    publicationDate: new Date().toISOString().split('T')[0],
    price: 100, // ₹100 per specification
    pageCount: 60,
    coverImageUrl: '',
    description: '',
    editorialLead: '',
    tableOfContents: [],
    status: 'published',
  });

  const [tocText, setTocText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        issueNumber: initialData.issueNumber || '',
        theme: initialData.theme || '',
        publicationDate: initialData.publicationDate || new Date().toISOString().split('T')[0],
        price: initialData.price ?? 100,
        pageCount: initialData.pageCount || 60,
        coverImageUrl: initialData.coverImageUrl || '',
        description: initialData.description || '',
        editorialLead: initialData.editorialLead || '',
        tableOfContents: initialData.tableOfContents || [],
        status: initialData.status || 'published',
      });
      setTocText(initialData.tableOfContents ? initialData.tableOfContents.join('\n') : '');
    } else {
      setFormData({
        title: '',
        issueNumber: '',
        theme: '',
        publicationDate: new Date().toISOString().split('T')[0],
        price: 100,
        pageCount: 60,
        coverImageUrl: '',
        description: '',
        editorialLead: 'Editorial Board • Bharat Collective Review',
        tableOfContents: [],
        status: 'published',
      });
      setTocText('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Magazine title is required.');
      return;
    }
    if (!formData.issueNumber.trim()) {
      setError('Issue number (e.g. Volume I • Issue 1) is required.');
      return;
    }
    if (!formData.theme.trim()) {
      setError('Theme/Focus area is required.');
      return;
    }

    const parsedToc = tocText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...formData,
        tableOfContents: parsedToc,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save magazine issue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/30 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white">
                {isEditing ? 'Edit Magazine Edition' : 'Publish New Magazine Edition'}
              </h3>
              <p className="text-[11px] text-amber-200/80">
                Official quarterly journals with ₹100 reader contribution and client-side PDF engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Magazine Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bharat Collective Review: Inaugural Volume"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
            />
          </div>

          {/* Issue Number & Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Volume & Issue Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Volume I • Issue 1 (Autumn 2026)"
                value={formData.issueNumber}
                onChange={e => setFormData({ ...formData, issueNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Theme / Focus Subject *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Decolonizing Jurisprudence & Statecraft"
                value={formData.theme}
                onChange={e => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
          </div>

          {/* Price, Page Count, Date, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Reader Token Price (₹)
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Page Count
              </label>
              <input
                type="number"
                min="1"
                placeholder="68"
                value={formData.pageCount}
                onChange={e => setFormData({ ...formData, pageCount: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Publication Date
              </label>
              <input
                type="date"
                value={formData.publicationDate}
                onChange={e => setFormData({ ...formData, publicationDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Publishing Status
              </label>
              <select
                value={formData.status || 'published'}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              >
                <option value="published">Published</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Cover Image URL
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.coverImageUrl || ''}
                onChange={e => setFormData({ ...formData, coverImageUrl: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
          </div>

          {/* Editorial Lead */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Editorial Board / Editors
            </label>
            <input
              type="text"
              placeholder="e.g. Editorial Board • Prof. Ananya Someshwar & Dr. Meenakshi Sundaram"
              value={formData.editorialLead || ''}
              onChange={e => setFormData({ ...formData, editorialLead: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Description & Overview
            </label>
            <textarea
              rows={3}
              placeholder="Comprehensive summary of what this edition contains..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
            />
          </div>

          {/* Table of Contents */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Table of Contents (One essay/article title per line)
            </label>
            <textarea
              rows={4}
              placeholder="Editorial: The Imperative for an Indic Epistemic Framework&#10;Article 44 & The Uniform Civil Code: A Historical Synthesis&#10;Rajadharma in Modern Public Administration&#10;Pramana Shastra in Statutory Interpretation"
              value={tocText}
              onChange={e => setTocText(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              These will be rendered as indexed essays and embedded inside the generated PDF edition.
            </p>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : isEditing ? 'Save Edition' : 'Publish Edition'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
