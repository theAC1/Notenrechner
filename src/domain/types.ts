import { z } from 'zod';

export const ALGORITHM_TYPES = ['LINEAR', 'NICE', 'HARD'] as const;
export type AlgorithmType = (typeof ALGORITHM_TYPES)[number];

export const LANGUAGES = ['en', 'de', 'fr'] as const;
export type Language = (typeof LANGUAGES)[number];

export const ROUNDING_STEPS = [0.1, 0.25, 0.5, 1.0] as const;
export type RoundingStep = (typeof ROUNDING_STEPS)[number];

export const gradingConfigSchema = z
  .object({
    maxPossiblePoints: z.number().positive().finite(),
    pointsFor6: z.number().min(0).finite(),
    pointsFor4: z.number().min(0).finite(),
    pointsFor1: z.number().min(0).finite(),
    gradeMin: z.number().min(1).max(6),
    gradeMax: z.number().min(1).max(6),
    roundingStep: z.union([z.literal(0.1), z.literal(0.25), z.literal(0.5), z.literal(1)]),
    algorithm: z.enum(ALGORITHM_TYPES),
  })
  .refine((c) => c.pointsFor1 <= c.pointsFor4, {
    message: 'pointsFor1 must be <= pointsFor4',
    path: ['pointsFor1'],
  })
  .refine((c) => c.pointsFor4 < c.pointsFor6, {
    message: 'pointsFor4 must be < pointsFor6',
    path: ['pointsFor4'],
  })
  .refine((c) => c.pointsFor6 <= c.maxPossiblePoints, {
    message: 'pointsFor6 must be <= maxPossiblePoints',
    path: ['pointsFor6'],
  })
  .refine((c) => c.gradeMin < c.gradeMax, {
    message: 'gradeMin must be < gradeMax',
    path: ['gradeMin'],
  });

export type GradingConfig = z.infer<typeof gradingConfigSchema>;

export const studentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.number().min(0).finite(),
});
export type StudentInput = z.infer<typeof studentSchema>;

export interface Student extends StudentInput {
  grade: number;
  isPassing: boolean;
}

export interface Stats {
  readonly average: number;
  readonly median: number;
  readonly min: number;
  readonly max: number;
  readonly passRate: number;
  readonly stdDev: number;
  readonly count: number;
  readonly distribution: ReadonlyArray<{ bucket: string; count: number; lower: number; upper: number }>;
}

export const examSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  subject: z.string().max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  config: gradingConfigSchema,
  students: z.array(studentSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ExamInput = z.infer<typeof examSchema>;

export interface Exam extends Omit<ExamInput, 'students'> {
  readonly students: ReadonlyArray<Student>;
}

export interface CreateExamData {
  readonly name: string;
  readonly subject?: string;
  readonly date?: string;
  readonly copyStudentsFromExamId?: string;
  readonly config?: GradingConfig;
}

export const appSettingsSchema = z.object({
  language: z.enum(LANGUAGES),
  darkMode: z.boolean(),
});
export type AppSettings = z.infer<typeof appSettingsSchema>;

export const STORAGE_VERSION = '2.0.0';

export interface AppStorage {
  readonly version: string;
  readonly activeExamId: string | null;
  readonly exams: ReadonlyArray<Exam>;
  readonly settings: AppSettings;
}

export type ExamSortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

export const DEFAULT_CONFIG: GradingConfig = {
  maxPossiblePoints: 60,
  pointsFor6: 55,
  pointsFor4: 33,
  pointsFor1: 0,
  gradeMin: 1.0,
  gradeMax: 6.0,
  roundingStep: 0.5,
  algorithm: 'LINEAR',
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'de',
  darkMode: false,
};
