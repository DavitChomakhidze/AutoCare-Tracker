import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface YearPickerProps {
  label?: string;
  value: string;
  minYear?: number;
  maxYear?: number;
  placeholder?: string;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

export function YearPicker({
  label,
  value,
  minYear = 1950,
  maxYear = new Date().getFullYear(),
  placeholder = 'Select year',
  required = false,
  error,
  onChange
}: YearPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedYear = value ? Number(value) : maxYear;
  const [decadeStart, setDecadeStart] = useState(Math.floor(selectedYear / 12) * 12);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleYears = useMemo(
    () => Array.from({ length: 12 }, (_, index) => decadeStart + index),
    [decadeStart]
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`
            w-full h-11 px-4 pr-12 rounded-[var(--radius-input)] border bg-card/95 text-left shadow-sm shadow-primary-700/5 transition-all
            ${value ? 'text-foreground' : 'text-neutral-400'}
            ${error ? 'border-destructive focus:ring-destructive' : 'border-input hover:border-primary-500/40 hover:bg-primary-50/30 focus:border-primary-500 focus:ring-primary-500/20'}
            focus:outline-none focus:ring-4
          `}
        >
          <span className="text-sm">{value || placeholder}</span>
          <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 rounded-lg bg-primary-50 p-1" />
        </button>

        {open && (
          <div className="absolute z-40 mt-2 w-full min-w-[260px] rounded-[var(--radius-card)] border border-border bg-card/95 backdrop-blur shadow-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center disabled:opacity-40"
                disabled={decadeStart <= minYear}
                onClick={() => setDecadeStart((current) => Math.max(minYear, current - 12))}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium">
                {visibleYears[0]} - {visibleYears[visibleYears.length - 1]}
              </span>
              <button
                type="button"
                className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center disabled:opacity-40"
                disabled={decadeStart + 12 > maxYear}
                onClick={() => setDecadeStart((current) => Math.min(maxYear - 11, current + 12))}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {visibleYears.map((year) => {
                const disabled = year < minYear || year > maxYear;
                const active = value === String(year);

                return (
                  <button
                    type="button"
                    key={year}
                    disabled={disabled}
                    onClick={() => {
                      onChange(String(year));
                      setOpen(false);
                    }}
                    className={`h-10 rounded-md text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive mt-1.5">{error}</p>}
    </div>
  );
}
