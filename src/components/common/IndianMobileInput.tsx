import React from 'react';
import { INDIAN_MOBILE_CONFIG, validateIndianMobile } from '../../services/contactValidation';
import { AlertCircle } from 'lucide-react';

export interface IndianMobileInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showError?: boolean;
  labelClassName?: string;
}

/**
 * Standardized Indian Mobile Number Input Component
 * 
 * Replicates the Career Page UX across the entire Bharat Collective website:
 * - 🇮🇳 +91 country code pill prefix
 * - Numeric-only sanitization on keystroke (filters out letters, spaces, symbols)
 * - Maximum 10 digits (maxLength={10})
 * - Standardized placeholder "9876543210"
 * - Standard inline error styling and message
 */
export const IndianMobileInput: React.FC<IndianMobileInputProps> = ({
  id = 'mobileNumber',
  name = 'mobileNumber',
  value,
  onChange,
  onBlur,
  error,
  label = 'Mobile Number (India)',
  required = false,
  disabled = false,
  placeholder = INDIAN_MOBILE_CONFIG.placeholder,
  className = '',
  inputClassName = '',
  showError = true,
  labelClassName = 'block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = INDIAN_MOBILE_CONFIG.sanitize(e.target.value);
    const validation = validateIndianMobile(cleaned);
    onChange(cleaned, validation.isValid);
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label} {required && <span className="text-amber-600">*</span>}
        </label>
      )}
      <div className="flex">
        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 font-semibold text-xs flex-shrink-0 select-none">
          {INDIAN_MOBILE_CONFIG.displayPrefix}
        </span>
        <input
          id={id}
          name={name}
          type="tel"
          maxLength={INDIAN_MOBILE_CONFIG.digitCount}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          className={`w-full px-3.5 py-2.5 rounded-r-xl border text-sm text-slate-900 bg-slate-50/50 transition-colors focus:border-amber-600 focus:bg-white focus:outline-none ${
            error ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
          } ${inputClassName}`}
        />
      </div>
      {showError && error && (
        <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
