import { motion } from 'framer-motion';
import type { Stats } from '@/domain/types';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';

interface StatsPanelProps {
  stats: Stats;
  className?: string;
}

export function StatsPanel({ stats, className }: StatsPanelProps) {
  const t = useTranslation();
  const tiles = [
    { label: t.stats.average, value: stats.average.toFixed(2), accent: 'text-[var(--color-accent)]' },
    { label: t.stats.median, value: stats.median.toFixed(2) },
    { label: t.stats.passRate, value: `${stats.passRate.toFixed(1)}%`, accent: stats.passRate >= 50 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]' },
    { label: t.stats.stdDev, value: stats.stdDev.toFixed(2) },
    { label: t.stats.min, value: stats.min.toFixed(1) },
    { label: t.stats.max, value: stats.max.toFixed(1) },
    { label: t.stats.count, value: stats.count.toString() },
  ];

  return (
    <div className={cn('glass p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3', className)}>
      {tiles.map((tile, i) => (
        <motion.div
          key={tile.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className="text-center"
        >
          <div className={cn('text-2xl font-semibold tabular-nums tracking-tight', tile.accent)}>{tile.value}</div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)] mt-0.5 font-medium">
            {tile.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
