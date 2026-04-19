import { describe, expect, it } from 'vitest';
import {
  algorithmExponent,
  calculateGrade,
  calculateRawGrade,
  enrichStudent,
  enrichStudents,
  minPointsForGrade,
  roundToStep,
  solvePointsFor4ForPassRate,
} from './grading';
import type { GradingConfig, StudentInput } from './types';
import { DEFAULT_CONFIG } from './types';

const baseConfig: GradingConfig = { ...DEFAULT_CONFIG };

describe('algorithmExponent', () => {
  it('returns 1 for LINEAR', () => expect(algorithmExponent('LINEAR')).toBe(1));
  it('returns < 1 for NICE (concave)', () => expect(algorithmExponent('NICE')).toBeLessThan(1));
  it('returns > 1 for HARD (convex)', () => expect(algorithmExponent('HARD')).toBeGreaterThan(1));
});

describe('roundToStep', () => {
  it('rounds to 0.5', () => {
    expect(roundToStep(4.24, 0.5)).toBe(4);
    expect(roundToStep(4.25, 0.5)).toBe(4.5);
    expect(roundToStep(4.76, 0.5)).toBe(5);
  });
  it('rounds to 0.1', () => {
    expect(roundToStep(4.23, 0.1)).toBeCloseTo(4.2, 10);
    expect(roundToStep(4.27, 0.1)).toBeCloseTo(4.3, 10);
  });
  it('throws for non-positive step', () => {
    expect(() => roundToStep(1, 0)).toThrow();
    expect(() => roundToStep(1, -0.5)).toThrow();
  });
});

describe('calculateRawGrade — LINEAR', () => {
  it('returns gradeMax at pointsFor6', () => {
    expect(calculateRawGrade(55, baseConfig)).toBe(6);
  });
  it('returns gradeMax above pointsFor6', () => {
    expect(calculateRawGrade(100, baseConfig)).toBe(6);
  });
  it('returns exactly 4.0 at pointsFor4', () => {
    expect(calculateRawGrade(33, baseConfig)).toBe(4);
  });
  it('returns gradeMin at pointsFor1', () => {
    expect(calculateRawGrade(0, baseConfig)).toBe(1);
  });
  it('interpolates linearly in lower segment', () => {
    // halfway between 0 and 33 → halfway between 1 and 4 → 2.5
    expect(calculateRawGrade(16.5, baseConfig)).toBeCloseTo(2.5, 2);
  });
  it('interpolates linearly in upper segment', () => {
    // halfway between 33 and 55 → halfway between 4 and 6 → 5
    expect(calculateRawGrade(44, baseConfig)).toBeCloseTo(5, 2);
  });
  it('clamps negative points to gradeMin', () => {
    expect(calculateRawGrade(-10, baseConfig)).toBe(1);
  });
});

describe('calculateRawGrade — NICE/HARD', () => {
  const nice: GradingConfig = { ...baseConfig, algorithm: 'NICE' };
  const hard: GradingConfig = { ...baseConfig, algorithm: 'HARD' };

  it('NICE yields higher grade than LINEAR below threshold', () => {
    expect(calculateRawGrade(20, nice)).toBeGreaterThan(calculateRawGrade(20, baseConfig));
  });
  it('HARD yields lower grade than LINEAR below threshold', () => {
    expect(calculateRawGrade(20, hard)).toBeLessThan(calculateRawGrade(20, baseConfig));
  });
  it('all algorithms agree at anchor points', () => {
    for (const algo of [baseConfig, nice, hard]) {
      expect(calculateRawGrade(0, algo)).toBe(1);
      expect(calculateRawGrade(33, algo)).toBe(4);
      expect(calculateRawGrade(55, algo)).toBe(6);
    }
  });
});

describe('calculateGrade', () => {
  it('applies rounding step 0.5', () => {
    const cfg = { ...baseConfig, roundingStep: 0.5 as const };
    expect(calculateGrade(16.5, cfg)).toBe(2.5);
  });
  it('applies rounding step 0.1', () => {
    const cfg = { ...baseConfig, roundingStep: 0.1 as const };
    const raw = calculateRawGrade(16.5, cfg);
    expect(calculateGrade(16.5, cfg)).toBeCloseTo(Math.round(raw * 10) / 10, 10);
  });
  it('never exceeds gradeMax', () => {
    for (let p = 0; p <= baseConfig.maxPossiblePoints + 10; p++) {
      expect(calculateGrade(p, baseConfig)).toBeLessThanOrEqual(baseConfig.gradeMax);
    }
  });
  it('never goes below gradeMin', () => {
    for (let p = -5; p <= baseConfig.maxPossiblePoints; p++) {
      expect(calculateGrade(p, baseConfig)).toBeGreaterThanOrEqual(baseConfig.gradeMin);
    }
  });
});

describe('minPointsForGrade', () => {
  it('round-trips through calculateRawGrade for LINEAR', () => {
    for (const target of [1.5, 2, 3, 4, 4.5, 5.5]) {
      const points = minPointsForGrade(target, baseConfig);
      const grade = calculateRawGrade(points, baseConfig);
      expect(grade).toBeCloseTo(target, 1);
    }
  });
  it('returns pointsFor1 for target <= gradeMin', () => {
    expect(minPointsForGrade(1, baseConfig)).toBe(0);
    expect(minPointsForGrade(0.5, baseConfig)).toBe(0);
  });
  it('returns pointsFor6 for target >= gradeMax', () => {
    expect(minPointsForGrade(6, baseConfig)).toBe(55);
  });
});

describe('enrichStudent / enrichStudents', () => {
  it('marks pass correctly', () => {
    const s: StudentInput = { id: '1', name: 'A', points: 33 };
    const e = enrichStudent(s, baseConfig);
    expect(e.grade).toBe(4);
    expect(e.isPassing).toBe(true);
  });
  it('marks fail correctly', () => {
    const s: StudentInput = { id: '1', name: 'A', points: 20 };
    const e = enrichStudent(s, baseConfig);
    expect(e.isPassing).toBe(false);
  });
  it('enrichStudents preserves length and order', () => {
    const inputs: StudentInput[] = [
      { id: '1', name: 'A', points: 10 },
      { id: '2', name: 'B', points: 50 },
    ];
    const out = enrichStudents(inputs, baseConfig);
    expect(out).toHaveLength(2);
    expect(out[0]?.name).toBe('A');
  });
});

describe('solvePointsFor4ForPassRate', () => {
  const cfg = baseConfig;
  const students: StudentInput[] = [
    { id: '1', name: 'A', points: 10 },
    { id: '2', name: 'B', points: 20 },
    { id: '3', name: 'C', points: 30 },
    { id: '4', name: 'D', points: 40 },
    { id: '5', name: 'E', points: 50 },
  ];

  it('returns a permissive anchor (<= lowest) for 100% pass rate', () => {
    const result = solvePointsFor4ForPassRate(students, 100, cfg);
    expect(result).not.toBeNull();
    expect(result!).toBeLessThanOrEqual(students[0]!.points);
  });
  it('returns a threshold for mid pass rate', () => {
    const result = solvePointsFor4ForPassRate(students, 60, cfg);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(10);
    expect(result!).toBeLessThan(50);
  });
  it('returns null for empty students', () => {
    expect(solvePointsFor4ForPassRate([], 80, cfg)).toBeNull();
  });
  it('returns null for invalid pass rate', () => {
    expect(solvePointsFor4ForPassRate(students, -5, cfg)).toBeNull();
    expect(solvePointsFor4ForPassRate(students, 110, cfg)).toBeNull();
  });
});
