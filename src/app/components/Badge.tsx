import { ReactNode } from 'react';

type BadgeVariant =
  | 'completed'
  | 'scheduled'
  | 'upcoming'
  | 'due-soon'
  | 'overdue'
  | 'active'
  | 'archived'
  | 'draft'
  | 'paid'
  | 'cancelled'
  | 'healthy'
  | 'needs-attention';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ variant, children, icon, className = '' }: BadgeProps) {
  const variantStyles = {
    'completed': 'bg-success-50 text-success-700 border-success-500/20',
    'scheduled': 'bg-info-50 text-info-700 border-info-500/20',
    'upcoming': 'bg-primary-50 text-primary-700 border-primary-500/20',
    'due-soon': 'bg-warning-50 text-warning-700 border-warning-500/20',
    'overdue': 'bg-danger-50 text-danger-700 border-danger-500/20',
    'active': 'bg-success-50 text-success-700 border-success-500/20',
    'archived': 'bg-neutral-100 text-neutral-600 border-neutral-400/20',
    'draft': 'bg-neutral-100 text-neutral-600 border-neutral-400/20',
    'paid': 'bg-success-50 text-success-700 border-success-500/20',
    'cancelled': 'bg-neutral-100 text-neutral-600 border-neutral-400/20',
    'healthy': 'bg-success-50 text-success-700 border-success-500/20',
    'needs-attention': 'bg-danger-50 text-danger-700 border-danger-500/20'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}>
      {icon && <span className="w-3 h-3">{icon}</span>}
      {children}
    </span>
  );
}
