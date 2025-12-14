import React, { useMemo } from 'react';
import { GradingConfig, Language } from '../types';
import { getMinPointsForGrade, TRANSLATIONS } from '../utils';

interface GradeScaleTableProps {
  config: GradingConfig;
  lang: Language;
}

const GradeScaleTable: React.FC<GradeScaleTableProps> = ({ config, lang }) => {
  const t = TRANSLATIONS[lang];
  
  const scaleRows = useMemo(() => {
    const rows: { grade: number; minPoints: number }[] = [];
    const step = config.roundingStep;
    const epsilon = 0.0001;
    
    for (let g = config.gradeMax; g >= config.gradeMin; g -= step) {
      const currentGrade = Math.round(g * 100) / 100;
      let minRawGrade = currentGrade - (step / 2);
      
      if (currentGrade === config.gradeMin) {
        rows.push({ grade: currentGrade, minPoints: 0 });
        continue;
      }
      
      // We clamp minRawGrade to be at least MinGrade to avoid calculation errors
      if (minRawGrade < config.gradeMin) minRawGrade = config.gradeMin;

      let points = getMinPointsForGrade(minRawGrade + epsilon, config);
      points = Math.max(0, Math.min(config.maxPossiblePoints, points));
      
      rows.push({ grade: currentGrade, minPoints: points });
    }
    return rows;
  }, [config]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden transition-colors">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
        <h2 className="font-semibold text-lg text-slate-800 dark:text-white">{t.gradeScale}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Step {config.roundingStep}</p>
      </div>
      
      <div className="overflow-y-auto flex-1 p-0">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-750 sticky top-0">
            <tr>
              <th className="px-6 py-3 font-medium">{t.grade}</th>
              <th className="px-6 py-3 font-medium text-right">Min. {t.points}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {scaleRows.map((row) => (
              <tr key={row.grade} className={`hover:bg-slate-50 dark:hover:bg-slate-750 ${
                  row.grade >= 4.0 ? 'bg-white dark:bg-slate-800' : 'bg-red-50/30 dark:bg-red-900/10'
              }`}>
                <td className="px-6 py-2 font-bold text-slate-700 dark:text-slate-300">
                  <span className={`px-2 py-0.5 rounded ${
                      row.grade >= 4.0 
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                  }`}>
                    {row.grade.toFixed(config.roundingStep === 1 ? 0 : config.roundingStep === 0.25 ? 2 : 1)}
                  </span>
                </td>
                <td className="px-6 py-2 text-right font-mono text-slate-600 dark:text-slate-400">
                  {row.minPoints.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeScaleTable;