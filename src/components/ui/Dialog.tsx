import * as RDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, footer, className }: DialogProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 z-40" />
        <RDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 glass',
            className,
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <RDialog.Title className="text-lg font-semibold tracking-tight">{title}</RDialog.Title>
              {description && (
                <RDialog.Description className="text-sm text-[var(--color-fg-muted)] mt-1">
                  {description}
                </RDialog.Description>
              )}
            </div>
            <RDialog.Close className="btn btn-ghost p-1.5 -mr-2 -mt-2" aria-label="Close">
              <X size={18} />
            </RDialog.Close>
          </div>
          <div>{children}</div>
          {footer && <div className="flex items-center justify-end gap-2 mt-6">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
