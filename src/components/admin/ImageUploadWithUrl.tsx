import React, { useState, useRef, useEffect } from 'react';
import { fileService } from '../../services/fileService';
import { 
  UploadCloud, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Loader2, 
  Trash2,
  FolderOpen
} from 'lucide-react';

interface ImageUploadWithUrlProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: 'landscape' | 'portrait' | 'square' | 'auto';
  helperText?: string;
  placeholder?: string;
}

const INDIC_PRESET_IMAGES = [
  {
    title: 'Policy & Governance',
    category: 'Publication / Paper',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'National Dialogue & Colloquium',
    category: 'Event / Symposium',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Civilizational Archives & Library',
    category: 'Research / Domain',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Scholar & Academic Fellow',
    category: 'Portrait / Profile',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
];

export const ImageUploadWithUrl: React.FC<ImageUploadWithUrlProps> = ({
  label,
  value,
  onChange,
  aspectRatio = 'landscape',
  helperText,
  placeholder = 'https://...',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'library'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(value || '');
  const [copied, setCopied] = useState(false);
  const [recentMedia, setRecentMedia] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(value || '');
  }, [value]);

  useEffect(() => {
    if (activeTab === 'library') {
      setRecentMedia(fileService.getMediaLibrary());
    }
  }, [activeTab]);

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WebP, SVG, or GIF).');
      return;
    }

    setLoading(true);
    try {
      const result = await fileService.uploadImageAsDataUrl(file);
      onChange(result.url);
      setUrlInput(result.url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process image file.');
    } finally {
      setLoading(false);
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleUrlApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDataUrl = value?.startsWith('data:image');

  return (
    <div className="space-y-2">
      {/* Label and Subtext */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-900">
          {label}
        </label>
        {helperText && (
          <span className="text-[11px] text-slate-500">{helperText}</span>
        )}
      </div>

      {/* Main Container */}
      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
        
        {/* Top Tab Bar: Drag & Drop vs URL vs Library */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-1.5 text-xs">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Drag & Drop Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Direct URL</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Presets & Library</span>
            </button>
          </div>

          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1 cursor-pointer"
              title="Remove image"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Tab 1: Drag & Drop Dropzone */}
        {activeTab === 'upload' && (
          <div className="p-4 space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                isDragging
                  ? 'border-amber-600 bg-amber-50/90 scale-[1.01] shadow-inner'
                  : 'border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/30'
              }`}
            >
              {loading ? (
                <div className="py-2 flex flex-col items-center space-y-2">
                  <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
                  <p className="text-xs font-semibold text-slate-700">Processing and optimizing image...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">
                      Drag & Drop your image here, or <span className="text-amber-700 underline">browse files</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports PNG, JPG, WebP, SVG, and GIF (Optimized automatically for web)
                    </p>
                  </div>
                </>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
            )}
          </div>
        )}

        {/* Tab 2: Direct URL Input */}
        {activeTab === 'url' && (
          <div className="p-4 space-y-3">
            <form onSubmit={handleUrlApply} className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  onChange(e.target.value);
                }}
                placeholder={placeholder}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-amber-600 focus:border-amber-600 bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Apply URL
              </button>
            </form>
            <p className="text-[11px] text-slate-500">
              Paste an external web link from Unsplash, Wikimedia Commons, Cloudinary, AWS S3, etc.
            </p>
          </div>
        )}

        {/* Tab 3: Presets & Recent Media Library */}
        {activeTab === 'library' && (
          <div className="p-4 space-y-4">
            {/* Thematic Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Recommended Thematic Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INDIC_PRESET_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChange(preset.url);
                      setUrlInput(preset.url);
                    }}
                    className={`group relative rounded-xl overflow-hidden border p-1 text-left transition-all cursor-pointer ${
                      value === preset.url
                        ? 'border-amber-600 ring-2 ring-amber-600/30 bg-amber-50'
                        : 'border-slate-200 hover:border-amber-400 bg-slate-50'
                    }`}
                  >
                    <img 
                      src={preset.url} 
                      alt={preset.title} 
                      className="w-full h-16 object-cover rounded-lg group-hover:scale-102 transition-transform" 
                    />
                    <div className="pt-1 px-0.5">
                      <p className="text-[10px] font-bold text-slate-800 truncate">{preset.title}</p>
                      <p className="text-[9px] text-slate-500 truncate">{preset.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Previously Uploaded Media */}
            {recentMedia.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block flex items-center space-x-1">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Recent Uploads ({recentMedia.length}):</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                  {recentMedia.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onChange(m.url);
                        setUrlInput(m.url);
                      }}
                      className={`group relative rounded-xl overflow-hidden border p-1 text-left transition-all cursor-pointer ${
                        value === m.url
                          ? 'border-amber-600 ring-2 ring-amber-600/30 bg-amber-50'
                          : 'border-slate-200 hover:border-amber-400 bg-slate-50'
                      }`}
                    >
                      <img 
                        src={m.url} 
                        alt={m.name} 
                        className="w-full h-16 object-cover rounded-lg group-hover:scale-102 transition-transform" 
                      />
                      <div className="pt-1 px-0.5 flex justify-between items-center text-[9px] text-slate-500">
                        <span className="truncate max-w-[80px]">{m.name}</span>
                        <span>{m.sizeKb}KB</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Preview Card */}
        {value && (
          <div className="border-t border-slate-100 bg-slate-50/70 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="relative group flex-shrink-0">
                <img
                  src={value}
                  alt="Active Preview"
                  className={`rounded-xl object-cover border border-slate-200 shadow-2xs ${
                    aspectRatio === 'portrait' 
                      ? 'w-12 h-16' 
                      : aspectRatio === 'square' 
                      ? 'w-14 h-14' 
                      : 'w-20 h-12'
                  }`}
                />
              </div>

              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    <Check className="w-2.5 h-2.5 mr-0.5" />
                    {isDataUrl ? 'Local Upload' : 'Remote URL'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono truncate max-w-xs">
                  {value}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end text-xs">
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                title="Copy Image URL or Data"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    setActiveTab('upload');
                  }
                }}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Replace</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
