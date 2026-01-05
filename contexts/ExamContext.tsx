import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Exam, CreateExamData, GradingConfig, Student, ExamSortOption } from '../types';
import { examService } from '../services/examService';

interface ExamContextType {
  // State
  exams: Exam[];
  activeExam: Exam | null;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;

  // Operations
  createExam: (data: CreateExamData) => Promise<Exam | null>;
  switchExam: (id: string) => Promise<void>;
  updateExam: (id: string, updates: Partial<Exam>) => Promise<void>;
  updateActiveExamStudents: (students: Student[]) => Promise<void>;
  updateActiveExamConfig: (config: GradingConfig) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  duplicateExam: (id: string) => Promise<Exam | null>;

  // Utility
  refreshExams: () => Promise<void>;
  getSortedExams: (sortBy: ExamSortOption) => Exam[];
  getFilteredExams: (query: string) => Exam[];
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

interface ExamProviderProps {
  children: ReactNode;
  initialConfig: GradingConfig;
  initialStudents: Student[];
}

export const ExamProvider: React.FC<ExamProviderProps> = ({
  children,
  initialConfig,
  initialStudents
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load exams on mount
  useEffect(() => {
    loadExams();
  }, []);

  /**
   * Load all exams from storage
   */
  const loadExams = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allExams = await examService.getAllExams();

      if (allExams.length === 0) {
        // First time user - migrate from legacy state
        const migratedExam = await examService.migrateFromLegacyState(
          initialStudents,
          initialConfig
        );
        setExams([migratedExam]);
        setActiveExam(migratedExam);
      } else {
        setExams(allExams);

        // Load active exam
        const activeId = await examService.getActiveExamId();
        if (activeId) {
          const active = allExams.find(e => e.id === activeId);
          setActiveExam(active || allExams[0]);
        } else {
          setActiveExam(allExams[0]);
          await examService.setActiveExamId(allExams[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exams');
      console.error('Error loading exams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new exam
   */
  const createExam = async (data: CreateExamData): Promise<Exam | null> => {
    setIsSaving(true);
    setError(null);

    try {
      const newExam = await examService.createExam(data, initialConfig);

      // Update state
      setExams(prev => [...prev, newExam]);
      setActiveExam(newExam);
      await examService.setActiveExamId(newExam.id);

      return newExam;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exam');
      console.error('Error creating exam:', err);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Switch to a different exam
   */
  const switchExam = async (id: string): Promise<void> => {
    const exam = exams.find(e => e.id === id);
    if (!exam) {
      setError('Exam not found');
      return;
    }

    setActiveExam(exam);
    await examService.setActiveExamId(id);
  };

  /**
   * Update an exam
   */
  const updateExam = async (id: string, updates: Partial<Exam>): Promise<void> => {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await examService.updateExam(id, updates);
      if (!updated) {
        throw new Error('Exam not found');
      }

      // Update state
      setExams(prev => prev.map(e => e.id === id ? updated : e));

      // Update active exam if it's the one being updated
      if (activeExam?.id === id) {
        setActiveExam(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update exam');
      console.error('Error updating exam:', err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Update students for active exam (convenience method)
   */
  const updateActiveExamStudents = async (students: Student[]): Promise<void> => {
    if (!activeExam) return;
    await updateExam(activeExam.id, { students });
  };

  /**
   * Update config for active exam (convenience method)
   */
  const updateActiveExamConfig = async (config: GradingConfig): Promise<void> => {
    if (!activeExam) return;
    await updateExam(activeExam.id, { config });
  };

  /**
   * Delete an exam
   */
  const deleteExam = async (id: string): Promise<void> => {
    setError(null);

    try {
      await examService.deleteExam(id);

      // Update state
      const remainingExams = exams.filter(e => e.id !== id);
      setExams(remainingExams);

      // Switch to another exam if we deleted the active one
      if (activeExam?.id === id) {
        if (remainingExams.length > 0) {
          const nextExam = remainingExams[0];
          setActiveExam(nextExam);
          await examService.setActiveExamId(nextExam.id);
        } else {
          setActiveExam(null);
          await examService.setActiveExamId(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exam');
      console.error('Error deleting exam:', err);
    }
  };

  /**
   * Duplicate an exam
   */
  const duplicateExam = async (id: string): Promise<Exam | null> => {
    setIsSaving(true);
    setError(null);

    try {
      const duplicated = await examService.duplicateExam(id);
      if (!duplicated) {
        throw new Error('Exam not found');
      }

      // Update state
      setExams(prev => [...prev, duplicated]);
      setActiveExam(duplicated);
      await examService.setActiveExamId(duplicated.id);

      return duplicated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate exam');
      console.error('Error duplicating exam:', err);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Refresh exams from storage
   */
  const refreshExams = async (): Promise<void> => {
    await loadExams();
  };

  /**
   * Get sorted exams
   */
  const getSortedExams = useCallback((sortBy: ExamSortOption): Exam[] => {
    return examService.sortExams(exams, sortBy);
  }, [exams]);

  /**
   * Get filtered exams
   */
  const getFilteredExams = useCallback((query: string): Exam[] => {
    return examService.filterExams(exams, query);
  }, [exams]);

  const value: ExamContextType = {
    exams,
    activeExam,
    isLoading,
    error,
    isSaving,
    createExam,
    switchExam,
    updateExam,
    updateActiveExamStudents,
    updateActiveExamConfig,
    deleteExam,
    duplicateExam,
    refreshExams,
    getSortedExams,
    getFilteredExams
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};

/**
 * Hook to use exam context
 */
export const useExams = (): ExamContextType => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExams must be used within ExamProvider');
  }
  return context;
};
