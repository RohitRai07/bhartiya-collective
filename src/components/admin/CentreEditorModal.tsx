import React, { useState, useEffect } from 'react';
import { X, Save, Landmark } from 'lucide-react';
import { BharatCentre } from '../../data/centresData';
import { CustomTagInput } from './CustomTagInput';

interface CentreEditorModalProps {
  isOpen: boolean;
  initialData?: BharatCentre | null;
  onClose: () => void;
  onSave: (data: Omit<BharatCentre, 'id'>) => Promise<void>;
}

const AVAILABLE_ICONS = [
  { value: 'Landmark', label: 'Landmark (Public Policy)' },
  { value: 'Scale', label: 'Scale (Legal & Human Rights)' },
  { value: 'Users', label: 'Users (Labour & Community)' },
  { value: 'Heart', label: 'Heart (Women & Social Welfare)' },
  { value: 'Shield', label: 'Shield (IPR & Security)' },
  { value: 'Compass', label: 'Compass (Engineering & AI)' },
];

export const CentreEditorModal: React.FC<CentreEditorModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialData?.id);
  const [formData, setFormData] = useState<Omit<BharatCentre, 'id'>>({
    name: '',
    shortName: '',
    sanskritName: '',
    slug: '',
    leadFellow: '',
    description: '',
    icon: 'Landmark',
    keyThemes: [],
    focusAreas: [],
    status: 'published',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        shortName: initialData.shortName || '',
        sanskritName: initialData.sanskritName || '',
        slug: initialData.slug || '',
        leadFellow: initialData.leadFellow || '',
        description: initialData.description || '',
        icon: initialData.icon || 'Landmark',
        keyThemes: initialData.keyThemes || [],
        focusAreas: initialData.focusAreas || [],
        status: initialData.status || 'published',
      });
    } else {
      setFormData({
        name: '',
        shortName: '',
        sanskritName: '',
        slug: '',
        leadFellow: '',
        description: '',
        icon: 'Landmark',
        keyThemes: [],
        focusAreas: [],
        status: 'published',
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Centre official title is required.');
      return;
    }
    if (!formData.shortName.trim()) {
      setError('Centre short label is required.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Executive summary / description is required.');
      return;
    }
    if (!formData.leadFellow.trim()) {
      setError('Lead scholar / convener name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const slugToUse = formData.slug.trim() || formData.shortName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await onSave({
        ...formData,
        slug: slugToUse,
        name: formData.name.trim(),
        shortName: formData.shortName.trim(),
        sanskritName: formData.sanskritName.trim(),
        leadFellow: formData.leadFellow.trim(),
        description: formData.description.trim(),
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save centre');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base">
                {isEditing ? 'Edit Research Centre' : 'Add New Research Centre'}
              </h3>
              <p className="text-xs text-amber-200/80">
                Frontline thematic institute at Bharat Collective Foundation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Centre Full Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Center for Human Rights & Legal Aid"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Short Name (Nav / Tabs) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Human Rights & Legal Aid"
                value={formData.shortName}
                onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Sanskrit / Devanagari Title
              </label>
              <input
                type="text"
                placeholder="e.g. मानव अधिकार एवं विधि सहायता केंद्र"
                value={formData.sanskritName}
                onChange={e => setFormData({ ...formData, sanskritName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                URL Slug
              </label>
              <input
                type="text"
                placeholder="e.g. human-rights-legal-aid"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Lead Scholar / Convener *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sr. Adv. J. Sai Deepak & Legal Aid Panel"
                value={formData.leadFellow}
                onChange={e => setFormData({ ...formData, leadFellow: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Visual Icon Badge
              </label>
              <select
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                {AVAILABLE_ICONS.map(ic => (
                  <option key={ic.value} value={ic.value}>{ic.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Executive Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="State the core mission, legislative focus, and civilizational grounding of this centre..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <CustomTagInput
              label="Key Research Themes"
              tags={formData.keyThemes}
              onChange={tags => setFormData({ ...formData, keyThemes: tags })}
              placeholder="Type theme and press Enter..."
              helperText="Core thematic inquiry areas of this institute"
            />
          </div>

          <div>
            <CustomTagInput
              label="Action Focus Areas"
              tags={formData.focusAreas}
              onChange={tags => setFormData({ ...formData, focusAreas: tags })}
              placeholder="Type focus area and press Enter..."
              helperText="Practical policy and grassroots interventions"
            />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <span className="font-bold text-slate-800">Publishing Status:</span>
            <label className="inline-flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="centre_status"
                value="published"
                checked={formData.status === 'published'}
                onChange={() => setFormData({ ...formData, status: 'published' })}
                className="text-amber-700"
              />
              <span className="text-slate-700 font-semibold">Published (Live)</span>
            </label>
            <label className="inline-flex items-center space-x-1.5 cursor-pointer">
              <input
                type="radio"
                name="centre_status"
                value="draft"
                checked={formData.status === 'draft'}
                onChange={() => setFormData({ ...formData, status: 'draft' })}
                className="text-slate-500"
              />
              <span className="text-slate-500">Draft (Hidden)</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : (isEditing ? 'Update Centre' : 'Create Centre')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
