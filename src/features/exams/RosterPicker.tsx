import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import type { LibraryStudent } from '@/domain/library';
import { groupByKlasse } from '@/domain/library';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

interface RosterPickerProps {
  students: ReadonlyArray<LibraryStudent>;
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onToggleGroup: (ids: ReadonlyArray<string>, select: boolean) => void;
}

export function RosterPicker({ students, selectedIds, onToggle, onToggleGroup }: RosterPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.klasse?.toLowerCase().includes(q) ?? false) ||
        (s.stufe?.toLowerCase().includes(q) ?? false),
    );
  }, [students, query]);

  const groups = useMemo(() => groupByKlasse(filtered), [filtered]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen nach Name, Klasse, Stufe…"
          className="pl-8"
        />
      </div>

      {groups.length === 0 ? (
        <div className="text-sm text-[var(--color-fg-muted)] text-center py-6">
          Keine Schüler gefunden.
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
          {groups.map((group) => {
            const allInGroup = group.students.map((s) => s.id);
            const selectedInGroup = allInGroup.filter((id) => selectedIds.has(id)).length;
            const allSelected = selectedInGroup === allInGroup.length;
            return (
              <div key={`${group.klasse ?? '_'}|${group.stufe ?? '_'}`} className="glass-subtle p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold">{group.klasse ?? 'Ohne Klasse'}</div>
                    {group.stufe && (
                      <div className="text-xs text-[var(--color-fg-muted)]">{group.stufe}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleGroup(allInGroup, !allSelected)}
                    className="text-xs text-[var(--color-accent)] hover:underline"
                  >
                    {allSelected ? 'Keine' : 'Alle'} ({selectedInGroup}/{allInGroup.length})
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {group.students.map((student) => {
                    const selected = selectedIds.has(student.id);
                    return (
                      <button
                        type="button"
                        key={student.id}
                        onClick={() => onToggle(student.id)}
                        className={cn(
                          'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-left transition-colors border',
                          selected
                            ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent)]'
                            : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]',
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded flex items-center justify-center border',
                            selected
                              ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                              : 'border-[var(--color-border)]',
                          )}
                        >
                          {selected && <Check size={12} />}
                        </div>
                        <span className="truncate">{student.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-[var(--color-fg-muted)] flex items-center justify-between">
        <span>{selectedIds.size} ausgewählt</span>
      </div>
    </div>
  );
}
