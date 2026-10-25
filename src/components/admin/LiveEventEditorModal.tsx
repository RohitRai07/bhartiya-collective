import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Video, 
  Check, 
  Radio, 
  Calendar, 
  Plus, 
  Trash2,
  AlertCircle,
  BellRing
} from 'lucide-react';
import { EventItem, EventSpeaker, LiveStreamStatus } from '../../types/event';
import { extractYouTubeId, getYouTubeThumbnail } from '../../utils/youtube';
import { BroadcastTimeInput } from './BroadcastTimeInput';
import { 
  validateBroadcastTime, 
  extractBroadcastTime, 
  formatBroadcastStorageTime, 
  TIME_FORMAT_ERROR 
} from '../../utils/timeValidation';

interface LiveEventEditorModalProps {
  isOpen: boolean;
  initialData?: EventItem | null;
  onClose: () => void;
  onSave: (data: Partial<EventItem>, publishStatus: 'published' | 'draft', notifyUsers?: boolean) => Promise<void>;
}

export const LiveEventEditorModal: React.FC<LiveEventEditorModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialData?.id);

  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('06:30 PM');
  const [timeError, setTimeError] = useState<string | null>(null);
  const [location, setLocation] = useState('Online & YouTube Live Broadcast');
  const [liveStatus, setLiveStatus] = useState<LiveStreamStatus | 'auto'>('auto');
  const [customThumbnail, setCustomThumbnail] = useState('');
  const [description, setDescription] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [notifyUsers, setNotifyUsers] = useState(false);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([
    { name: '', affiliation: '', role: 'Keynote Speaker' }
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setYoutubeUrl(initialData.youtubeUrl || '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setTime(extractBroadcastTime(initialData.time, '06:30 PM'));
      setLocation(initialData.location || 'Online & YouTube Live Broadcast');
      setLiveStatus(initialData.liveStatus || 'auto');
      setCustomThumbnail(initialData.bannerImage || initialData.customThumbnailUrl || '');
      setDescription(initialData.description || '');
      setRegistrationOpen(initialData.registrationOpen ?? true);
      setNotifyUsers(false);
      setSpeakers(
        initialData.speakers && initialData.speakers.length > 0
          ? initialData.speakers
          : [{ name: '', affiliation: '', role: 'Keynote Speaker' }]
      );
    } else {
      setTitle('');
      setYoutubeUrl('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('06:30 PM');
      setLocation('Online & YouTube Live Broadcast');
      setLiveStatus('auto');
      setCustomThumbnail('');
      setDescription('');
      setRegistrationOpen(true);
      setNotifyUsers(false);
      setSpeakers([{ name: '', affiliation: '', role: 'Keynote Speaker' }]);
    }
    setTimeError(null);
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const currentYtId = extractYouTubeId(youtubeUrl);
  const autoYtThumbnail = currentYtId ? getYouTubeThumbnail(currentYtId) : '';
  const effectiveThumbnail = customThumbnail.trim() || autoYtThumbnail;

  const handleAddSpeaker = () => {
    setSpeakers([...speakers, { name: '', affiliation: '', role: 'Speaker / Panelist' }]);
  };

  const handleRemoveSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const handleSpeakerChange = (index: number, field: keyof EventSpeaker, val: string) => {
    const updated = [...speakers];
    updated[index] = { ...updated[index], [field]: val };
    setSpeakers(updated);
  };

  const handleFormSubmit = async (publishStatus: 'published' | 'draft') => {
    if (!title.trim()) {
      setError('Live event title is required.');
      return;
    }
    if (!youtubeUrl.trim()) {
      setError('YouTube Live URL is required.');
      return;
    }
    if (!currentYtId) {
      setError('Please provide a valid YouTube URL (e.g. https://www.youtube.com/live/... or https://www.youtube.com/watch?v=...)');
      return;
    }
    if (!date.trim()) {
      setError('Event date is required.');
      return;
    }

    const timeValidation = validateBroadcastTime(time);
    if (!timeValidation.isValid) {
      const errMsg = timeValidation.error || TIME_FORMAT_ERROR;
      setTimeError(errMsg);
      setError(errMsg);
      return;
    }

    setSaving(true);
    setError(null);
    setTimeError(null);

    try {
      const filteredSpeakers = speakers.filter(s => s.name.trim() !== '');
      const storageTime = formatBroadcastStorageTime(timeValidation.formattedTime);

      const payload: Partial<EventItem> = {
        title: title.trim(),
        type: 'Live Stream',
        mode: 'Online Webinar',
        date: date.trim(),
        time: storageTime,
        location: location.trim() || 'Online & YouTube Live Stream',
        description: description.trim(),
        speakers: filteredSpeakers.length > 0 ? filteredSpeakers : [
          { name: 'Bharat Collective Dialogue', affiliation: 'Council of Jurists', role: 'Broadcasting Host' }
        ],
        registrationOpen,
        isLive: true,
        youtubeUrl: youtubeUrl.trim(),
        youtubeId: currentYtId,
        bannerImage: effectiveThumbnail,
        customThumbnailUrl: customThumbnail.trim() || undefined,
        liveStatus: liveStatus === 'auto' ? undefined : liveStatus,
        status: publishStatus,
      };

      await onSave(payload, publishStatus, notifyUsers);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save YouTube live event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 text-red-400 flex items-center justify-center border border-red-500/40 relative">
              <Radio className="w-5 h-5 text-red-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  YouTube Live
                </span>
                <span className="text-xs text-slate-400">Events Module</span>
              </div>
              <h3 className="text-base font-serif font-bold text-white mt-0.5">
                {isEditing ? 'Edit YouTube Live Event' : 'Schedule YouTube Live Event'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Event Title */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-900">
              Live Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Live Address: Constitutional Bench Hearings on Article 44"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-1 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          {/* YouTube Live URL & Instant Preview */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-900">
              YouTube Live Stream URL *
            </label>
            <div className="relative">
              <Video className="w-4 h-4 text-red-600 absolute left-3 top-3" />
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/live/... or https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-1 focus:ring-red-600 focus:border-red-600 bg-white font-mono text-xs"
              />
            </div>

            {currentYtId ? (
              <div className="mt-2 flex items-center space-x-3 p-3 bg-red-50/60 border border-red-200/80 rounded-xl">
                <img
                  src={effectiveThumbnail || autoYtThumbnail}
                  alt="YouTube Preview"
                  className="w-20 h-12 object-cover rounded-lg border border-red-200 shrink-0"
                />
                <div className="text-[11px] text-slate-700">
                  <span className="font-semibold text-red-700 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Valid YouTube ID: <code className="font-mono bg-white px-1 py-0.5 rounded border border-red-200">{currentYtId}</code></span>
                  </span>
                  <span className="text-slate-500">Live stream player and thumbnail preview ready.</span>
                </div>
              </div>
            ) : youtubeUrl ? (
              <p className="text-[11px] text-amber-700 mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Please enter a valid YouTube Live URL (e.g., youtube.com/live/..., watch?v=..., or youtu.be/...)</span>
              </p>
            ) : null}
          </div>

          {/* Schedule (Date, Time with Clock Picker, Live Status) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-900">
                Scheduled Date *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-red-600 focus:border-red-600 bg-white"
                />
              </div>
            </div>

            <div>
              {/* Manual Time Entry with Strict Validation */}
              <BroadcastTimeInput
                value={time}
                onChange={val => {
                  setTime(val);
                  if (timeError) {
                    const res = validateBroadcastTime(val);
                    if (res.isValid) setTimeError(null);
                  }
                }}
                error={timeError}
                onErrorChange={setTimeError}
                label="Broadcast Time (IST) *"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-900">
                Live Status
              </label>
              <select
                value={liveStatus}
                onChange={e => setLiveStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-red-600 focus:border-red-600 bg-white font-medium"
              >
                <option value="auto">Auto (Calculate from schedule)</option>
                <option value="live">🔴 Live Now (Broadcasting)</option>
                <option value="upcoming">⏳ Upcoming (Scheduled)</option>
                <option value="ended">⏹️ Ended / Replay</option>
              </select>
            </div>
          </div>

          {/* Schedule Confirmation & Clear Display Box */}
          <div className="p-3 bg-gradient-to-r from-red-50 to-amber-50/70 border border-red-200/80 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600/15 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
                <Radio className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
                  Broadcast Schedule Confirmation
                </span>
                <span className="font-semibold text-slate-900 text-xs">
                  {date ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Date not set'} • {validateBroadcastTime(time).isValid ? formatBroadcastStorageTime(validateBroadcastTime(time).formattedTime) : (time ? `${time} (Invalid Format)` : 'Time not set')}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-slate-800 border border-slate-200 shadow-2xs">
              {liveStatus === 'live' ? '🔴 Live' : liveStatus === 'upcoming' ? '⏳ Scheduled' : liveStatus === 'ended' ? '⏹️ Ended' : 'Auto Status'}
            </span>
          </div>

          {/* Custom Thumbnail (Optional) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-900">
                Custom Thumbnail / Banner URL (Optional)
              </label>
              {autoYtThumbnail && (
                <button
                  type="button"
                  onClick={() => setCustomThumbnail(autoYtThumbnail)}
                  className="text-[11px] text-amber-800 hover:underline font-semibold cursor-pointer"
                >
                  Use YouTube Thumbnail
                </button>
              )}
            </div>
            <input
              type="url"
              placeholder="https://... (Leave blank to use YouTube auto-generated thumbnail)"
              value={customThumbnail}
              onChange={e => setCustomThumbnail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          {/* Description & Overview */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-900">
              Event Description & Agenda
            </label>
            <textarea
              rows={3}
              placeholder="Outline what will be discussed during this live stream..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          {/* Speakers Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-900">
                Featured Speakers & Panelists
              </label>
              <button
                type="button"
                onClick={handleAddSpeaker}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Speaker</span>
              </button>
            </div>

            <div className="space-y-2">
              {speakers.map((spk, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Speaker Name (e.g. Justice Hemant Gupta)"
                    value={spk.name}
                    onChange={e => handleSpeakerChange(idx, 'name', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Role / Affiliation"
                    value={spk.affiliation}
                    onChange={e => handleSpeakerChange(idx, 'affiliation', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                  {speakers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSpeaker(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove speaker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Registration Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-2 font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={registrationOpen}
                onChange={e => setRegistrationOpen(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
              />
              <span>Enable Audience RSVP & Q&A Registration</span>
            </label>
          </div>

          {/* Prompt to Notify Members & Subscribers */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start space-x-2.5">
            <input
              type="checkbox"
              id="notify-live-event-toggle"
              checked={notifyUsers}
              onChange={e => setNotifyUsers(e.target.checked)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="notify-live-event-toggle" className="cursor-pointer text-xs text-amber-950">
              <span className="font-bold block flex items-center space-x-1">
                <BellRing className="w-3.5 h-3.5 text-amber-700" />
                <span>Prompt to Notify Members & Subscribers</span>
              </span>
              <span className="text-[11px] text-amber-800">
                Immediately launch the notification gateway after saving to broadcast this update via Email & WhatsApp.
              </span>
            </label>
          </div>
        </div>

        {/* Modal Actions: Save Draft vs Publish */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto justify-center px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-colors cursor-pointer text-xs text-center"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleFormSubmit('draft')}
              className="w-full sm:w-auto justify-center px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer text-xs text-center"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleFormSubmit('published')}
              className="w-full sm:w-auto justify-center px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Publishing...' : isEditing ? 'Update & Publish' : 'Publish Live Event'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
