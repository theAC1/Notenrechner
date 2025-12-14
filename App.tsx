import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GradingConfig, AlgorithmType, Student, Language } from './types';
import { calculateGrade, calculateStats, generateId, TRANSLATIONS } from './utils';
import ConfigPanel from './components/ConfigPanel';
import StudentTable from './components/StudentTable';
import { DistributionChart, GradingCurveChart } from './components/Visualizations';
import StatsPanel from './components/StatsPanel';
import GradeScaleTable from './components/GradeScaleTable';
import { Printer, LayoutTemplate, Presentation, Languages, Moon, Sun } from 'lucide-react';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Default Data
const DEFAULT_STUDENTS: Student[] = [
  { id: '1', name: 'Anna Muster', points: 42, grade: 0, isPassing: false },
  { id: '2', name: 'Beat Beispiel', points: 35, grade: 0, isPassing: false },
  { id: '3', name: 'Charlie Code', points: 58, grade: 0, isPassing: false },
  { id: '4', name: 'Dora Demo', points: 21, grade: 0, isPassing: false },
  { id: '5', name: 'Emil Example', points: 49, grade: 0, isPassing: false },
];

const DEFAULT_CONFIG: GradingConfig = {
  maxPossiblePoints: 60,
  pointsFor6: 55, // 6.0 at 55
  pointsFor4: 33, // 4.0 at 33 (60% of 55)
  gradeMin: 1.0,
  gradeMax: 6.0,
  roundingStep: 0.5,
  algorithm: AlgorithmType.LINEAR,
};

// Layout configurations
const defaultEditLayouts = {
  lg: [
    { i: 'config', x: 0, y: 0, w: 4, h: 10 },
    { i: 'dist', x: 0, y: 10, w: 4, h: 6 },
    { i: 'curve', x: 0, y: 16, w: 4, h: 6 },
    { i: 'table', x: 4, y: 0, w: 8, h: 22 },
  ],
  md: [
    { i: 'config', x: 0, y: 0, w: 5, h: 12 },
    { i: 'dist', x: 5, y: 0, w: 5, h: 6 },
    { i: 'curve', x: 5, y: 6, w: 5, h: 6 },
    { i: 'table', x: 0, y: 12, w: 10, h: 14 },
  ],
  sm: [
    { i: 'config', x: 0, y: 0, w: 6, h: 12 },
    { i: 'dist', x: 0, y: 12, w: 6, h: 6 },
    { i: 'curve', x: 0, y: 18, w: 6, h: 6 },
    { i: 'table', x: 0, y: 24, w: 6, h: 14 },
  ]
};

const defaultReportLayouts = {
  lg: [
    { i: 'dist', x: 0, y: 0, w: 6, h: 7 },
    { i: 'curve', x: 6, y: 0, w: 6, h: 7 },
    { i: 'table', x: 0, y: 7, w: 12, h: 20 },
  ],
  md: [
    { i: 'dist', x: 0, y: 0, w: 5, h: 6 },
    { i: 'curve', x: 5, y: 0, w: 5, h: 6 },
    { i: 'table', x: 0, y: 6, w: 10, h: 16 },
  ],
  sm: [
    { i: 'dist', x: 0, y: 0, w: 6, h: 6 },
    { i: 'curve', x: 0, y: 6, w: 6, h: 6 },
    { i: 'table', x: 0, y: 12, w: 6, h: 16 },
  ]
};

