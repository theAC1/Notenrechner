import { create } from 'zustand';
import type {
  AppSettings,
  GradingConfig,
  Language,
  Student,
} from '@/domain/types';
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from '@/domain/types';
import { enrichStudents } from '@/domain/grading';
import {
  createExam as apiCreateExam,
  deleteExam as apiDeleteExam,
  listExams as apiListExams,
  updateExam as apiUpdateExam,
  type ExamWriteInput,
  type RemoteExam,
} from '@/services/api/exams';

export interface ExamStudentView extends Student {
  readonly klasse: string | null;
  readonly stufe: string | null;
}

export interface ExamView {
  readonly id: string;
  readonly name: string;
  readonly subject: string | null;
  readonly date: string;
  readonly config: GradingConfig;
  readonly students: ReadonlyArray<ExamStudentView>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateExamArgs {
  readonly name: string;
  readonly subject?: string;
  readonly date?: string;
  readonly config?: GradingConfig;
  readonly studentIds: ReadonlyArray<string>;
}

interface HistoryEntry {
  readonly examId: string;
  readonly snapshot: ExamWriteInput;
}

interface AppState {
  exams: ReadonlyArray<ExamView>;
  activeExamId: string | null;
  settings: AppSettings;
  isLoaded: boolean;
  history: HistoryEntry[];
  future: HistoryEntry[];
}

interface AppActions {
  load: () => Promise<void>;
  reset: () => void;
  createExam: (args: CreateExamArgs) => Promise<ExamView>;
  updateExamMeta: (
    id: string,
    patch: { name?: string; subject?: string | null; date?: string },
  ) => Promise<void>;
  updateActiveConfig: (config: GradingConfig) => Promise<void>;
  updateStudentPoints: (studentId: string, points: number) => Promise<void>;
  setStudents: (studentIds: ReadonlyArray<string>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  duplicateExam: (id: string) => Promise<ExamView | null>;
  setActiveExam: (id: string) => void;
  setLanguage: (language: Language) => void;
  setDarkMode: (darkMode: boolean) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

export type AppStore = AppState & AppActions;

const MAX_HISTORY = 30;
const SETTINGS_KEY = 'notenrechner-settings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      language: (['en', 'de', 'fr'] as const).includes(parsed.language as Language)
        ? (parsed.language as Language)
        : DEFAULT_SETTINGS.language,
      darkMode: typeof parsed.darkMode === 'boolean' ? parsed.darkMode : DEFAULT_SETTINGS.darkMode,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

function toExamView(exam: RemoteExam): ExamView {
  const studentsWithPoints = exam.students.map((s) => ({
    id: s.studentId,
    name: s.name,
    points: s.points,
    klasse: s.klasse,
    stufe: s.stufe,
  }));
  const enriched = enrichStudents(studentsWithPoints, exam.config);
  return {
    id: exam.id,
    name: exam.name,
    subject: exam.subject,
    date: exam.date,
    config: exam.config,
    students: enriched.map((e, idx) => {
      const src = studentsWithPoints[idx]!;
      return { ...e, klasse: src.klasse, stufe: src.stufe };
    }),
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
  };
}

function toWriteInput(exam: ExamView): ExamWriteInput {
  return {
    name: exam.name,
    subject: exam.subject,
    date: exam.date,
    config: exam.config,
    students: exam.students.map((s) => ({ studentId: s.id, points: s.points })),
  };
}

function pushHistory(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const next = [...history, entry];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

export const useAppStore = create<AppStore>((set, get) => ({
  exams: [],
  activeExamId: null,
  settings: loadSettings(),
  isLoaded: false,
  history: [],
  future: [],

  load: async () => {
    const remote = await apiListExams();
    const views = remote.map(toExamView);
    set({
      exams: views,
      activeExamId: views[0]?.id ?? null,
      isLoaded: true,
      history: [],
      future: [],
    });
  },

  reset: () => set({ exams: [], activeExamId: null, isLoaded: false, history: [], future: [] }),

  createExam: async ({ name, subject, date, config, studentIds }) => {
    const cfg = config ?? DEFAULT_CONFIG;
    const input: ExamWriteInput = {
      name,
      subject: subject ?? null,
      date: date ?? new Date().toISOString().slice(0, 10),
      config: cfg,
      students: studentIds.map((id) => ({ studentId: id, points: 0 })),
    };
    const created = await apiCreateExam(input);
    const view = toExamView(created);
    set({ exams: [view, ...get().exams], activeExamId: view.id, history: [], future: [] });
    return view;
  },

  updateExamMeta: async (id, patch) => {
    const exam = get().exams.find((e) => e.id === id);
    if (!exam) return;
    const updated: ExamView = {
      ...exam,
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.subject !== undefined ? { subject: patch.subject } : {}),
      ...(patch.date !== undefined ? { date: patch.date } : {}),
    };
    const remote = await apiUpdateExam(id, toWriteInput(updated));
    set({ exams: get().exams.map((e) => (e.id === id ? toExamView(remote) : e)) });
  },

  updateActiveConfig: async (config) => {
    const state = get();
    const active = state.exams.find((e) => e.id === state.activeExamId);
    if (!active) return;
    const snapshot = toWriteInput(active);
    const updated: ExamView = { ...active, config };
    const remote = await apiUpdateExam(active.id, toWriteInput(updated));
    set({
      exams: state.exams.map((e) => (e.id === active.id ? toExamView(remote) : e)),
      history: pushHistory(state.history, { examId: active.id, snapshot }),
      future: [],
    });
  },

  updateStudentPoints: async (studentId, points) => {
    const state = get();
    const active = state.exams.find((e) => e.id === state.activeExamId);
    if (!active) return;
    const snapshot = toWriteInput(active);
    const updatedStudents = active.students.map((s) =>
      s.id === studentId ? { ...s, points } : s,
    );
    const updated: ExamView = { ...active, students: updatedStudents };
    const remote = await apiUpdateExam(active.id, toWriteInput(updated));
    set({
      exams: state.exams.map((e) => (e.id === active.id ? toExamView(remote) : e)),
      history: pushHistory(state.history, { examId: active.id, snapshot }),
      future: [],
    });
  },

  setStudents: async (studentIds) => {
    const state = get();
    const active = state.exams.find((e) => e.id === state.activeExamId);
    if (!active) return;
    const snapshot = toWriteInput(active);
    const existing = new Map(active.students.map((s) => [s.id, s.points]));
    const nextStudents = studentIds.map((id) => ({
      studentId: id,
      points: existing.get(id) ?? 0,
    }));
    const remote = await apiUpdateExam(active.id, {
      ...toWriteInput(active),
      students: nextStudents,
    });
    set({
      exams: state.exams.map((e) => (e.id === active.id ? toExamView(remote) : e)),
      history: pushHistory(state.history, { examId: active.id, snapshot }),
      future: [],
    });
  },

  deleteExam: async (id) => {
    await apiDeleteExam(id);
    const remaining = get().exams.filter((e) => e.id !== id);
    const newActive =
      get().activeExamId === id ? (remaining[0]?.id ?? null) : get().activeExamId;
    set({ exams: remaining, activeExamId: newActive, history: [], future: [] });
  },

  duplicateExam: async (id) => {
    const source = get().exams.find((e) => e.id === id);
    if (!source) return null;
    const duplicated = await apiCreateExam({
      ...toWriteInput(source),
      name: `${source.name} (Kopie)`,
    });
    const view = toExamView(duplicated);
    set({ exams: [view, ...get().exams], activeExamId: view.id });
    return view;
  },

  setActiveExam: (id) => set({ activeExamId: id, history: [], future: [] }),

  setLanguage: (language) => {
    const settings: AppSettings = { ...get().settings, language };
    persistSettings(settings);
    set({ settings });
  },

  setDarkMode: (darkMode) => {
    const settings: AppSettings = { ...get().settings, darkMode };
    persistSettings(settings);
    set({ settings });
  },

  undo: async () => {
    const state = get();
    const last = state.history[state.history.length - 1];
    if (!last) return;
    const active = state.exams.find((e) => e.id === last.examId);
    if (!active) return;
    const currentSnapshot = toWriteInput(active);
    const remote = await apiUpdateExam(last.examId, last.snapshot);
    set({
      exams: state.exams.map((e) => (e.id === last.examId ? toExamView(remote) : e)),
      history: state.history.slice(0, -1),
      future: [...state.future, { examId: last.examId, snapshot: currentSnapshot }],
    });
  },

  redo: async () => {
    const state = get();
    const next = state.future[state.future.length - 1];
    if (!next) return;
    const active = state.exams.find((e) => e.id === next.examId);
    if (!active) return;
    const currentSnapshot = toWriteInput(active);
    const remote = await apiUpdateExam(next.examId, next.snapshot);
    set({
      exams: state.exams.map((e) => (e.id === next.examId ? toExamView(remote) : e)),
      future: state.future.slice(0, -1),
      history: [...state.history, { examId: next.examId, snapshot: currentSnapshot }],
    });
  },
}));

export function useActiveExam(): ExamView | null {
  return useAppStore((s) => s.exams.find((e) => e.id === s.activeExamId) ?? null);
}
