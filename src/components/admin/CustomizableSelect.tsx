import React, { useState, useEffect } from 'react';
import { taxonomyService, DropdownOption } from '../../services/taxonomyService';
import { Plus, Trash2, Check, Settings2, Sparkles } from 'lucide-react';

interface CustomizableSelectProps {
  label: string;
  groupKey: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const CustomizableSelect: React.FC<CustomizableSelectProps> = ({
  label,
  groupKey,
  value,
  onChange,
  helperText,
  required = false,
  className = '',
  placeholder = 'Select option...',
}) => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [showManageMode, setShowManageMode] = useState(false);

  const load = () => {
    const list = taxonomyService.getOptions(groupKey);
    setOptions(list);
  };

  useEffect(() => {
    load();
    const handleUpdate = () => load();
    window.addEventListener('bharat:taxonomy-updated', handleUpdate);
    return () => window.removeEventListener('bharat:taxonomy-updated', handleUpdate);
  }, [groupKey]);

  const handleAddNew = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newOptionLabel.trim();
    if (!clean) return;

    try {
      const added = taxonomyService.addOption(groupKey, clean);
      onChange(added.value);
      setNewOptionLabel('');
      setShowAddInput(false);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to add option.');
    }
  };

  const handleDeleteOption = (optValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete option "${optValue}" from dropdown?`)) {
      taxonomyService.removeOption(groupKey, optValue);
      load();
      if (value === optValue) {
        const remaining = options.filter(o => o.value !== optValue);
        if (remaining.length > 0) {
          onChange(remaining[0].value);
        }
      }
    }
  };

  const customCount = options.filter(o => o.isCustom).length;

  return (
    <div className={`space-y-1.5 ${className}`}>
      
      {/* Header with Label and Add/Manage Action buttons */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-900">
          {label} {required && <span className="text-amber-800">*</span>}
        </label>

        <div className="flex items-center space-x-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setShowAddInput(!showAddInput)}
            className="text-amber-800 hover:text-amber-900 font-bold flex items-center space-x-0.5 cursor-pointer hover:underline"
            title="Add a custom option to this dropdown"
          >
            <Plus className="w-3 h-3" />
            <span>{showAddInput ? 'Cancel' : '+ Add Option'}</span>
          </button>

          {customCount > 0 && (
            <button
              type="button"
              onClick={() => setShowManageMode(!showManageMode)}
              className={`p-1 rounded font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                showManageMode 
                  ? 'bg-amber-100 text-amber-900' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Manage and delete custom options"
            >
              <Settings2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Form to Add New Option (triggers on Enter or click) */}
      {showAddInput && (
        <form onSubmit={handleAddNew} className="flex items-center gap-1.5 p-2 bg-amber-50/70 border border-amber-300 rounded-xl shadow-2xs animate-in slide-in-from-top-1 duration-150">
          <input
            type="text"
            autoFocus
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            placeholder="Type new option name & press Enter..."
            className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Add & Select
          </button>
        </form>
      )}

      {/* Main Select Dropdown */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:ring-1 focus:ring-amber-600 focus:border-amber-600 cursor-pointer"
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} {opt.isCustom ? '★ (Custom)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Manage Options Drawer (Shows Delete buttons for custom options) */}
      {showManageMode && customCount > 0 && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Custom Options in this Dropdown ({customCount}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {options.filter(o => o.isCustom).map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 shadow-2xs font-medium text-slate-800"
              >
                <span>{opt.label}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteOption(opt.value, e)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0.5 rounded cursor-pointer transition-colors"
                  title={`Delete "${opt.label}"`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
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
