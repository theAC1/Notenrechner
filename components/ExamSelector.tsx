import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Search, Check } from 'lucide-react';
import { Exam, Language } from '../types';
import { TRANSLATIONS, calculateStats } from '../utils';

interface ExamSelectorProps {
  activeExam: Exam | null;
  exams: Exam[];
  onSelect: (examId: string) => void;
  onCreateNew: () => void;
  lang: Language;
}

const ExamSelector: React.FC<ExamSelectorProps> = ({
  activeExam,
  exams,
  onSelect,
  onCreateNew,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter exams by search query
  const filteredExams = exams.filter(exam => {
    const query = searchQuery.toLowerCase();
    return (
      exam.name.toLowerCase().includes(query) ||
      exam.subject?.toLowerCase().includes(query) ||
      exam.date.includes(searchQuery)
    );
  });

  // Sort by date (newest first)
  const sortedExams = [...filteredExams].sort((a, b) => b.date.localeCompare(a.date));

  const handleSelect = (examId: string) => {
    onSelect(examId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-w-[280px]"
      >
        <div className="flex-1 text-left">
          {activeExam ? (
            <>
              <div className="font-semibold text-slate-800 dark:text-white text-sm">
                {activeExam.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {activeExam.subject && `${activeExam.subject} • `}
                {formatDate(activeExam.date)}
              </div>
            </>
          ) : (
            <div className="text-slate-500 dark:text-slate-400 text-sm">
              {lang === 'de' ? 'Keine Prüfung ausgewählt' : lang === 'fr' ? 'Aucun examen sélectionné' : 'No exam selected'}
            </div>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[320px] max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Search */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'de' ? 'Prüfungen suchen...' : lang === 'fr' ? 'Rechercher des examens...' : 'Search exams...'}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          </div>

          {/* Exam List */}
          <div className="max-h-[400px] overflow-y-auto">
            {sortedExams.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                {searchQuery
                  ? (lang === 'de' ? 'Keine Prüfungen gefunden' : lang === 'fr' ? 'Aucun examen trouvé' : 'No exams found')
                  : (lang === 'de' ? 'Keine Prüfungen vorhanden' : lang === 'fr' ? 'Aucun examen disponible' : 'No exams available')
                }
              </div>
            ) : (
              sortedExams.map(exam => {
                const stats = calculateStats(exam.students);
                const isActive = activeExam?.id === exam.id;

                return (
                  <button
                    key={exam.id}
                    onClick={() => handleSelect(exam.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
                      isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <Check size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                          )}
                          <div className="font-medium text-slate-800 dark:text-white text-sm truncate">
                            {exam.name}
                          </div>
                        </div>
                        {exam.subject && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {exam.subject}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>{formatDate(exam.date)}</span>
                          <span>•</span>
                          <span>
                            {exam.students.length} {lang === 'de' ? 'Schüler' : lang === 'fr' ? 'étudiants' : 'students'}
                          </span>
                          {exam.students.length > 0 && (
                            <>
                              <span>•</span>
                              <span>
                                Ø {stats.average.toFixed(1)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Create New */}
          <button
            onClick={() => {
              onCreateNew();
              setIsOpen(false);
              setSearchQuery('');
            }}
            className="w-full px-4 py-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-t border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-medium text-sm"
          >
            <Plus size={18} />
            {lang === 'de' ? 'Neue Prüfung erstellen' : lang === 'fr' ? 'Créer un nouvel examen' : 'Create new exam'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamSelector;
