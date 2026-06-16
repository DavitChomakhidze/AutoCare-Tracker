import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={`
        modern-card bg-card/95 backdrop-blur rounded-[var(--radius-card)] border border-border/80
        ${paddingStyles[padding]}
        ${hover ? 'modern-card-hover' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({ icon, label, value, trend, className = '', onClick }: StatCardProps) {
  return (
    <Card
      padding="md"
      hover
      className={`${onClick ? 'cursor-pointer focus-within:ring-2 focus-within:ring-primary-500/40' : ''} ${className}`}
    >
      {onClick && (
        <button
          type="button"
          onClick={onClick}
          aria-label={`Open ${label}`}
          className="absolute inset-0 z-10 rounded-[var(--radius-card)] focus:outline-none"
        />
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-2">{trend}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg modern-chip border flex items-center justify-center text-primary-600 shadow-sm">
          {icon}
        </div>
      </div>
    </Card>
  );
}
