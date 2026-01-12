import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Copy, Trash2, FileDown } from 'lucide-react';
import { Exam, Language } from '../types';
import { TRANSLATIONS } from '../utils';

interface ExamOptionsMenuProps {
  exam: Exam;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
  lang: Language;
}

const ExamOptionsMenu: React.FC<ExamOptionsMenuProps> = ({
  exam,
  onEdit,
  onDuplicate,
  onDelete,
  onExport,
  lang
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title={lang === 'de' ? 'Optionen' : lang === 'fr' ? 'Options' : 'Options'}
      >
        <MoreVertical size={20} className="text-slate-600 dark:text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
          {/* Edit */}
          <button
            onClick={() => handleAction(onEdit)}
            className="w-full px-4 py-2 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-left"
          >
            <Edit3 size={16} className="text-slate-500 dark:text-slate-400" />
            {lang === 'de' ? 'Bearbeiten' : lang === 'fr' ? 'Modifier' : 'Edit'}
          </button>

          {/* Duplicate */}
          <button
            onClick={() => handleAction(onDuplicate)}
            className="w-full px-4 py-2 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-left"
          >
            <Copy size={16} className="text-slate-500 dark:text-slate-400" />
            {lang === 'de' ? 'Duplizieren' : lang === 'fr' ? 'Dupliquer' : 'Duplicate'}
          </button>

          {/* Export */}
          <button
            onClick={() => handleAction(onExport)}
            className="w-full px-4 py-2 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-left border-b border-slate-200 dark:border-slate-700"
          >
            <FileDown size={16} className="text-slate-500 dark:text-slate-400" />
            {lang === 'de' ? 'Exportieren' : lang === 'fr' ? 'Exporter' : 'Export'}
          </button>

          {/* Delete */}
          <button
            onClick={() => handleAction(onDelete)}
            className="w-full px-4 py-2 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
          >
            <Trash2 size={16} />
            {lang === 'de' ? 'Löschen' : lang === 'fr' ? 'Supprimer' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamOptionsMenu;
