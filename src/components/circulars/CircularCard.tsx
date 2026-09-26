import React, { useState } from 'react';
import { Circular } from '../../types/circular';
import { pdfService } from '../../services/pdfService';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Eye, 
  Copy, 
  Check, 
  Scale, 
  Calendar, 
  Building2, 
  BookOpen, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Layers
} from 'lucide-react';

interface CircularCardProps {
  circular: Circular;
  onPreview: (circular: Circular) => void;
  onDownloadComplete?: (circular: Circular) => void;
}

export const CircularCard: React.FC<CircularCardProps> = ({ 
  circular, 
  onPreview,
  onDownloadComplete 
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await pdfService.downloadCircularPdf(circular);
      setDownloaded(true);
      if (onDownloadComplete) onDownloadComplete(circular);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to download circular PDF:', err);
      alert('Unable to generate PDF document at this moment. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCitation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const citation = `${circular.issuingAuthority}, "${circular.title}", ${circular.circularNumber} (${circular.releaseDate}).`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const getCategoryBadge = (cat: Circular['category']) => {
    switch (cat) {
      case 'constitution':
        return { label: 'Constitutional Lex', bg: 'bg-amber-100 text-amber-950 border-amber-300' };
      case 'acts_statutes':
        return { label: 'Statutory Act / Code', bg: 'bg-indigo-100 text-indigo-950 border-indigo-200' };
      case 'circulars_rules':
        return { label: 'Gazette Circular', bg: 'bg-sky-100 text-sky-950 border-sky-200' };
      case 'guidelines':
        return { label: 'Legal Guideline', bg: 'bg-emerald-100 text-emerald-950 border-emerald-200' };
      case 'model_bills':
        return { label: 'Model Framework', bg: 'bg-purple-100 text-purple-950 border-purple-200' };
      default:
        return { label: 'Legal Document', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const badge = getCategoryBadge(circular.category);

  return (
    <article className="bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      
      {/* Top Banner Ribbon */}
      <div className="p-5 sm:p-6 pb-4 space-y-3.5">
        
        {/* Category, Gazette Ref & Landmark Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg}`}>
              {badge.label}
            </span>

            {circular.important && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                <Sparkles className="w-2.5 h-2.5 mr-1" />
                Landmark
              </span>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[200px]" title={circular.circularNumber}>
            {circular.circularNumber}
          </span>
        </div>

        {/* Document Title */}
        <div>
          <h3 
            onClick={() => onPreview(circular)}
            className="font-serif text-lg sm:text-xl font-bold text-slate-900 group-hover:text-amber-900 transition-colors leading-snug cursor-pointer"
          >
            {circular.title}
          </h3>
          {circular.shortTitle && circular.shortTitle !== circular.title && (
            <p className="text-xs font-medium text-amber-800 mt-0.5">
              Also cited as: {circular.shortTitle}
            </p>
          )}
        </div>

        {/* Issuing Authority & Enactment Date */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 min-w-0" title={circular.issuingAuthority}>
            <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate font-medium">{circular.issuingAuthority}</span>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0 text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Enacted: {circular.releaseDate}</span>
          </div>
        </div>

        {/* Summary Description */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
          {circular.summary}
        </p>

        {/* Key Statutory Provisions Preview */}
        {circular.keyProvisions && circular.keyProvisions.length > 0 && (
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
              <Scale className="w-3 h-3 text-amber-800" />
              <span>Key Provisions & Articles:</span>
            </span>
            <ul className="space-y-1">
              {circular.keyProvisions.slice(0, 2).map((prov, i) => (
                <li key={i} className="text-[11px] text-slate-700 line-clamp-1 flex items-baseline space-x-1.5">
                  <span className="text-amber-800 font-bold shrink-0">•</span>
                  <span>{prov}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {circular.tags && circular.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {circular.tags.slice(0, 4).map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        )}

      </div>

      {/* Footer Action Bar */}
      <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        
        {/* Document Metadata Specs */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
            {circular.fileSize || 'PDF'}
          </span>
          <span>•</span>
          <span>{circular.language || 'English'}</span>
          {circular.pageCount && (
            <>
              <span>•</span>
              <span>{circular.pageCount} pp.</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          
          <button
            type="button"
            onClick={handleCopyCitation}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Copy standard Indian legal citation"
          >
            {copiedCitation ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onPreview(circular)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-900 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Read Text</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold transition-all flex items-center space-x-1.5 shadow-xs hover:shadow cursor-pointer disabled:opacity-70"
            title={`Download official PDF: ${circular.title}`}
          >
            {downloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Building...</span>
              </>
            ) : downloaded ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

        </div>

      </div>

    </article>
  );
};
