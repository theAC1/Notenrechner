import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'outline', size = 'md', className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn('btn', variants[variant], sizes[size], 'disabled:opacity-50 disabled:cursor-not-allowed', className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
