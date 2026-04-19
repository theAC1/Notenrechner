import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import type { GradingConfig, Student } from '@/domain/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { useTranslation } from '@/i18n/useTranslation';
import { useAppStore } from '@/state/useAppStore';
import { solvePointsFor4ForPassRate } from '@/domain/grading';
import toast from 'react-hot-toast';

interface WhatIfSolverProps {
  config: GradingConfig;
  students: ReadonlyArray<Student>;
}

export function WhatIfSolver({ config, students }: WhatIfSolverProps) {
  const t = useTranslation();
  const updateActiveConfig = useAppStore((s) => s.updateActiveConfig);

  const [targetRate, setTargetRate] = useState(80);
  const [suggestion, setSuggestion] = useState<number | null>(null);

  const solve = (): void => {
    const result = solvePointsFor4ForPassRate(
      students.map((s) => ({ id: s.id, name: s.name, points: s.points })),
      targetRate,
      config,
    );
    setSuggestion(result);
    toast.success(t.toasts.solved);
  };

  const apply = (): void => {
    if (suggestion === null) return;
    void updateActiveConfig({ ...config, pointsFor4: Math.round(suggestion * 2) / 2 });
    toast.success(t.toasts.applied);
  };

  return (
    <Card>
      <CardHeader title={t.whatIf.title} subtitle={t.whatIf.description} />
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-fg-muted)]">{t.whatIf.targetPassRate}</span>
            <span className="text-sm font-semibold tabular-nums">{targetRate}%</span>
          </div>
          <Slider min={0} max={100} step={5} value={targetRate} onValueChange={setTargetRate} aria-label={t.whatIf.targetPassRate} />
        </div>

        <Button variant="primary" onClick={solve} disabled={students.length === 0} className="w-full">
          <Wand2 size={14} /> {t.whatIf.solve}
        </Button>

        {suggestion !== null && (
          <div className="glass-subtle p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">{t.whatIf.result}</div>
              <div className="text-xl font-bold tabular-nums text-[var(--color-accent)]">{suggestion.toFixed(1)}</div>
            </div>
            <Button variant="primary" size="sm" onClick={apply}>
              {t.whatIf.apply}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
