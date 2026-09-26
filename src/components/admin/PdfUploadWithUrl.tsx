import React, { useState, useRef, useEffect } from 'react';
import { fileService } from '../../services/fileService';
import { 
  UploadCloud, 
  Link as LinkIcon, 
  FileText, 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Loader2, 
  Trash2,
  FolderOpen,
  FileCheck,
  Download
} from 'lucide-react';

interface PdfUploadWithUrlProps {
  label: string;
  value: string; // URL or Data URL
  fileName?: string;
  fileSize?: string;
  onChange: (data: { url: string; fileName?: string; fileSize?: string; pageCount?: number }) => void;
  helperText?: string;
  placeholder?: string;
}

const PRESET_LEGAL_DOCS = [
  {
    title: 'The Constitution of India',
    category: 'Supreme Lex of Bharat',
    url: 'https://legislative.gov.in/sites/default/files/COI_English.pdf',
    fileName: 'Constitution_of_India_Official.pdf',
    fileSize: '4.8 MB',
  },
  {
    title: 'Bharatiya Nyaya Sanhita, 2023',
    category: 'Penal Code (BNS)',
    url: 'https://www.mha.gov.in/sites/default/files/2023-12/The%20Bharatiya%20Nyaya%20Sanhita%202023.pdf',
    fileName: 'Bharatiya_Nyaya_Sanhita_2023.pdf',
    fileSize: '3.2 MB',
  },
  {
    title: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    category: 'Criminal Procedure (BNSS)',
    url: 'https://www.mha.gov.in/sites/default/files/2023-12/The%20Bharatiya%20Nagarik%20Suraksha%20Sanhita%202023.pdf',
    fileName: 'Bharatiya_Nagarik_Suraksha_Sanhita_2023.pdf',
    fileSize: '3.6 MB',
  },
  {
    title: 'Digital Personal Data Protection Act, 2023',
    category: 'Privacy & Data Protection',
    url: 'https://www.meity.gov.in/writereaddata/files/Digital%20Personal%20Data%20Protection%20Act%202023.pdf',
    fileName: 'DPDP_Act_2023_Official.pdf',
    fileSize: '1.4 MB',
  },
];

export const PdfUploadWithUrl: React.FC<PdfUploadWithUrlProps> = ({
  label,
  value,
  fileName,
  fileSize,
  onChange,
  helperText,
  placeholder = 'https://legislative.gov.in/.../document.pdf',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'library'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(value || '');
  const [copied, setCopied] = useState(false);
  const [recentPdfs, setRecentPdfs] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(value || '');
  }, [value]);

  useEffect(() => {
    if (activeTab === 'library') {
      setRecentPdfs(fileService.getPdfLibrary());
    }
  }, [activeTab]);

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMsg('Please select a valid PDF file (.pdf extension).');
      return;
    }

    setLoading(true);
    try {
      const result = await fileService.uploadPdfAsDataUrl(file);
      const displaySize = result.sizeKb > 1024 
        ? `${(result.sizeKb / 1024).toFixed(1)} MB` 
        : `${result.sizeKb} KB`;

      onChange({
        url: result.url,
        fileName: result.name,
        fileSize: displaySize,
        pageCount: result.pageCountEstimate,
      });
      setUrlInput(result.url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process PDF document.');
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
      handleProcessFile(e.dataTransfer.files[0]);
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
      const parts = urlInput.trim().split('/');
      const extractedName = parts[parts.length - 1] || 'Document.pdf';
      onChange({
        url: urlInput.trim(),
        fileName: extractedName.includes('.pdf') ? extractedName : `${extractedName}.pdf`,
        fileSize: 'External Gazette',
      });
    }
  };

  const handleClear = () => {
    onChange({ url: '', fileName: '', fileSize: '' });
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

  const isDataUrl = value?.startsWith('data:application/pdf');

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
        
        {/* Top Tab Bar */}
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
              <span>Drag & Drop PDF</span>
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
              <span>Direct PDF URL</span>
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
              <span>Legal Presets & Library</span>
            </button>
          </div>

          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1 cursor-pointer"
              title="Remove PDF document"
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
              accept="application/pdf,.pdf"
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
                  <p className="text-xs font-semibold text-slate-700">Reading and processing PDF file...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-xs">
                    <FileText className="w-6 h-6 text-amber-800" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">
                      Drag & Drop your <span className="text-amber-700">PDF document</span> here, or browse files
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports official Gazette PDF, acts, bare acts, circulars, rules (up to 20 MB)
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

        {/* Tab 2: Direct PDF URL Input */}
        {activeTab === 'url' && (
          <div className="p-4 space-y-3">
            <form onSubmit={handleUrlApply} className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  onChange({ url: e.target.value });
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
              Provide an official government gazette PDF URL (e.g. from legislative.gov.in, egazette.gov.in, or cloud storage).
            </p>
          </div>
        )}

        {/* Tab 3: Presets & Recent Media Library */}
        {activeTab === 'library' && (
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Official Indian Legal Presets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_LEGAL_DOCS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChange({
                        url: preset.url,
                        fileName: preset.fileName,
                        fileSize: preset.fileSize,
                      });
                      setUrlInput(preset.url);
                    }}
                    className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer flex items-center space-x-3 ${
                      value === preset.url
                        ? 'border-amber-600 ring-2 ring-amber-600/30 bg-amber-50'
                        : 'border-slate-200 hover:border-amber-400 bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{preset.title}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        <span>{preset.category}</span>
                        <span>•</span>
                        <span>{preset.fileSize}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {recentPdfs.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block flex items-center space-x-1">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Recently Uploaded PDFs ({recentPdfs.length}):</span>
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {recentPdfs.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        const displaySize = m.sizeKb > 1024 
                          ? `${(m.sizeKb / 1024).toFixed(1)} MB` 
                          : `${m.sizeKb} KB`;
                        onChange({
                          url: m.url,
                          fileName: m.name,
                          fileSize: displaySize,
                        });
                        setUrlInput(m.url);
                      }}
                      className={`w-full rounded-xl border p-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                        value === m.url
                          ? 'border-amber-600 ring-2 ring-amber-600/30 bg-amber-50'
                          : 'border-slate-200 hover:border-amber-400 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <FileCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="text-xs font-medium text-slate-800 truncate">{m.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{m.sizeKb} KB</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Status Card for Selected PDF */}
        {value && (
          <div className="border-t border-slate-100 bg-slate-50/70 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full sm:w-auto min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-5 h-5 text-amber-300" />
              </div>

              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    <Check className="w-2.5 h-2.5 mr-0.5" />
                    {isDataUrl ? 'PDF Uploaded' : 'External PDF Link'}
                  </span>
                  {fileSize && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {fileSize}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {fileName || 'Official_Document.pdf'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                  {value.startsWith('data:') ? 'Embedded PDF binary payload' : value}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end text-xs">
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                title="Copy PDF URL"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {value && !isDataUrl && (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-semibold transition-colors flex items-center space-x-1"
                  title="Open in new window"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>View</span>
                </a>
              )}

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
                <FileText className="w-3 h-3" />
                <span>Replace</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
