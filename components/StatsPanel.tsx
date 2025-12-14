import React from 'react';
import { Stats, Language } from '../types';
import { TRANSLATIONS } from '../utils';
import { Calculator, TrendingUp, Users, AlertCircle } from 'lucide-react';

interface StatsPanelProps {
  stats: Stats;
  lang: Language;
  variant?: 'cards' | 'tile';
  className?: string;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, lang, variant = 'cards', className = '' }) => {
  const t = TRANSLATIONS[lang];
  
  const items = [
    { label: t.stats.avg, value: stats.average, icon: Calculator, color: "bg-blue-500 text-blue-600 dark:text-blue-400" },
    { label: t.stats.median, value: stats.median, icon: TrendingUp, color: "bg-indigo-500 text-indigo-600 dark:text-indigo-400" },
    { label: t.stats.passRate, value: `${stats.passRate}%`, icon: Users, color: stats.passRate >= 80 ? "bg-emerald-500 text-emerald-600 dark:text-emerald-400" : "bg-orange-500 text-orange-600 dark:text-orange-400" },
    { label: t.stats.stdDev, value: stats.stdDev, icon: AlertCircle, color: "bg-slate-500 text-slate-600 dark:text-slate-400" }
  ];

  if (variant === 'tile') {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700 overflow-hidden transition-colors ${className}`}>
        {items.map((item, idx) => (
          <div key={idx} className="p-4 flex items-center justify-center gap-3">
             <div className={`p-2 rounded-lg ${item.color.split(' ')[0]} bg-opacity-10 dark:bg-opacity-20`}>
                <item.icon className={`w-4 h-4 ${item.color.replace('bg-', 'text-').split(' ').slice(1).join(' ')}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">{item.label}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{item.value}</p>
              </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3 transition-colors">
            <div className={`p-2 rounded-lg ${item.color.split(' ')[0]} bg-opacity-10 dark:bg-opacity-20`}>
              <item.icon className={`w-4 h-4 ${item.color.replace('bg-', 'text-').split(' ').slice(1).join(' ')}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">{item.label}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{item.value}</p>
            </div>
        </div>
      ))}
    </div>
  );
};

export default StatsPanel;