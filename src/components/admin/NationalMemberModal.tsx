import React, { useState, useEffect } from 'react';
import { X, Save, Users, ShieldCheck, Briefcase } from 'lucide-react';
import { NationalTeamMember, TeamPublishStatus } from '../../types/team';

interface NationalMemberModalProps {
  isOpen: boolean;
  initialData?: NationalTeamMember | null;
  onClose: () => void;
  onSave: (data: Omit<NationalTeamMember, 'id'>) => Promise<void>;
}

export const NationalMemberModal: React.FC<NationalMemberModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialData?.id);
  const [formData, setFormData] = useState<Omit<NationalTeamMember, 'id'>>({
    name: '',
    role: '',
    affiliation: '',
    desc: '',
    status: 'published',
    order: 1,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        role: initialData.role || '',
        affiliation: initialData.affiliation || '',
        desc: initialData.desc || '',
        status: initialData.status || 'published',
        order: initialData.order ?? 1,
      });
    } else {
      setFormData({
        name: '',
        role: '',
        affiliation: '',
        desc: '',
        status: 'published',
        order: 1,
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Member name is required.');
      return;
    }
    if (!formData.role.trim()) {
      setError('Role / Designation is required.');
      return;
    }
    if (!formData.affiliation.trim()) {
      setError('Affiliation is required.');
      return;
    }
    if (!formData.desc.trim()) {
      setError('Profile description is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        role: formData.role.trim(),
        affiliation: formData.affiliation.trim(),
        desc: formData.desc.trim(),
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save national team member');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="national-member-modal-title"
      >
        {/* Header */}
        <div className="bg-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-800/80 border border-amber-700/60 flex items-center justify-center text-amber-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 id="national-member-modal-title" className="font-serif font-bold text-base text-amber-50">
                {isEditing ? 'Edit National Executive Leader' : 'Add National Executive Leader'}
              </h3>
              <p className="text-[11px] text-amber-200/80">
                {isEditing ? 'Update leadership credentials and profile details' : 'Add a leader to the National Team on the About page'}
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
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Raghavendra Rao"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Role / Portfolio *
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. National Coordinator — Legal Cell"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
              />
            </div>
          </div>

          {/* Affiliation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Affiliation / Institution *</span>
            </label>
            <input
              type="text"
              required
              value={formData.affiliation}
              onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
              placeholder="e.g. Supreme Court of India / Former Addl. Solicitor General"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-800 focus:border-amber-800"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Profile Summary & Focus Areas *
            </label>
            <textarea
              required
              rows={3}
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              placeholder="Summary of qualifications, practice areas, publications, or advisory roles..."
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
              <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Publish Leader'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
