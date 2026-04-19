import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export function Card({ glass = false, className, children, ...props }: CardProps) {
  return (
    <div className={cn(glass ? 'glass' : 'card', 'p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4 gap-3">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-[var(--color-fg-base)]">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
