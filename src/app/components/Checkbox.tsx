import { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`inline-flex min-w-0 items-center gap-2 cursor-pointer ${className}`}>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          {...props}
        />
        <div className="w-5 h-5 border-2 border-input rounded bg-input-background peer-checked:bg-primary peer-checked:border-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground opacity-0 peer-checked:opacity-100" strokeWidth={3} />
        </div>
      </div>
      {label && <span className="text-sm select-none leading-5">{label}</span>}
    </label>
  );
}
