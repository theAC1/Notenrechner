import { useMemo } from 'react';
import type { AlgorithmType, GradingConfig } from '@/domain/types';
import { ROUNDING_STEPS } from '@/domain/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { useTranslation } from '@/i18n/useTranslation';

interface ConfigPanelProps {
  config: GradingConfig;
  onChange: (config: GradingConfig) => void;
}

export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const t = useTranslation();

  const algorithmOptions: SelectOption[] = useMemo(
    () => [
      { value: 'LINEAR', label: t.config.linear, description: t.config.linearDesc },
      { value: 'NICE', label: t.config.nice, description: t.config.niceDesc },
      { value: 'HARD', label: t.config.hard, description: t.config.hardDesc },
    ],
    [t],
  );

  const roundingOptions: SelectOption[] = ROUNDING_STEPS.map((s) => ({
    value: String(s),
    label: String(s),
  }));

  const update = <K extends keyof GradingConfig>(key: K, value: GradingConfig[K]): void => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Card>
      <CardHeader title={t.config.title} />
      <div className="space-y-5">
        <Field label={t.config.maxPoints}>
          <Input
            type="number"
            min={1}
            step={1}
            value={config.maxPossiblePoints}
            onChange={(e) => update('maxPossiblePoints', Number(e.target.value) || 0)}
          />
        </Field>

        <SliderField
          label={`${t.config.pointsFor6}: ${config.pointsFor6}`}
          min={Math.max(1, config.pointsFor4 + 1)}
          max={config.maxPossiblePoints}
          value={config.pointsFor6}
          onChange={(v) => update('pointsFor6', v)}
        />

        <SliderField
          label={`${t.config.pointsFor4}: ${config.pointsFor4}`}
          min={config.pointsFor1}
          max={Math.max(1, config.pointsFor6 - 1)}
          value={config.pointsFor4}
          onChange={(v) => update('pointsFor4', v)}
        />

        <Field label={t.config.rounding}>
          <Select
            value={String(config.roundingStep)}
            onValueChange={(v) => update('roundingStep', Number(v) as GradingConfig['roundingStep'])}
            options={roundingOptions}
          />
        </Field>

        <Field label={t.config.algorithm}>
          <Select
            value={config.algorithm}
            onValueChange={(v) => update('algorithm', v as AlgorithmType)}
            options={algorithmOptions}
          />
        </Field>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function SliderField({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-2 tabular-nums">{label}</div>
      <Slider aria-label={label} min={min} max={max} value={value} onValueChange={onChange} />
    </div>
  );
}
