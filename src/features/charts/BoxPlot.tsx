import { useMemo } from 'react';
import type { Student } from '@/domain/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { useTranslation } from '@/i18n/useTranslation';
import { percentiles } from '@/domain/stats';

interface BoxPlotProps {
  students: ReadonlyArray<Student>;
  gradeMin: number;
  gradeMax: number;
}

export function BoxPlot({ students, gradeMin, gradeMax }: BoxPlotProps) {
  const t = useTranslation();
  const grades = useMemo(() => students.map((s) => s.grade), [students]);
  const p = useMemo(() => percentiles(grades), [grades]);

  if (grades.length === 0) {
    return (
      <Card>
        <CardHeader title={t.stats.boxplot} />
        <div className="text-sm text-[var(--color-fg-muted)] text-center py-8">—</div>
      </Card>
    );
  }

  const range = gradeMax - gradeMin;
  const pct = (v: number): number => ((v - gradeMin) / range) * 100;

  return (
    <Card>
      <CardHeader title={t.stats.boxplot} />
      <div className="relative h-12 mb-6">
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[var(--color-border)] -translate-y-1/2" />
        <div
          className="absolute top-1/2 h-[2px] bg-[var(--color-fg-muted)] -translate-y-1/2"
          style={{ left: `${pct(Math.max(gradeMin, p.lowerFence))}%`, right: `${100 - pct(Math.min(gradeMax, p.upperFence))}%` }}
        />
        <div
          className="absolute top-1/2 h-10 -translate-y-1/2 bg-[var(--color-accent-subtle)] border-2 border-[var(--color-accent)] rounded"
          style={{ left: `${pct(p.q1)}%`, width: `${pct(p.q3) - pct(p.q1)}%` }}
        />
        <div
          className="absolute top-1/2 h-10 w-[3px] -translate-y-1/2 bg-[var(--color-accent)]"
          style={{ left: `calc(${pct(p.q2)}% - 1.5px)` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <Stat label="Q1" value={p.q1} />
        <Stat label="Median" value={p.q2} />
        <Stat label="Q3" value={p.q3} />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold tabular-nums">{value.toFixed(2)}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)]">{label}</div>
    </div>
  );
}
