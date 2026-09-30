import React, { useState, useEffect } from 'react';
import { X, Save, Video, Sparkles, Check } from 'lucide-react';
import { PodcastEpisode, PodcastInput } from '../../types/podcast';
import { extractYouTubeId } from '../../services/podcastService';

interface PodcastEditorModalProps {
  isOpen: boolean;
  initialData?: PodcastEpisode | null;
  onClose: () => void;
  onSave: (data: PodcastInput) => Promise<void>;
}

export const PodcastEditorModal: React.FC<PodcastEditorModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialData?.id);
  const [formData, setFormData] = useState<PodcastInput>({
    title: '',
    youtubeUrl: '',
    speaker: '',
    speakerRole: '',
    topic: 'Civilizational Jurisprudence',
    duration: '45 min',
    date: new Date().toISOString().split('T')[0],
    description: '',
    featured: false,
    thumbnailUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        youtubeUrl: initialData.youtubeUrl || '',
        speaker: initialData.speaker || '',
        speakerRole: initialData.speakerRole || '',
        topic: initialData.topic || 'Civilizational Jurisprudence',
        duration: initialData.duration || '45 min',
        date: initialData.date || new Date().toISOString().split('T')[0],
        description: initialData.description || '',
        featured: initialData.featured ?? false,
        thumbnailUrl: initialData.thumbnailUrl || '',
      });
    } else {
      setFormData({
        title: '',
        youtubeUrl: '',
        speaker: '',
        speakerRole: '',
        topic: 'Civilizational Jurisprudence',
        duration: '45 min',
        date: new Date().toISOString().split('T')[0],
        description: '',
        featured: false,
        thumbnailUrl: '',
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const currentYtId = extractYouTubeId(formData.youtubeUrl);
  const previewThumb = formData.thumbnailUrl || (currentYtId ? `https://img.youtube.com/vi/${currentYtId}/hqdefault.jpg` : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Episode title is required.');
      return;
    }
    if (!formData.youtubeUrl.trim()) {
      setError('YouTube URL is required.');
      return;
    }
    if (!extractYouTubeId(formData.youtubeUrl)) {
      setError('Please provide a valid YouTube link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)');
      return;
    }
    if (!formData.speaker.trim()) {
      setError('Speaker / Guest name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...formData,
        thumbnailUrl: previewThumb,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save podcast episode.');
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
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white">
                {isEditing ? 'Edit Podcast Episode' : 'Add New Podcast Episode'}
              </h3>
              <p className="text-[11px] text-amber-200/80">
                Embed video episodes with auto-extracted YouTube previews
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
              Episode Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Uniform Civil Code: Constitutional Equality & Civilizational Ethics"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
            />
          </div>

          {/* YouTube Link */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              YouTube Video URL *
            </label>
            <div className="relative">
              <Video className="w-4 h-4 text-red-600 absolute left-3 top-2.5" />
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={formData.youtubeUrl}
                onChange={e => setFormData({ ...formData, youtubeUrl: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white font-mono"
              />
            </div>
            {currentYtId ? (
              <div className="mt-2 flex items-center space-x-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={previewThumb}
                  alt="YouTube Preview"
                  className="w-20 h-12 object-cover rounded-lg border border-slate-200"
                />
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Valid YouTube ID: {currentYtId}</span>
                  </span>
                  <span>Thumbnail auto-linked for player cards.</span>
                </div>
              </div>
            ) : formData.youtubeUrl ? (
              <p className="text-[11px] text-amber-700 mt-1">
                Enter a valid YouTube URL to extract video ID and preview.
              </p>
            ) : null}
          </div>

          {/* Speaker & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Guest / Speaker Name(s) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Justice (Retd.) Hemant Gupta"
                value={formData.speaker}
                onChange={e => setFormData({ ...formData, speaker: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Speaker Designation / Affiliation
              </label>
              <input
                type="text"
                placeholder="e.g. Former Supreme Court Judge & Constitutional Chair"
                value={formData.speakerRole || ''}
                onChange={e => setFormData({ ...formData, speakerRole: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
          </div>

          {/* Topic & Duration & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Topic / Category
              </label>
              <input
                type="text"
                placeholder="e.g. Legal Philosophy"
                value={formData.topic}
                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Duration
              </label>
              <input
                type="text"
                placeholder="e.g. 52 min or 1 hr 14 min"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Release Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Episode Description & Key Takeaways
            </label>
            <textarea
              rows={3}
              placeholder="Outline what this episode covers, key questions addressed, and context..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 bg-white"
            />
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="pod-featured"
              checked={formData.featured}
              onChange={e => setFormData({ ...formData, featured: e.target.checked })}
              className="rounded text-amber-700 focus:ring-amber-600 h-4 w-4"
            />
            <label htmlFor="pod-featured" className="font-semibold text-slate-700 cursor-pointer">
              Pin as Featured Episode on Podcasts Page
            </label>
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
              <span>{saving ? 'Saving Episode...' : isEditing ? 'Save Changes' : 'Create Episode'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
