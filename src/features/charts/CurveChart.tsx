import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GradingConfig } from '@/domain/types';
import { calculateGrade } from '@/domain/grading';
import { Card, CardHeader } from '@/components/ui/Card';
import { useTranslation } from '@/i18n/useTranslation';
import { useAppStore } from '@/state/useAppStore';

interface CurveChartProps {
  config: GradingConfig;
}

export function CurveChart({ config }: CurveChartProps) {
  const t = useTranslation();
  const isDark = useAppStore((s) => s.settings.darkMode);

  const data = useMemo(() => {
    const steps = 100;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const points = (i / steps) * config.maxPossiblePoints;
      return {
        points: Number(points.toFixed(1)),
        grade: calculateGrade(points, config),
      };
    });
  }, [config]);

  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';

  return (
    <Card>
      <CardHeader title={t.stats.curve} />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="points"
              tick={{ fontSize: 11, fill: axisColor }}
              tickLine={false}
              axisLine={false}
              label={{ value: t.common.points, position: 'insideBottom', offset: -2, fontSize: 10, fill: axisColor }}
            />
            <YAxis
              domain={[config.gradeMin, config.gradeMax]}
              tick={{ fontSize: 11, fill: axisColor }}
              tickLine={false}
              axisLine={false}
              label={{ value: t.common.grade, angle: -90, position: 'insideLeft', fontSize: 10, fill: axisColor }}
            />
            <Tooltip
              contentStyle={{
                background: isDark ? '#1e293b' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => value.toFixed(2)}
            />
            <ReferenceLine y={4} stroke="var(--color-success)" strokeDasharray="4 4" strokeOpacity={0.7} />
            <ReferenceLine x={config.pointsFor4} stroke={axisColor} strokeDasharray="2 2" strokeOpacity={0.5} />
            <ReferenceLine x={config.pointsFor6} stroke={axisColor} strokeDasharray="2 2" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="grade" stroke="var(--color-accent)" strokeWidth={2.5} fill="url(#curveGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
