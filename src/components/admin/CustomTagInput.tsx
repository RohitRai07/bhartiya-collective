import React, { useState, useEffect, useRef } from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { X, Plus } from 'lucide-react';

interface CustomTagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  helperText?: string;
}

export const CustomTagInput: React.FC<CustomTagInputProps> = ({
  label,
  tags = [],
  onChange,
  placeholder = 'Type custom tag and press Enter...',
  helperText = 'Press Enter or comma to add tag. Click ✕ to remove.',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadTags = () => {
    setSuggestedTags(taxonomyService.getAllTags());
  };

  useEffect(() => {
    loadTags();
    const handleUpdate = () => loadTags();
    window.addEventListener('bharat:taxonomy-updated', handleUpdate);
    return () => window.removeEventListener('bharat:taxonomy-updated', handleUpdate);
  }, []);

  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.trim().replace(/^#+/, '');
    if (!clean) return;

    if (!tags.some(t => t.toLowerCase() === clean.toLowerCase())) {
      const updated = [...tags, clean];
      onChange(updated);
      taxonomyService.addTag(clean);
      loadTags();
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const availableSuggestions = suggestedTags.filter(
    st => !tags.some(t => t.toLowerCase() === st.toLowerCase())
  );

  return (
    <div className="space-y-1.5">
      {/* Clean Header with Label Only */}
      <label className="block text-xs font-bold text-slate-900">
        {label}
      </label>

      {/* Main Tag Chips Container + Input Box */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className="min-h-[42px] p-2 bg-slate-50 focus-within:bg-white border border-slate-200 focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-600 rounded-xl flex flex-wrap items-center gap-1.5 cursor-text transition-all"
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100/80 text-amber-950 border border-amber-300 shadow-2xs animate-in zoom-in-95 duration-100"
          >
            <span>#{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag);
              }}
              className="text-amber-800 hover:text-red-700 p-0.5 rounded-full hover:bg-amber-200 cursor-pointer transition-colors"
              title={`Remove #${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) handleAddTag(inputValue);
          }}
          placeholder={tags.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[140px] text-xs bg-transparent border-none outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400 py-1"
        />
      </div>

      {/* Quick Select Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="space-y-1 pt-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Suggested Tags (click to add):
          </span>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
            {availableSuggestions.slice(0, 15).map((sugg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAddTag(sugg)}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-900 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-2.5 h-2.5 text-slate-400" />
                <span>{sugg}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
