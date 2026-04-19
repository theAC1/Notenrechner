import type { Stats, Student } from './types';

const EMPTY_STATS: Stats = {
  average: 0,
  median: 0,
  min: 0,
  max: 0,
  passRate: 0,
  stdDev: 0,
  count: 0,
  distribution: [],
};

function buildDistribution(students: ReadonlyArray<Student>): Stats['distribution'] {
  const buckets = [
    { bucket: '1.0-1.9', lower: 1.0, upper: 1.99 },
    { bucket: '2.0-2.9', lower: 2.0, upper: 2.99 },
    { bucket: '3.0-3.9', lower: 3.0, upper: 3.99 },
    { bucket: '4.0-4.9', lower: 4.0, upper: 4.99 },
    { bucket: '5.0-5.9', lower: 5.0, upper: 5.99 },
    { bucket: '6.0', lower: 6.0, upper: 6.0 },
  ] as const;

  return buckets.map((b) => ({
    ...b,
    count: students.filter((s) => s.grade >= b.lower && s.grade <= b.upper).length,
  }));
}

export function calculateStats(students: ReadonlyArray<Student>): Stats {
  if (students.length === 0) return EMPTY_STATS;

  const grades = students.map((s) => s.grade).sort((a, b) => a - b);
  const sum = grades.reduce((acc, g) => acc + g, 0);
  const avg = sum / students.length;

  const mid = Math.floor(grades.length / 2);
  const median =
    grades.length % 2 !== 0
      ? grades[mid]!
      : ((grades[mid - 1] ?? 0) + (grades[mid] ?? 0)) / 2;

  const passing = students.filter((s) => s.isPassing).length;
  const variance =
    grades.reduce((acc, g) => acc + (g - avg) ** 2, 0) / grades.length;
  const stdDev = Math.sqrt(variance);

  return {
    average: round(avg, 2),
    median: round(median, 2),
    min: grades[0] ?? 0,
    max: grades[grades.length - 1] ?? 0,
    passRate: round((passing / students.length) * 100, 1),
    stdDev: round(stdDev, 2),
    count: students.length,
    distribution: buildDistribution(students),
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Compute percentiles for boxplot rendering.
 */
export function percentiles(grades: ReadonlyArray<number>): {
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
} {
  if (grades.length === 0) {
    return { q1: 0, q2: 0, q3: 0, iqr: 0, lowerFence: 0, upperFence: 0 };
  }
  const sorted = [...grades].sort((a, b) => a - b);
  const q = (p: number): number => {
    const pos = (sorted.length - 1) * p;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    const a = sorted[lo] ?? 0;
    const b = sorted[hi] ?? a;
    return a + (b - a) * (pos - lo);
  };
  const q1 = q(0.25);
  const q2 = q(0.5);
  const q3 = q(0.75);
  const iqr = q3 - q1;
  return {
    q1: round(q1, 2),
    q2: round(q2, 2),
    q3: round(q3, 2),
    iqr: round(iqr, 2),
    lowerFence: round(q1 - 1.5 * iqr, 2),
    upperFence: round(q3 + 1.5 * iqr, 2),
  };
}
