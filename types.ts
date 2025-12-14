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