import { describe, expect, it } from 'vitest';
import { calculateStats, percentiles } from './stats';
import type { Student } from './types';

const student = (grade: number, isPassing = grade >= 4): Student => ({
  id: String(grade),
  name: `s${grade}`,
  points: 0,
  grade,
  isPassing,
});

describe('calculateStats', () => {
  it('returns zeros for empty input', () => {
    const s = calculateStats([]);
    expect(s.average).toBe(0);
    expect(s.count).toBe(0);
    expect(s.distribution).toEqual([]);
  });

  it('computes basics', () => {
    const students = [student(3), student(4), student(5), student(6)];
    const s = calculateStats(students);
    expect(s.average).toBe(4.5);
    expect(s.median).toBe(4.5);
    expect(s.min).toBe(3);
    expect(s.max).toBe(6);
    expect(s.passRate).toBe(75);
    expect(s.count).toBe(4);
  });

  it('handles odd count median', () => {
    const students = [student(2), student(4), student(6)];
    expect(calculateStats(students).median).toBe(4);
  });

  it('distribution buckets correctly', () => {
    const students = [student(1.5), student(3.2), student(4.1), student(6)];
    const dist = calculateStats(students).distribution;
    expect(dist.find((b) => b.bucket === '1.0-1.9')?.count).toBe(1);
    expect(dist.find((b) => b.bucket === '3.0-3.9')?.count).toBe(1);
    expect(dist.find((b) => b.bucket === '4.0-4.9')?.count).toBe(1);
    expect(dist.find((b) => b.bucket === '6.0')?.count).toBe(1);
  });
});

describe('percentiles', () => {
  it('returns zeros for empty', () => {
    expect(percentiles([]).q2).toBe(0);
  });
  it('computes for known set', () => {
    const p = percentiles([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(p.q2).toBe(5);
    expect(p.q1).toBeLessThan(p.q2);
    expect(p.q3).toBeGreaterThan(p.q2);
  });
});
