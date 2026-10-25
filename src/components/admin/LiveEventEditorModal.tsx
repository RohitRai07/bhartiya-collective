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
  BellRing,
  Users
} from 'lucide-react';
import { 
  EventItem, 
  EventSpeaker, 
  LiveStreamStatus,
  STANDARD_SPEAKER_ROLES,
  COMMON_AFFILIATIONS
} from '../../types/event';
import { extractYouTubeId, getYouTubeThumbnail } from '../../utils/youtube';
import { BroadcastTimeInput } from './BroadcastTimeInput';
import { 
  validateBroadcastTime, 
  extractBroadcastTime, 
  formatBroadcastStorageTime, 
  TIME_FORMAT_ERROR 
} from '../../utils/timeValidation';
import { expertService } from '../../services/expertService';

interface LiveEventEditorModalProps {
  isOpen: boolean;
  initialData?: EventItem | null;
  onClose: () => void;
  onSave: (data: Partial<EventItem>, publishStatus: 'published' | 'draft') => Promise<void>;
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
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([
    { name: '', affiliation: '', role: 'Keynote Speaker' }
  ]);
  const [councilExperts, setCouncilExperts] = useState<Array<{ id: string; name: string; role?: string; affiliation: string }>>([]);

  useEffect(() => {
    expertService.getExperts({ includeArchived: false }).then(experts => {
      setCouncilExperts(experts.map(e => ({
        id: e.id,
        name: e.name,
        role: e.role || (e.councilRole === 'advisory_council' ? 'Distinguished Jurist' : 'Constitutional Scholar'),
        affiliation: e.affiliation,
      })));
    }).catch(() => {});
  }, []);

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
    setSpeakers([...speakers, { name: '', affiliation: '', role: 'Plenary Panelist' }]);
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

      await onSave(payload, publishStatus);
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

          {/* Speakers & Panelists Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-red-600" />
                  <span>Featured Speakers & Panelists</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Separate participant name, role selection, and institutional affiliation.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSpeaker}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold cursor-pointer transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-amber-700" />
                <span>Add Speaker / Panelist</span>
              </button>
            </div>

            <div className="space-y-3">
              {speakers.map((spk, idx) => {
                const isCustomRole = spk.role && !STANDARD_SPEAKER_ROLES.includes(spk.role);
                return (
                  <div key={idx} className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3 relative transition-all">
                    {/* Header bar of participant card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          {spk.name.trim() ? spk.name : `Participant #${idx + 1}`}
                        </span>
                        {spk.role && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-200">
                            {spk.role}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Quick pick from Council Experts */}
                        {councilExperts.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <select
                              value=""
                              onChange={e => {
                                const found = councilExperts.find(x => x.id === e.target.value);
                                if (found) {
                                  handleSpeakerChange(idx, 'name', found.name);
                                  handleSpeakerChange(idx, 'affiliation', found.affiliation);
                                  if (found.role) {
                                    handleSpeakerChange(idx, 'role', found.role);
                                  }
                                }
                              }}
                              className="text-[11px] bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1 cursor-pointer max-w-[170px] truncate hover:border-slate-300"
                              title="Auto-fill from Council Scholar or Jurist"
                            >
                              <option value="">⚡ Auto-fill Scholar</option>
                              {councilExperts.map(exp => (
                                <option key={exp.id} value={exp.id}>
                                  {exp.name} ({exp.affiliation})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {speakers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSpeaker(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                            title="Remove speaker / panelist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Separated Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Field 1: Speaker / Panelist Name */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Speaker / Panelist Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Justice Hemant Gupta"
                          value={spk.name}
                          onChange={e => handleSpeakerChange(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600"
                        />
                      </div>

                      {/* Field 2: Speaker / Panelist Role (Select Dropdown) */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Role to Select *
                        </label>
                        <select
                          value={isCustomRole ? 'custom' : (spk.role || 'Keynote Speaker')}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              handleSpeakerChange(idx, 'role', 'Special Discussant');
                            } else {
                              handleSpeakerChange(idx, 'role', val);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-red-600 focus:border-red-600 cursor-pointer"
                        >
                          <optgroup label="Keynote & Plenary">
                            <option value="Keynote Speaker">Keynote Speaker</option>
                            <option value="Plenary Panelist">Plenary Panelist</option>
                            <option value="Featured Panelist">Featured Panelist</option>
                            <option value="Speaker / Panelist">Speaker / Panelist</option>
                          </optgroup>
                          <optgroup label="Jurists & Scholars">
                            <option value="Distinguished Jurist">Distinguished Jurist</option>
                            <option value="Constitutional Scholar">Constitutional Scholar</option>
                            <option value="Research Fellow & Discussant">Research Fellow & Discussant</option>
                          </optgroup>
                          <optgroup label="Chairs & Hosts">
                            <option value="Session Chair & Moderator">Session Chair & Moderator</option>
                            <option value="Broadcasting Host">Broadcasting Host</option>
                          </optgroup>
                          <optgroup label="Guest & Special">
                            <option value="Guest Speaker">Guest Speaker</option>
                            <option value="Guest of Honour">Guest of Honour</option>
                            <option value="Special Address">Special Address</option>
                            <option value="custom">Other (Custom Role)...</option>
                          </optgroup>
                        </select>
                        {isCustomRole && (
                          <input
                            type="text"
                            placeholder="Type custom role title..."
                            value={spk.role}
                            onChange={e => handleSpeakerChange(idx, 'role', e.target.value)}
                            className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                          />
                        )}
                      </div>

                      {/* Field 3: Affiliation / Institution */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Affiliation / Institution
                        </label>
                        <input
                          type="text"
                          list={`affil-list-${idx}`}
                          placeholder="e.g. Supreme Court of India"
                          value={spk.affiliation}
                          onChange={e => handleSpeakerChange(idx, 'affiliation', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-red-600 focus:border-red-600"
                        />
                        <datalist id={`affil-list-${idx}`}>
                          {COMMON_AFFILIATIONS.map((aff, aIdx) => (
                            <option key={aIdx} value={aff} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                );
              })}
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
