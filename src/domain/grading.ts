import type { AlgorithmType, GradingConfig, Student, StudentInput } from './types';

const PASS_GRADE = 4.0;
const EPSILON = 1e-9;

export function algorithmExponent(algo: AlgorithmType): number {
  switch (algo) {
    case 'NICE':
      return 0.8;
    case 'HARD':
      return 1.25;
    case 'LINEAR':
    default:
      return 1.0;
  }
}

export function roundToStep(value: number, step: number): number {
  if (step <= 0) throw new Error('Rounding step must be positive');
  const factor = 1 / step;
  return Math.round(value * factor) / factor;
}

export function calculateRawGrade(points: number, config: GradingConfig): number {
  const clamped = Math.max(0, Math.min(points, config.maxPossiblePoints));
  if (clamped < config.pointsFor1) return config.gradeMin;
  if (clamped >= config.pointsFor6) return config.gradeMax;

  const exponent = algorithmExponent(config.algorithm);

  if (clamped < config.pointsFor4) {
    const range = Math.max(EPSILON, config.pointsFor4 - config.pointsFor1);
    const ratio = (clamped - config.pointsFor1) / range;
    const curved = Math.pow(ratio, exponent);
    return config.gradeMin + curved * (PASS_GRADE - config.gradeMin);
  }

  const range = Math.max(EPSILON, config.pointsFor6 - config.pointsFor4);
  const ratio = (clamped - config.pointsFor4) / range;
  const curved = Math.pow(ratio, exponent);
  return PASS_GRADE + curved * (config.gradeMax - PASS_GRADE);
}

export function calculateGrade(points: number, config: GradingConfig): number {
  const raw = calculateRawGrade(points, config);
  const clamped = Math.max(config.gradeMin, Math.min(config.gradeMax, raw));
  return roundToStep(clamped, config.roundingStep);
}

export function minPointsForGrade(targetGrade: number, config: GradingConfig): number {
  const exponent = algorithmExponent(config.algorithm);
  if (targetGrade <= config.gradeMin) return config.pointsFor1;
  if (targetGrade >= config.gradeMax) return config.pointsFor6;

  if (targetGrade < PASS_GRADE) {
    const gradeRange = Math.max(EPSILON, PASS_GRADE - config.gradeMin);
    const ratio = Math.pow((targetGrade - config.gradeMin) / gradeRange, 1 / exponent);
    const pointsRange = config.pointsFor4 - config.pointsFor1;
    return config.pointsFor1 + ratio * pointsRange;
  }

  const gradeRange = Math.max(EPSILON, config.gradeMax - PASS_GRADE);
  const ratio = Math.pow((targetGrade - PASS_GRADE) / gradeRange, 1 / exponent);
  const pointsRange = config.pointsFor6 - config.pointsFor4;
  return config.pointsFor4 + ratio * pointsRange;
}

export function enrichStudent(input: StudentInput, config: GradingConfig): Student {
  const grade = calculateGrade(input.points, config);
  return {
    ...input,
    grade,
    isPassing: grade >= PASS_GRADE,
  };
}

export function enrichStudents(
  inputs: ReadonlyArray<StudentInput>,
  config: GradingConfig,
): ReadonlyArray<Student> {
  return inputs.map((s) => enrichStudent(s, config));
}

/**
 * Reverse solver: find the pointsFor4 anchor such that N% of students pass.
 * Returns null if no satisfactory anchor exists in the search range.
 */
export function solvePointsFor4ForPassRate(
  students: ReadonlyArray<StudentInput>,
  targetPassRate: number,
  config: GradingConfig,
): number | null {
  if (students.length === 0) return null;
  if (targetPassRate < 0 || targetPassRate > 100) return null;

  const sortedPoints = [...students].map((s) => s.points).sort((a, b) => a - b);
  const desiredFailing = Math.round(students.length * (1 - targetPassRate / 100));
  if (desiredFailing <= 0) {
    // Everyone passes: anchor at or below the lowest score.
    const lowest = sortedPoints[0] ?? config.pointsFor1;
    return Math.max(config.pointsFor1, lowest);
  }
  if (desiredFailing >= students.length) return config.pointsFor6;

  const threshold = sortedPoints[desiredFailing];
  const prev = sortedPoints[desiredFailing - 1];
  if (threshold === undefined || prev === undefined) return null;
  return Number(((prev + threshold) / 2).toFixed(2));
}
