import React, { useState, useEffect } from 'react';
import { X, Save, MapPin, ShieldCheck, Building } from 'lucide-react';
import { StateChapter, TeamPublishStatus } from '../../types/team';

interface StateChapterModalProps {
  isOpen: boolean;
  initialData?: StateChapter | null;
  onClose: () => void;
  onSave: (data: Omit<StateChapter, 'id'>) => Promise<void>;
}

export const StateChapterModal: React.FC<StateChapterModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialData?.id);
  const [formData, setFormData] = useState<Omit<StateChapter, 'id'>>({
    state: '',
    convener: '',
    city: '',
    focus: '',
    status: 'published',
    order: 1,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        state: initialData.state || '',
        convener: initialData.convener || '',
        city: initialData.city || '',
        focus: initialData.focus || '',
        status: initialData.status || 'published',
        order: initialData.order ?? 1,
      });
    } else {
      setFormData({
        state: '',
        convener: '',
        city: '',
        focus: '',
        status: 'published',
        order: 1,
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.state.trim()) {
      setError('State / UT name is required.');
      return;
    }
    if (!formData.convener.trim()) {
      setError('Convener / Lead name is required.');
      return;
    }
    if (!formData.city.trim()) {
      setError('Base city / regional center is required.');
      return;
    }
    if (!formData.focus.trim()) {
      setError('Regional focus area is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...formData,
        state: formData.state.trim(),
        convener: formData.convener.trim(),
        city: formData.city.trim(),
        focus: formData.focus.trim(),
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save state chapter');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="state-chapter-modal-title"
      >
        {/* Header */}
        <div className="bg-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-800/80 border border-amber-700/60 flex items-center justify-center text-amber-200">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 id="state-chapter-modal-title" className="font-serif font-bold text-base text-amber-50">
                {isEditing ? 'Edit State Chapter & Regional Team' : 'Add State Chapter & Regional Team'}
              </h3>
              <p className="text-[11px] text-amber-200/80">
                {isEditing ? 'Update regional chapter jurisdiction and convenership' : 'Add a regional chapter card to the About page'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-800/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* State Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>State / Region *</span>
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Uttar Pradesh"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
              />
            </div>

            {/* Base City */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Base City / Hub *</span>
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Lucknow / Prayagraj / Ghaziabad"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
              />
            </div>
          </div>

          {/* Convener */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Convener / Chapter Secretariat Lead *
            </label>
            <input
              type="text"
              required
              value={formData.convener}
              onChange={(e) => setFormData({ ...formData, convener: e.target.value })}
              placeholder="e.g. Adv. Saurabh Tripathi, State Coordinator"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
            />
          </div>

          {/* Focus Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Regional Focus & Key Initiatives *
            </label>
            <textarea
              required
              rows={3}
              value={formData.focus}
              onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
              placeholder="e.g. High Court Pro Bono Clinic, Agrarian Policy, Subordinate Judiciary Access..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Display Order */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                min={1}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-800 focus:border-amber-800 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Lower numbers appear first on the About page.
              </span>
            </div>

            {/* Status (Publish / Draft) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Publication Status</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TeamPublishStatus })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
              >
                <option value="published">Published (Visible on About Page)</option>
                <option value="draft">Draft (Unpublished / Hidden)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Publish Chapter'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
