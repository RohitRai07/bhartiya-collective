import React, { useState } from 'react';
import { Circular } from '../../types/circular';
import { pdfService } from '../../services/pdfService';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Scale, 
  Calendar, 
  Building2, 
  BookOpen, 
  Sparkles, 
  Loader2,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  FileText,
  ShieldCheck
} from 'lucide-react';

interface CircularPreviewModalProps {
  circular: Circular | null;
  onClose: () => void;
  onDownloadComplete?: (circular: Circular) => void;
}

export const CircularPreviewModal: React.FC<CircularPreviewModalProps> = ({
  circular,
  onClose,
  onDownloadComplete
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  if (!circular) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await pdfService.downloadCircularPdf(circular);
      setDownloaded(true);
      if (onDownloadComplete) onDownloadComplete(circular);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF in modal:', err);
      alert('Unable to generate PDF at this time.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCitation = () => {
    const citation = `${circular.issuingAuthority}, "${circular.title}", ${circular.circularNumber} (${circular.releaseDate}).`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const getTextSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-xs leading-relaxed';
      case 'lg': return 'text-base leading-loose';
      default: return 'text-sm leading-relaxed';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Top Institutional Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 pb-4 flex items-start justify-between border-b border-slate-800">
          <div className="space-y-2 pr-4">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {circular.category.replace(/_/g, ' ')}
              </span>

              {circular.important && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  Landmark Lex
                </span>
              )}

              <span className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                {circular.circularNumber}
              </span>
            </div>

            <h2 className="font-serif text-lg sm:text-2xl font-bold text-white leading-snug">
              {circular.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{circular.issuingAuthority}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Enacted: {circular.releaseDate}</span>
              </div>
            </div>

          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Utility Bar (Font Controls & Citation) */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Text Size:</span>
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${fontSize === 'sm' ? 'bg-amber-800 text-white' : 'hover:bg-slate-200'}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${fontSize === 'base' ? 'bg-amber-800 text-white' : 'hover:bg-slate-200'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${fontSize === 'lg' ? 'bg-amber-800 text-white' : 'hover:bg-slate-200'}`}
            >
              A+
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyCitation}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              {copiedCitation ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
              <span>{copiedCitation ? 'Citation Copied' : 'Copy Citation'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
          
          {/* Legislative Summary Box */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-800" />
              <span>Statement of Objects & Reasons / Legislative Scope</span>
            </h4>
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-900/10">
              <p className={`${getTextSizeClass()} text-slate-800`}>
                {circular.summary}
              </p>
            </div>
          </div>

          {/* Key Provisions */}
          {circular.keyProvisions && circular.keyProvisions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                <span>Statutory Articles & Key Enactment Sections</span>
              </h4>
              <div className="space-y-2">
                {circular.keyProvisions.map((provision, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-start space-x-3">
                    <span className="font-mono font-bold text-xs text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded shrink-0">
                      § {idx + 1}
                    </span>
                    <p className={`${getTextSizeClass()} text-slate-800`}>
                      {provision}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bare Act Extract / Rich Preview */}
          {circular.contentPreview && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-800" />
                <span>Official Statutory Text / Bare Act Extract</span>
              </h4>
              <div className="bg-slate-900 text-amber-100/90 rounded-xl p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800 max-h-64 overflow-y-auto">
                {circular.contentPreview}
              </div>
            </div>
          )}

          {/* Taxonomy Tags */}
          {circular.tags && circular.tags.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Subject Index & Classification:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {circular.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Legal Disclaimer / Open Law Declarations */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-[11px] text-slate-500 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p>
              Official Public Law & Statutory Compendium provided for academic research, constitutional jurisprudence, and public civic awareness under Creative Commons open-access principles and public domain statutory notifications.
            </p>
          </div>

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center space-x-2 text-slate-500">
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              {circular.fileSize || 'PDF Document'}
            </span>
            <span>•</span>
            <span>{circular.language || 'English'}</span>
            {circular.pageCount && <span>• {circular.pageCount} Pages</span>}
          </div>

          <div className="flex items-center space-x-2 justify-end">
            
            {circular.pdfUrl && circular.pdfUrl !== '#' && (
              <a
                href={circular.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Gazette Link</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold transition-all flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-70"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling PDF...</span>
                </>
              ) : downloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Downloaded to Device</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
