import React, { useMemo } from 'react';
import { Student, GradingConfig, Language } from '../types';
import { calculateRawGrade, TRANSLATIONS } from '../utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine
} from 'recharts';

interface ChartProps {
  students?: Student[];
  config?: GradingConfig;
  lang: Language;
  isDarkMode?: boolean;
}

export const DistributionChart: React.FC<ChartProps> = ({ students = [], lang, isDarkMode = false }) => {
  const t = TRANSLATIONS[lang];
  
  const textColor = isDarkMode ? '#94a3b8' : '#64748b'; // slate-400 : slate-500
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9'; // slate-700 : slate-100
  const tooltipBg = isDarkMode ? '#1e293b' : '#fff'; // slate-800 : white
  const tooltipText = isDarkMode ? '#e2e8f0' : '#1e293b'; // slate-200 : slate-800

  const distributionData = useMemo(() => {
    const buckets = [
      { name: '1.0-1.9', min: 1, max: 2, count: 0, fill: '#ef4444' },
      { name: '2.0-2.9', min: 2, max: 3, count: 0, fill: '#f87171' },
      { name: '3.0-3.9', min: 3, max: 4, count: 0, fill: '#fca5a5' },
      { name: '4.0-4.9', min: 4, max: 5, count: 0, fill: '#34d399' },
      { name: '5.0-5.9', min: 5, max: 6, count: 0, fill: '#10b981' },
      { name: '6.0', min: 6, max: 7, count: 0, fill: '#059669' },
    ];

    students.forEach(s => {
      const g = s.grade;
      if (g >= 6) buckets[5].count++;
      else if (g >= 5) buckets[4].count++;
      else if (g >= 4) buckets[3].count++;
      else if (g >= 3) buckets[2].count++;
      else if (g >= 2) buckets[1].count++;
      else buckets[0].count++;
    });

    return buckets;
  }, [students]);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col overflow-hidden transition-colors">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 shrink-0">{t.gradeDistribution}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributionData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} tick={{ fill: textColor }} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: textColor }} />
            <Tooltip 
              cursor={{fill: isDarkMode ? '#334155' : '#f8fafc'}} 
              contentStyle={{ 
                backgroundColor: tooltipBg, 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                color: tooltipText
              }} 
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const GradingCurveChart: React.FC<ChartProps> = ({ config, lang, isDarkMode = false }) => {
  const t = TRANSLATIONS[lang];
  if (!config) return null;

  const textColor = isDarkMode ? '#94a3b8' : '#64748b'; 
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
  const tooltipBg = isDarkMode ? '#1e293b' : '#fff'; 
  const tooltipText = isDarkMode ? '#e2e8f0' : '#1e293b'; 

  const curveData = useMemo(() => {
    const data = [];
    const steps = 50; 
    const stepSize = config.maxPossiblePoints / steps;
    
    for (let i = 0; i <= steps; i++) {
      const points = i * stepSize;
      const grade = calculateRawGrade(points, config);
      data.push({ points: parseFloat(points.toFixed(1)), grade });
    }
    // Ensure exact key points are hit
    data.push({ points: config.pointsFor4, grade: 4.0 });
    data.push({ points: config.pointsFor6, grade: 6.0 });
    
    return data.sort((a,b) => a.points - b.points);
  }, [config]);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col overflow-hidden transition-colors">
       <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 shrink-0">{t.gradingCurve}</h3>
       <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curveData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="points" 
              type="number" 
              domain={[0, config.maxPossiblePoints]} 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: textColor }}
              label={{ value: t.points, position: 'insideBottomRight', offset: -5, fontSize: 10, fill: textColor }} 
            />
            <YAxis 
              domain={[config.gradeMin, config.gradeMax]} 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickCount={6}
              tick={{ fill: textColor }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: tooltipBg,
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                color: tooltipText
              }} 
            />
            <ReferenceLine y={4} stroke="#10b981" strokeDasharray="3 3" />
            <ReferenceLine x={config.pointsFor4} stroke="#f59e0b" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="grade" 
              stroke="#6366f1" 
              strokeWidth={2} 
              dot={false} 
              activeDot={{ r: 4 }} 
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
       </div>
    </div>
  );
};

// Default export wrapper
const Visualizations: React.FC<ChartProps & { students: Student[], config: GradingConfig }> = (props) => {
  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex-1">
        <DistributionChart {...props} />
      </div>
      <div className="flex-1">
        <GradingCurveChart {...props} />
      </div>
    </div>
  );
};

export default Visualizations;