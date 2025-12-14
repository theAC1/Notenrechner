import React from 'react';
import { GradingConfig, AlgorithmType, Language } from '../types';
import { TRANSLATIONS } from '../utils';
import { Settings, MousePointerClick } from 'lucide-react';

interface ConfigPanelProps {
  config: GradingConfig;
  onChange: (newConfig: GradingConfig) => void;
  lang: Language;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange, lang }) => {
  const t = TRANSLATIONS[lang];

  const handleChange = (key: keyof GradingConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    if (key === 'pointsFor6') {
      if (newConfig.pointsFor4 >= value) {
        newConfig.pointsFor4 = value * 0.6; 
      }
    }
    onChange(newConfig);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col overflow-y-auto transition-colors">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 shrink-0">
        <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="font-semibold text-lg text-slate-800 dark:text-white">
            {lang === 'de' ? 'Notenskala einstellen' : (lang === 'fr' ? 'Configuration' : 'Configuration')}
        </h2>
      </div>

      <div className="space-y-6 mt-4">
        {/* Points Configuration Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Max Possible Points */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
               {t.maxPossiblePoints}
            </label>
            <input
              type="number"
              min="1"
              value={config.maxPossiblePoints}
              onChange={(e) => handleChange('maxPossiblePoints', parseFloat(e.target.value) || 0)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Points for Grade 6 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-indigo-700 dark:text-indigo-400">
               {t.pointsFor6}
            </label>
            <input
              type="number"
              min="1"
              max={config.maxPossiblePoints}
              value={config.pointsFor6}
              onChange={(e) => handleChange('pointsFor6', parseFloat(e.target.value) || 0)}
              className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Points for Grade 4 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-emerald-700 dark:text-emerald-400">
               {t.pointsFor4}
            </label>
            <input
              type="number"
              min="1"
              max={config.pointsFor6}
              step="0.5"
              value={config.pointsFor4}
              onChange={(e) => handleChange('pointsFor4', parseFloat(e.target.value) || 0)}
              className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Rounding */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{t.rounding}</label>
            <select
              value={config.roundingStep}
              onChange={(e) => handleChange('roundingStep', parseFloat(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="0.1">0.1</option>
              <option value="0.25">0.25</option>
              <option value="0.5">0.5</option>
              <option value="1.0">1.0</option>
            </select>
          </div>
        </div>

        {/* Algorithm Selection */}
        <div className="space-y-3 pt-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.algorithm}</label>
          <div className="grid grid-cols-1 gap-3">
            
            <button
              onClick={() => handleChange('algorithm', AlgorithmType.LINEAR)}
              className={`group relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-md ${
                config.algorithm === AlgorithmType.LINEAR
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                  config.algorithm === AlgorithmType.LINEAR ? 'border-blue-600 dark:border-blue-400' : 'border-slate-400 dark:border-slate-500'
              }`}>
                  {config.algorithm === AlgorithmType.LINEAR && <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />}
              </div>
              <div>
                  <span className={`block font-semibold ${config.algorithm === AlgorithmType.LINEAR ? 'text-blue-900 dark:text-blue-200' : 'text-slate-700 dark:text-slate-300'}`}>
                      {t.linear}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{t.linearDesc}</span>
              </div>
            </button>
            
            <button
              onClick={() => handleChange('algorithm', AlgorithmType.NICE)}
              className={`group relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-md ${
                config.algorithm === AlgorithmType.NICE
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
               <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                  config.algorithm === AlgorithmType.NICE ? 'border-emerald-600 dark:border-emerald-400' : 'border-slate-400 dark:border-slate-500'
              }`}>
                  {config.algorithm === AlgorithmType.NICE && <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />}
              </div>
              <div>
                  <span className={`block font-semibold ${config.algorithm === AlgorithmType.NICE ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'}`}>
                      {t.nice}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{t.niceDesc}</span>
              </div>
            </button>
            
            <button
              onClick={() => handleChange('algorithm', AlgorithmType.HARD)}
              className={`group relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-md ${
                config.algorithm === AlgorithmType.HARD
                  ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-500 ring-1 ring-amber-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                  config.algorithm === AlgorithmType.HARD ? 'border-amber-600 dark:border-amber-400' : 'border-slate-400 dark:border-slate-500'
              }`}>
                  {config.algorithm === AlgorithmType.HARD && <div className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400" />}
              </div>
              <div>
                  <span className={`block font-semibold ${config.algorithm === AlgorithmType.HARD ? 'text-amber-900 dark:text-amber-200' : 'text-slate-700 dark:text-slate-300'}`}>
                      {t.hard}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{t.hardDesc}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ConfigPanel;