import { SelectHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

export function Select({
  label,
  error,
  helperText,
  options,
  placeholder,
  required,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          className={`
            w-full h-11 px-4 pr-12 rounded-[var(--radius-input)] border appearance-none
            bg-card/95 text-foreground shadow-sm shadow-primary-700/5
            transition-all cursor-pointer
            hover:border-primary-500/40 hover:bg-primary-50/30
            ${error ? 'border-destructive focus:ring-destructive' : 'border-input focus:border-primary-500 focus:ring-primary-500/20'}
            focus:outline-none focus:ring-4 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none rounded-lg bg-primary-50 p-1"
          size={18}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1.5">{error}</p>
      )}

      {!error && helperText && (
        <p className="text-sm text-muted-foreground mt-1.5">{helperText}</p>
      )}
    </div>
  );
}
