import { KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { DropdownOption } from './SearchableDropdown';

interface CompactDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CompactDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select option'
}: CompactDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.findIndex((option) => option.value === value)));
  const [menuStyle, setMenuStyle] = useState({ left: 0, top: 0, width: 0, maxHeight: 240 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

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
      const preferredHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openAbove = spaceBelow < preferredHeight && spaceAbove > spaceBelow;
      const maxHeight = Math.max(120, Math.min(preferredHeight, openAbove ? spaceAbove : spaceBelow));

      setMenuStyle({
        left: rect.left,
        top: openAbove ? Math.max(gap, rect.top - maxHeight - gap) : rect.bottom + gap,
        width: rect.width,
        maxHeight
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)));
  }, [open, options, value]);

  const selectOption = (option: DropdownOption) => {
    onChange(option.value);
    setOpen(false);
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
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' && options[activeIndex]) {
      event.preventDefault();
      selectOption(options[activeIndex]);
    }
  };

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        className="fixed z-[1150] rounded-[var(--radius-card)] border border-border bg-card/95 backdrop-blur shadow-xl overflow-y-auto p-1"
        style={{ left: menuStyle.left, top: menuStyle.top, width: menuStyle.width, maxHeight: menuStyle.maxHeight }}
        onKeyDown={handleKeyDown}
      >
        {options.map((option, index) => {
          const active = option.value === value;
          const keyboardActive = index === activeIndex;

          return (
            <button
              key={option.value}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
              className={`w-full flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                active ? 'bg-primary-50 text-primary-700' : keyboardActive ? 'bg-accent' : 'hover:bg-accent'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {active && <Check size={16} />}
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        className="
          w-full min-h-11 px-4 pr-12 rounded-[var(--radius-input)] border border-input bg-card/95 text-left text-foreground
          shadow-sm shadow-primary-700/5 transition-all
          hover:border-primary-500/40 hover:bg-primary-50/30
          focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20
        "
      >
        <span className="block truncate text-sm">{selectedOption?.label || placeholder}</span>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 rounded-lg bg-primary-50 p-1 transition-transform ${open ? 'rotate-180' : ''}`}
          size={18}
        />
      </button>
      {menu}
    </div>
  );
}
