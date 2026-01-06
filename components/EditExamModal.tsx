import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Exam, Language } from '../types';
import { TRANSLATIONS } from '../utils';

interface EditExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { name: string; subject?: string; date: string }) => Promise<void>;
  exam: Exam;
  lang: Language;
}

const EditExamModal: React.FC<EditExamModalProps> = ({
  isOpen,
  onClose,
  onSave,
  exam,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [formData, setFormData] = useState({
    name: exam.name,
    subject: exam.subject || '',
    date: exam.date
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when exam changes
  useEffect(() => {
    setFormData({
      name: exam.name,
      subject: exam.subject || '',
      date: exam.date
    });
  }, [exam]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name,
        subject: formData.subject || undefined,
        date: formData.date
      });
      onClose();
    } catch (error) {
      console.error('Failed to update exam:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {lang === 'de' ? 'Prüfung bearbeiten' : lang === 'fr' ? 'Modifier l\'examen' : 'Edit Exam'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Exam Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'de' ? 'Prüfungsname' : lang === 'fr' ? 'Nom de l\'examen' : 'Exam Name'} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              required
              autoFocus
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'de' ? 'Fach (optional)' : lang === 'fr' ? 'Matière (optionnel)' : 'Subject (optional)'}
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'de' ? 'Datum' : lang === 'fr' ? 'Date' : 'Date'}
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {lang === 'de' ? 'Abbrechen' : lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting
                ? (lang === 'de' ? 'Speichere...' : lang === 'fr' ? 'Enregistrement...' : 'Saving...')
                : (lang === 'de' ? 'Speichern' : lang === 'fr' ? 'Enregistrer' : 'Save')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExamModal;
