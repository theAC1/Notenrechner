import { describe, expect, it } from 'vitest';
import { parseStudentsCsv, rowsToStudentInputs, studentsToCsv } from './csv';
import type { Student } from './types';

describe('parseStudentsCsv', () => {
  it('parses comma-delimited rows', () => {
    const r = parseStudentsCsv('Alice,50\nBob,40');
    expect(r.rows).toEqual([
      { name: 'Alice', points: 50 },
      { name: 'Bob', points: 40 },
    ]);
    expect(r.errors).toHaveLength(0);
  });

  it('parses semicolon-delimited rows', () => {
    const r = parseStudentsCsv('Alice;50\nBob;40');
    expect(r.rows).toHaveLength(2);
  });

  it('parses tab-delimited rows', () => {
    const r = parseStudentsCsv('Alice\t50\nBob\t40');
    expect(r.rows).toHaveLength(2);
  });

  it('skips header row (non-numeric second column)', () => {
    const r = parseStudentsCsv('Name;Points\nAlice;50');
    expect(r.rows).toEqual([{ name: 'Alice', points: 50 }]);
  });

  it('accepts comma decimal separator', () => {
    const r = parseStudentsCsv('Alice;4,5');
    expect(r.rows[0]?.points).toBe(4.5);
  });

  it('records errors for invalid rows', () => {
    const r = parseStudentsCsv('Alice;abc\n;30\nOnlyOneField');
    expect(r.rows).toHaveLength(0);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('handles quoted names with delimiters', () => {
    const r = parseStudentsCsv('"Smith, John";80');
    expect(r.rows[0]?.name).toBe('Smith, John');
  });

  it('skips empty lines', () => {
    const r = parseStudentsCsv('\n\nAlice;50\n\n');
    expect(r.rows).toHaveLength(1);
  });

  it('rejects negative points', () => {
    const r = parseStudentsCsv('Alice;-5');
    expect(r.rows).toHaveLength(0);
    expect(r.errors).toHaveLength(1);
  });
});

describe('rowsToStudentInputs', () => {
  it('assigns unique IDs', () => {
    const out = rowsToStudentInputs([
      { name: 'A', points: 1 },
      { name: 'B', points: 2 },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]?.id).not.toBe(out[1]?.id);
  });
});

describe('studentsToCsv', () => {
  it('writes header and rows', () => {
    const students: Student[] = [
      { id: '1', name: 'Alice', points: 50, grade: 4.5, isPassing: true },
      { id: '2', name: 'Bob', points: 20, grade: 2, isPassing: false },
    ];
    const csv = studentsToCsv(students);
    expect(csv).toContain('Name,Points,Grade,Status');
    expect(csv).toContain('"Alice",50,4.5,Pass');
    expect(csv).toContain('"Bob",20,2,Fail');
  });

  it('escapes double quotes in names', () => {
    const students: Student[] = [
      { id: '1', name: 'O"Reilly', points: 10, grade: 1, isPassing: false },
    ];
    expect(studentsToCsv(students)).toContain('"O""Reilly"');
  });
});
