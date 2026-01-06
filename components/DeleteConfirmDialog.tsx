import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Exam, Language } from '../types';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  exam: Exam;
  lang: Language;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  exam,
  lang
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Failed to delete exam:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {lang === 'de' ? 'Prüfung löschen?' : lang === 'fr' ? 'Supprimer l\'examen?' : 'Delete Exam?'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            {lang === 'de'
              ? 'Möchten Sie diese Prüfung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
              : lang === 'fr'
              ? 'Voulez-vous vraiment supprimer cet examen? Cette action ne peut pas être annulée.'
              : 'Are you sure you want to delete this exam? This action cannot be undone.'
            }
          </p>

          {/* Exam Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="font-semibold text-slate-800 dark:text-white">
              {exam.name}
            </div>
            {exam.subject && (
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {exam.subject}
              </div>
            )}
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {exam.students.length} {lang === 'de' ? 'Schüler' : lang === 'fr' ? 'étudiants' : 'students'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {lang === 'de' ? 'Abbrechen' : lang === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isDeleting
              ? (lang === 'de' ? 'Lösche...' : lang === 'fr' ? 'Suppression...' : 'Deleting...')
              : (lang === 'de' ? 'Löschen' : lang === 'fr' ? 'Supprimer' : 'Delete')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;
