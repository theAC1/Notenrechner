import * as RSlider from '@radix-ui/react-slider';
import { cn } from '@/lib/cn';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  'aria-label'?: string;
}

export function Slider({ value, onValueChange, min, max, step = 1, className, ...rest }: SliderProps) {
  return (
    <RSlider.Root
      aria-label={rest['aria-label']}
      className={cn('relative flex items-center select-none touch-none w-full h-5', className)}
      value={[value]}
      onValueChange={(v) => {
        const next = v[0];
        if (next !== undefined) onValueChange(next);
      }}
      min={min}
      max={max}
      step={step}
    >
      <RSlider.Track className="bg-[var(--color-bg-subtle)] relative grow rounded-full h-1.5">
        <RSlider.Range className="absolute bg-[var(--color-accent)] rounded-full h-full" />
      </RSlider.Track>
      <RSlider.Thumb className="block w-4 h-4 bg-white border-2 border-[var(--color-accent)] rounded-full shadow-md hover:scale-110 transition-transform focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]" />
    </RSlider.Root>
  );
}
