import type { Student, StudentInput } from './types';
import { nanoid } from 'nanoid';

export interface ParsedRow {
  readonly name: string;
  readonly points: number;
}

export interface ParseResult {
  readonly rows: ReadonlyArray<ParsedRow>;
  readonly errors: ReadonlyArray<{ line: number; message: string; raw: string }>;
}

/**
 * Parse a CSV/TSV string into rows. Accepts `,`, `;`, or `\t` as delimiters.
 * Skips an optional header row (detected if the second column is non-numeric).
 * Returns both rows and errors so callers can surface problems to the user.
 */
export function parseStudentsCsv(text: string): ParseResult {
  const rows: ParsedRow[] = [];
  const errors: { line: number; message: string; raw: string }[] = [];

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const delimiter = detectDelimiter(text);
  let startIndex = 0;

  const firstLine = lines[0]?.trim();
  if (firstLine) {
    const parts = splitLine(firstLine, delimiter);
    const secondIsNumeric =
      parts[1] !== undefined && !Number.isNaN(Number(parts[1].trim().replaceAll(',', '.')));
    if (!secondIsNumeric) startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const raw = lines[i] ?? '';
    const line = raw.trim();
    if (!line) continue;
    const parts = splitLine(line, delimiter);
    if (parts.length < 2) {
      errors.push({ line: i + 1, message: 'Expected at least 2 columns', raw });
      continue;
    }
    const name = (parts[0] ?? '').trim();
    const pointsRaw = (parts[1] ?? '').trim().replaceAll(',', '.');
    const points = Number(pointsRaw);
    if (!name) {
      errors.push({ line: i + 1, message: 'Empty name', raw });
      continue;
    }
    if (Number.isNaN(points) || !Number.isFinite(points)) {
      errors.push({ line: i + 1, message: `Invalid points: "${pointsRaw}"`, raw });
      continue;
    }
    if (points < 0) {
      errors.push({ line: i + 1, message: 'Points must be >= 0', raw });
      continue;
    }
    rows.push({ name, points });
  }

  return { rows, errors };
}

type Delimiter = ',' | ';' | '\t';

function detectDelimiter(text: string): Delimiter {
  // Count occurrences of each candidate outside quoted segments on the first non-empty line.
  const firstLine = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .find((l) => l.trim().length > 0);
  if (!firstLine) return ';';
  const counts = { ';': 0, '\t': 0, ',': 0 } as Record<Delimiter, number>;
  let inQuotes = false;
  for (const ch of firstLine) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (ch === ';' || ch === '\t' || ch === ',')) counts[ch]++;
  }
  if (counts[';'] > 0) return ';';
  if (counts['\t'] > 0) return '\t';
  return ',';
}

function splitLine(line: string, delimiter: Delimiter): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      result.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

export function rowsToStudentInputs(rows: ReadonlyArray<ParsedRow>): ReadonlyArray<StudentInput> {
  return rows.map((r) => ({ id: nanoid(10), name: r.name, points: r.points }));
}

export function studentsToCsv(students: ReadonlyArray<Student>): string {
  const header = 'Name,Points,Grade,Status';
  const rows = students.map(
    (s) =>
      `"${escapeField(s.name)}",${s.points},${s.grade},${s.isPassing ? 'Pass' : 'Fail'}`,
  );
  return [header, ...rows].join('\n');
}

function escapeField(value: string): string {
  const escaped = value.replace(/"/g, '""');
  // CSV-injection hardening: prefix leading formula characters with an apostrophe.
  if (/^[=+\-@\t\r]/.test(escaped)) return `'${escaped}`;
  return escaped;
}
