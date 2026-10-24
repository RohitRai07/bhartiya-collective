import React, { useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { validateBroadcastTime, TIME_FORMAT_ERROR } from '../../utils/timeValidation';

export interface BroadcastTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string | null;
  onErrorChange?: (error: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export const BroadcastTimeInput: React.FC<BroadcastTimeInputProps> = ({
  value,
  onChange,
  label = 'Broadcast Time (IST) *',
  required = true,
  error: externalError,
  onErrorChange,
  className = '',
  disabled = false,
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const activeError = externalError !== undefined ? externalError : internalError;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);

    // If an error is currently visible, check if current text has become valid
    if (activeError) {
      const check = validateBroadcastTime(newVal);
      if (check.isValid) {
        setInternalError(null);
        onErrorChange?.(null);
      }
    }
  };

  const handleBlur = () => {
    if (!value || !value.trim()) {
      if (required) {
        const err = TIME_FORMAT_ERROR;
        setInternalError(err);
        onErrorChange?.(err);
      }
      return;
    }

    const result = validateBroadcastTime(value);
    if (!result.isValid) {
      const err = result.error || TIME_FORMAT_ERROR;
      setInternalError(err);
      onErrorChange?.(err);
    } else {
      // Auto-normalize format (e.g., lowercase "9:30 am" becomes "09:30 AM")
      onChange(result.formattedTime);
      setInternalError(null);
      onErrorChange?.(null);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block font-semibold text-slate-900 text-xs">
          {label}
        </label>
      )}

      <div className="relative">
        <Clock className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${activeError ? 'text-red-500' : 'text-slate-400'}`} />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="06:30 PM"
          className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
            activeError
              ? 'border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20 text-slate-900'
              : 'border-slate-300 focus:ring-1 focus:ring-red-600 focus:border-red-600 bg-white text-slate-900'
          }`}
        />
      </div>

      <p className="text-[11px] text-slate-500">
        Format: <span className="font-mono font-semibold text-slate-700">HH:MM AM/PM</span> (e.g., 09:30 AM, 12:00 PM, 06:45 PM, 11:15 PM)
      </p>

      {activeError && (
        <p className="text-[11px] text-red-600 font-medium flex items-center space-x-1 mt-0.5 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{activeError}</span>
        </p>
      )}
    </div>
  );
};
