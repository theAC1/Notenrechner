export enum AlgorithmType {
  LINEAR = 'LINEAR',
  NICE = 'NICE', // Concave (Log-like)
  HARD = 'HARD'  // Convex (Exp-like)
}

export type Language = 'en' | 'de' | 'fr';

export interface GradingConfig {
  maxPossiblePoints: number; // The absolute max points on the exam (100%)
  pointsFor6: number; // Points required for Grade 6
  pointsFor4: number; // Points required for Grade 4
  pointsFor1: number; // Points required for Grade 1 (min grade), defaults to 0
  gradeMin: number;
  gradeMax: number;
  roundingStep: 0.1 | 0.25 | 0.5 | 1.0;
  algorithm: AlgorithmType;
}

export interface Student {
  id: string;
  name: string;
  points: number;
  grade: number; 
  isPassing: boolean;
}

export interface Stats {
  average: number;
  median: number;
  min: number;
  max: number;
  passRate: number;
  stdDev: number;
}

// ============================================
// Exam Management Types
// ============================================

/**
 * Represents a single exam/test with its configuration and student data
 */
export interface Exam {
  id: string;                    // Unique identifier (nanoid)
  name: string;                  // e.g., "Mathematik Test 1"
  subject?: string;              // Optional subject (e.g., "Mathematik")
  date: string;                  // ISO-8601 format (YYYY-MM-DD)
  config: GradingConfig;         // Grading configuration for this exam
  students: Student[];           // Students with their points and grades
  createdAt: string;             // ISO-8601 timestamp
  updatedAt: string;             // ISO-8601 timestamp
}

/**
 * Data structure for creating a new exam
 */
export interface CreateExamData {
  name: string;
  subject?: string;
  date?: string;                 // Defaults to today if not provided
  copyStudentsFromExamId?: string; // Optional: copy students from another exam
  config?: GradingConfig;        // Optional: use custom config or default
}

/**
 * Storage structure for LocalStorage
 */
export interface AppStorage {
  version: string;               // Storage version for migrations
  activeExamId: string | null;   // Currently active exam ID
  exams: Exam[];                 // All exams
  settings: AppSettings;         // User preferences
}

/**
 * User settings and preferences
 */
export interface AppSettings {
  language: Language;
  darkMode: boolean;
}

/**
 * Sort options for exam list
 */
export type ExamSortOption =
  | 'date-desc'      // Newest first (default)
  | 'date-asc'       // Oldest first
  | 'name-asc'       // A-Z
  | 'name-desc';     // Z-A