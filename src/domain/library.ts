export interface LibraryStudent {
  readonly id: string;
  readonly name: string;
  readonly klasse: string | null;
  readonly stufe: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LibraryStudentInput {
  readonly name: string;
  readonly klasse?: string | null;
  readonly stufe?: string | null;
  readonly notes?: string | null;
}

/**
 * Group library students by klasse. Students without a klasse are grouped under `null`.
 */
export function groupByKlasse(
  students: ReadonlyArray<LibraryStudent>,
): ReadonlyArray<{ klasse: string | null; stufe: string | null; students: ReadonlyArray<LibraryStudent> }> {
  const groups = new Map<string, { klasse: string | null; stufe: string | null; students: LibraryStudent[] }>();
  for (const s of students) {
    const key = `${s.klasse ?? '—'}|${s.stufe ?? '—'}`;
    let group = groups.get(key);
    if (!group) {
      group = { klasse: s.klasse, stufe: s.stufe, students: [] };
      groups.set(key, group);
    }
    group.students.push(s);
  }
  return [...groups.values()].sort((a, b) => {
    const ka = a.klasse ?? '\uffff';
    const kb = b.klasse ?? '\uffff';
    return ka.localeCompare(kb);
  });
}
