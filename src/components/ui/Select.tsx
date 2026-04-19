import * as RSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<SelectOption>;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

export function Select({ value, onValueChange, options, placeholder, className, ...rest }: SelectProps) {
  return (
    <RSelect.Root value={value} onValueChange={onValueChange}>
      <RSelect.Trigger
        aria-label={rest['aria-label']}
        className={cn(
          'input flex items-center justify-between gap-2 text-left',
          className,
        )}
      >
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon>
          <ChevronDown size={16} className="text-[var(--color-fg-muted)]" />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content className="glass overflow-hidden z-50 min-w-[var(--radix-select-trigger-width)]" position="popper" sideOffset={4}>
          <RSelect.Viewport className="p-1.5">
            {options.map((opt) => (
              <RSelect.Item
                key={opt.value}
                value={opt.value}
                className="relative flex items-start gap-2 px-2.5 py-2 text-sm rounded-md cursor-pointer outline-none data-[highlighted]:bg-[var(--color-bg-subtle)] data-[state=checked]:text-[var(--color-accent)]"
              >
                <RSelect.ItemIndicator className="mt-0.5">
                  <Check size={14} />
                </RSelect.ItemIndicator>
                <div className="flex-1 pl-5 data-[state=checked]:pl-0">
                  <RSelect.ItemText>{opt.label}</RSelect.ItemText>
                  {opt.description && (
                    <div className="text-xs text-[var(--color-fg-muted)]">{opt.description}</div>
                  )}
                </div>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
