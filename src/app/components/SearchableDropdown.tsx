import { KeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  label?: string;
  value: string;
  options: DropdownOption[];
  placeholder: string;
  searchPlaceholder?: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}

export function SearchableDropdown({
  label,
  value,
  options,
  placeholder,
  searchPlaceholder = 'Search...',
  error,
  helperText,
  loading = false,
  loadingText = 'Loading...',
  emptyText = 'No results found',
  disabled = false,
  required = false,
  onChange
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    listMaxHeight: 240
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useLayoutEffect(() => {
    if (!open || !containerRef.current) return;

    const updateMenuPosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const gap = 8;
      const searchAreaHeight = 54;
      const preferredListHeight = 240;
      const preferredMenuHeight = searchAreaHeight + preferredListHeight;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openAbove = spaceBelow < preferredMenuHeight && spaceAbove > spaceBelow;
      const availableSpace = Math.max(140, openAbove ? spaceAbove : spaceBelow);
      const listMaxHeight = Math.max(96, Math.min(preferredListHeight, availableSpace - searchAreaHeight));
      const menuHeight = searchAreaHeight + listMaxHeight;

      setMenuStyle({
        left: rect.left,
        top: openAbove ? Math.max(gap, rect.top - menuHeight - gap) : rect.bottom + gap,
        width: rect.width,
        listMaxHeight
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, filteredOptions.length]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }, [open, query]);

  const selectOption = (option: DropdownOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (!open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' && filteredOptions[activeIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    }
  };

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        className="fixed z-[1150] rounded-[var(--radius-card)] border border-border bg-card/95 backdrop-blur shadow-xl overflow-hidden"
        style={{ left: menuStyle.left, top: menuStyle.top, width: menuStyle.width }}
        onKeyDown={handleKeyDown}
      >
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-9 rounded-[var(--radius-input)] border border-input bg-input-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-1" style={{ maxHeight: menuStyle.listMaxHeight }}>
          {loading && <div className="px-3 py-3 text-sm text-muted-foreground">{loadingText}</div>}
          {!loading && filteredOptions.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground">{emptyText}</div>
          )}
          {!loading &&
            filteredOptions.map((option, index) => {
              const active = option.value === value;
              const keyboardActive = index === activeIndex;

              return (
                <button
                  type="button"
                  key={option.value}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={`w-full flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : keyboardActive
                      ? 'bg-accent'
                      : 'hover:bg-accent'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <Check size={16} />}
                </button>
              );
            })}
        </div>
      </div>,
      document.body
    );

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
          disabled={disabled}
          onClick={() => {
            if (!disabled) setOpen((current) => !current);
          }}
          onKeyDown={handleKeyDown}
          aria-expanded={open}
          className={`
            w-full min-h-11 px-4 pr-12 rounded-[var(--radius-input)] border bg-card/95 text-left
            shadow-sm shadow-primary-700/5 transition-all
            ${selectedOption ? 'text-foreground' : 'text-neutral-400'}
            ${error ? 'border-destructive focus:ring-destructive' : 'border-input hover:border-primary-500/40 hover:bg-primary-50/30 focus:border-primary-500 focus:ring-primary-500/20'}
            focus:outline-none focus:ring-4
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card/95
          `}
        >
          <span className="block truncate text-sm">{selectedOption?.label || placeholder}</span>
          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 rounded-lg bg-primary-50 p-1 transition-transform ${open ? 'rotate-180' : ''}`}
            size={18}
          />
        </button>
      </div>
      {menu}

      {error && <p className="text-sm text-destructive mt-1.5">{error}</p>}
      {!error && helperText && <p className="text-sm text-muted-foreground mt-1.5">{helperText}</p>}
    </div>
  );
}
