import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Calendar, 
  MapPin, 
  RotateCcw, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  flagshipService, 
  FlagshipBannerContent, 
  DEFAULT_FLAGSHIP_BANNER 
} from '../../services/flagshipService';
import { ImageUploadWithUrl } from './ImageUploadWithUrl';

interface FlagshipBannerEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: FlagshipBannerContent) => void;
}

export const FlagshipBannerEditorModal: React.FC<FlagshipBannerEditorModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [formData, setFormData] = useState<FlagshipBannerContent>({ ...DEFAULT_FLAGSHIP_BANNER });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      flagshipService.getFlagshipBanner().then(data => {
        setFormData(data);
      });
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (publishStatus: 'published' | 'draft') => {
    if (!formData.title.trim()) {
      setError('Flagship title is required.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const updated = await flagshipService.updateFlagshipBanner({
        ...formData,
        status: publishStatus,
        isVisible: publishStatus === 'published',
      });
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update flagship dialogue banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset flagship dialogue banner to original presentation defaults?')) {
      const def = await flagshipService.resetToDefault();
      setFormData(def);
      if (onSaved) onSaved(def);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white p-5 flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                  Featured Presentation
                </span>
                <span className="text-xs text-amber-200/80">Website Content Management</span>
              </div>
              <h3 className="text-base font-serif font-bold text-white mt-0.5">
                Edit Flagship National Dialogue Banner
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Notice */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Changes saved here dynamically synchronize across both the <strong>Homepage</strong> and <strong>Events Page</strong>.
              </span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              formData.isVisible && formData.status === 'published'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {formData.isVisible && formData.status === 'published' ? 'Active on Public Site' : 'Draft / Hidden'}
            </span>
          </div>

          {/* Section 1: Headings & Subtitles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-900">
                Presenter Subtitle *
              </label>
              <input
                type="text"
                required
                value={formData.presenterText}
                onChange={e => setFormData({ ...formData, presenterText: e.target.value })}
                placeholder="e.g. Bharat Collective Foundation Presents"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-900">
                Tagline / Subheading *
              </label>
              <input
                type="text"
                required
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. A Dialogue on Law, Equality & Constitutional Values"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
          </div>

          {/* Main Title & Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-900">
                Main Title / Hashtag *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. #BharatDialogue"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white font-serif font-bold text-amber-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-900">
                Highlighted Topic / Subject Line *
              </label>
              <input
                type="text"
                required
                value={formData.titleHighlight}
                onChange={e => setFormData({ ...formData, titleHighlight: e.target.value })}
                placeholder="e.g. on UNIFORM CIVIL CODE"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white font-serif font-bold text-amber-800"
              />
            </div>
          </div>

          {/* Badge Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-900">
                Primary Badge Pill (Amber)
              </label>
              <input
                type="text"
                value={formData.badge1}
                onChange={e => setFormData({ ...formData, badge1: e.target.value })}
                placeholder="e.g. Flagship National Dialogue"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-900">
                Secondary Status Badge (Green)
              </label>
              <input
                type="text"
                value={formData.badge2}
                onChange={e => setFormData({ ...formData, badge2: e.target.value })}
                placeholder="e.g. COMING SOON or 28 OCT 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-900">
              Dialogue Overview & Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline the dialogue agenda and civilizational relevance..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
            />
          </div>

          {/* Venue & Schedule Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="font-bold text-slate-900 text-xs block flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Venue & Schedule Information</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={e => setFormData({ ...formData, venueName: e.target.value })}
                  placeholder="e.g. Venue: Constitution Club of India"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Venue Address & Landmark
                </label>
                <input
                  type="text"
                  value={formData.venueAddress}
                  onChange={e => setFormData({ ...formData, venueAddress: e.target.value })}
                  placeholder="e.g. Rafi Marg, Sansad Marg Area, New Delhi, Delhi 110001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-amber-700" />
                <span>Schedule & Registration Status Line</span>
              </label>
              <input
                type="text"
                value={formData.scheduleInfo}
                onChange={e => setFormData({ ...formData, scheduleInfo: e.target.value })}
                placeholder="e.g. Schedule & Registration Window: Coming Soon"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
              />
            </div>
          </div>

          {/* Action Button CTA Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-900">
                Primary Action Button Text
              </label>
              <input
                type="text"
                value={formData.ctaText}
                onChange={e => setFormData({ ...formData, ctaText: e.target.value })}
                placeholder="e.g. Pre-Register / RSVP"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-900">
                Primary Action Button Target URL / Path
              </label>
              <input
                type="text"
                value={formData.ctaLink}
                onChange={e => setFormData({ ...formData, ctaLink: e.target.value })}
                placeholder="e.g. /register"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs"
              />
            </div>
          </div>

          {/* Official Event Poster Upload & Management */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="block font-bold text-slate-900 text-xs">
              Official Flagship Event Poster (Upload from Device, Paste URL, or Media Library)
            </label>
            <ImageUploadWithUrl
              label="Flagship Event Poster"
              value={formData.posterUrl}
              onChange={url => setFormData({ ...formData, posterUrl: url })}
              aspectRatio="portrait"
              helperText="Upload the official #BharatDialogue event poster (PNG, JPG, WebP) from your device. Displays on the right side of the banner."
            />
          </div>

          {/* Poster Caption */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-900">
              Poster Hover Caption / Tagline
            </label>
            <input
              type="text"
              value={formData.posterCaption || ''}
              onChange={e => setFormData({ ...formData, posterCaption: e.target.value })}
              placeholder="e.g. Connecting Bharat, Bringing Minds Together"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
            />
          </div>

          {/* Section Visibility */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-xs block">
                Flagship Dialogue Banner Visibility
              </span>
              <span className="text-[11px] text-slate-500">
                When enabled, this banner is displayed on the Homepage and Events page.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isVisible: !formData.isVisible })}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                formData.isVisible 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {formData.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{formData.isVisible ? 'Visible (Active)' : 'Hidden (Disabled)'}</span>
            </button>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center space-x-1 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-colors cursor-pointer text-xs"
            title="Reset to original UCC presentation defaults"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-colors cursor-pointer text-xs text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer text-xs text-center"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit('published')}
              className="px-5 py-2 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save & Publish Banner'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