function App() {
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [config, setConfig] = useState<GradingConfig>(DEFAULT_CONFIG);
  const [isReportMode, setIsReportMode] = useState(false);
  const [lang, setLang] = useState<Language>('de');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // State for layouts to ensure persistence during resizing and updates
  const [layouts, setLayouts] = useState({
    edit: defaultEditLayouts,
    report: defaultReportLayouts
  });

  const t = TRANSLATIONS[lang];

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Real-time calculation effect
  const calculatedStudents = useMemo(() => {
    return students.map(s => {
      const g = calculateGrade(s.points, config);
      return {
        ...s,
        grade: g,
        isPassing: g >= 4.0
      };
    });
  }, [students, config]);

  const stats = useMemo(() => calculateStats(calculatedStudents), [calculatedStudents]);

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
  };

  const toggleReportMode = () => {
    setIsReportMode(!isReportMode);
  };

  const onLayoutChange = useCallback((layout: any, allLayouts: any) => {
    const mode = isReportMode ? 'report' : 'edit';
    setLayouts(prev => ({
      ...prev,
      [mode]: allLayouts
    }));
  }, [isReportMode]);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 transition-all flex flex-col ${isReportMode ? 'p-8 bg-white dark:bg-slate-900' : 'p-4 md:p-8'}`}>
      
      {/* Top Navigation / Header */}
      <header className="max-w-[1600px] mx-auto w-full mb-6 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <LayoutTemplate className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Notenrechner
            {isReportMode && <span className="text-slate-400 dark:text-slate-500 text-lg font-normal ml-2">{t.classroomMode}</span>}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Swiss Grade Calculator</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            onClick={toggleReportMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
              isReportMode 
              ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {isReportMode ? (
              <> <LayoutTemplate size={18} /> {t.editView} </>
            ) : (
              <> <Presentation size={18} /> {t.reportView} </>
            )}
          </button>
          {isReportMode && (
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm"
            >
              <Printer size={18} /> Print
            </button>
          )}
        </div>
      </header>

      {/* Print Header */}
      <div className="hidden print:block mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t.gradingCurve} Report</h1>
        <p className="text-slate-600">{new Date().toLocaleDateString()}</p>
      </div>

      <main className="max-w-[1600px] mx-auto w-full flex flex-col gap-6 flex-1">
        
        {/* Fixed KPI Tile */}
        <div className="print:hidden">
            <StatsPanel stats={stats} lang={lang} variant="tile" className="w-full" />
        </div>
        
        {/* Print Stats (visible only in print) */}
        <div className="hidden print:block">
           <StatsPanel stats={stats} lang={lang} variant="tile" className="w-full border-0 shadow-none" />
        </div>

        {/* Draggable Grid */}
        <div className="flex-1">
          <ResponsiveGridLayout
            className="layout"
            layouts={isReportMode ? layouts.report : layouts.edit}
            onLayoutChange={onLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={30}
            margin={[24, 24]}
            containerPadding={[0, 0]}
            draggableCancel="input, button, select, textarea"
          >
            {!isReportMode && (
              <div key="config">
                <ConfigPanel config={config} onChange={setConfig} lang={lang} />
              </div>
            )}
            
            <div key="dist">
               <DistributionChart students={calculatedStudents} lang={lang} isDarkMode={isDarkMode} />
            </div>

            <div key="curve">
               <GradingCurveChart config={config} lang={lang} isDarkMode={isDarkMode} />
            </div>

            <div key="table">
               {isReportMode ? (
                 <GradeScaleTable config={config} lang={lang} />
               ) : (
                 <StudentTable 
                   students={calculatedStudents} 
                   config={config} 
                   onUpdateStudents={handleUpdateStudents}
                   lang={lang} 
                 />
               )}
            </div>

          </ResponsiveGridLayout>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto w-full mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end print:hidden">
         <p className="text-slate-400 dark:text-slate-500 text-sm">
           {t.generatedBy}
         </p>

         <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
            <Languages size={16} className="ml-2 text-slate-400 dark:text-slate-500" />
            <div className="flex">
              <button 
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${lang === 'en' ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('de')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${lang === 'de' ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
              >
                DE
              </button>
              <button 
                onClick={() => setLang('fr')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${lang === 'fr' ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
              >
                FR
              </button>
            </div>
         </div>
      </footer>
      
       <footer className="hidden print:block mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm print:fixed print:bottom-0 print:w-full">
          <p>{t.generatedBy}</p>
        </footer>
    </div>
  );
}

export default App;