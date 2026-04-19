import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Stats } from '@/domain/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { useTranslation } from '@/i18n/useTranslation';
import { useAppStore } from '@/state/useAppStore';

interface DistributionChartProps {
  stats: Stats;
}

export function DistributionChart({ stats }: DistributionChartProps) {
  const t = useTranslation();
  const isDark = useAppStore((s) => s.settings.darkMode);

  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';

  return (
    <Card>
      <CardHeader title={t.stats.distribution} />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...stats.distribution]} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: isDark ? '#1e293b' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              cursor={{ fill: isDark ? '#334155' : '#f1f5f9' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {stats.distribution.map((bucket) => (
                <Cell
                  key={bucket.bucket}
                  fill={bucket.lower >= 4 ? 'var(--color-success)' : 'var(--color-danger)'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
