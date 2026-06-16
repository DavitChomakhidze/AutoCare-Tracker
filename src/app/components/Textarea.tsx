import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function Textarea({
  label,
  error,
  helperText,
  required,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <textarea
        className={`
          w-full min-h-[100px] px-3 py-2 rounded-[var(--radius-input)] border bg-input-background
          ${error ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'}
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          placeholder:text-neutral-400
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="text-sm text-destructive mt-1.5">{error}</p>
      )}

      {!error && helperText && (
        <p className="text-sm text-muted-foreground mt-1.5">{helperText}</p>
      )}
    </div>
  );
}
