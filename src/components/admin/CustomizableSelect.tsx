import React, { useState, useEffect } from 'react';
import { taxonomyService, DropdownOption } from '../../services/taxonomyService';

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

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Clean Header with Label Only (No '+ Add Option' button) */}
      <label className="block text-xs font-bold text-slate-900">
        {label} {required && <span className="text-amber-800">*</span>}
      </label>

      {/* Main Select Dropdown loaded reactively from Custom Tags & Dropdown Options tab */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:ring-1 focus:ring-amber-600 focus:border-amber-600 cursor-pointer"
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
