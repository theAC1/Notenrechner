import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Plus, Trash2, Upload, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLibraryStore } from '@/state/useLibraryStore';
import { parseStudentsCsv } from '@/domain/csv';
import type { LibraryStudent, LibraryStudentInput } from '@/domain/library';
import { groupByKlasse } from '@/domain/library';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';

export function LibraryPage() {
  const students = useLibraryStore((s) => s.students);
  const load = useLibraryStore((s) => s.load);
  const create = useLibraryStore((s) => s.create);
  const update = useLibraryStore((s) => s.update);
  const remove = useLibraryStore((s) => s.remove);
  const bulkCreate = useLibraryStore((s) => s.bulkCreate);

  const [filter, setFilter] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryStudent | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.klasse?.toLowerCase().includes(q) ?? false) ||
        (s.stufe?.toLowerCase().includes(q) ?? false),
    );
  }, [students, filter]);

  const groups = useMemo(() => groupByKlasse(filtered), [filtered]);

  const handleCsvImport = async (files: FileList | null): Promise<void> => {
    const file = files?.[0];
    if (!file) return;
    const text = await file.text();
    const { rows, errors } = parseStudentsCsv(text);
    if (rows.length === 0) {
      toast.error(errors.length > 0 ? `${errors.length} Fehler` : 'Keine Zeilen gefunden');
      return;
    }
    const defaultKlasse = window.prompt('Klasse für diese Schüler? (optional)') ?? undefined;
    const defaultStufe = window.prompt('Stufe? (optional)') ?? undefined;
    const inputs: LibraryStudentInput[] = rows.map((r) => ({
      name: r.name,
      klasse: defaultKlasse || null,
      stufe: defaultStufe || null,
    }));
    const created = await bulkCreate(inputs);
    toast.success(`${created.length} Schüler importiert`);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Users size={20} /> Schüler-Bibliothek
          </h2>
          <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
            Einmal erfasst — in jeder Prüfung verfügbar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="btn btn-outline btn-sm cursor-pointer text-xs">
            <Upload size={14} /> CSV Import
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              className="sr-only"
              onChange={(e) => void handleCsvImport(e.target.files)}
            />
          </label>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditing(null);
              setEditOpen(true);
            }}
          >
            <Plus size={14} /> Neuer Schüler
          </Button>
        </div>
      </div>

      <Input
        placeholder="Suchen (Name, Klasse, Stufe)…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {students.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-sm text-[var(--color-fg-muted)] mb-4">
              Noch keine Schüler erfasst.
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setEditOpen(true);
              }}
            >
              <Plus size={14} /> Ersten Schüler anlegen
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <motion.div
                key={`${group.klasse ?? 'none'}|${group.stufe ?? 'none'}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <CardHeader
                    title={group.klasse ?? 'Ohne Klasse'}
                    subtitle={
                      group.stufe ? `${group.stufe} · ${group.students.length} Schüler` : `${group.students.length} Schüler`
                    }
                  />
                  <div className="divide-y divide-[var(--color-border)]">
                    {group.students.map((student) => (
                      <div key={student.id} className="py-2 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium">{student.name}</div>
                          {student.notes && (
                            <div className="text-xs text-[var(--color-fg-muted)]">{student.notes}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(student);
                              setEditOpen(true);
                            }}
                            aria-label="Bearbeiten"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`${student.name} löschen?`)) void remove(student.id);
                            }}
                            aria-label="Löschen"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <StudentDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editing}
        onSubmit={async (input) => {
          if (editing) {
            await update(editing.id, input);
            toast.success('Schüler aktualisiert');
          } else {
            await create(input);
            toast.success('Schüler hinzugefügt');
          }
          setEditOpen(false);
        }}
      />
    </div>
  );
}

interface StudentDialogProps {
  open: boolean;
  onClose: () => void;
  initial: LibraryStudent | null;
  onSubmit: (input: LibraryStudentInput) => Promise<void>;
}

function StudentDialog({ open, onClose, initial, onSubmit }: StudentDialogProps) {
  const [name, setName] = useState('');
  const [klasse, setKlasse] = useState('');
  const [stufe, setStufe] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setKlasse(initial?.klasse ?? '');
      setStufe(initial?.stufe ?? '');
      setNotes(initial?.notes ?? '');
    }
  }, [open, initial]);

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        klasse: klasse.trim() || null,
        stufe: stufe.trim() || null,
        notes: notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={initial ? 'Schüler bearbeiten' : 'Neuer Schüler'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={() => void handleSave()} disabled={!name.trim() || saving}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">Klasse</div>
            <Input value={klasse} onChange={(e) => setKlasse(e.target.value)} placeholder="3a" />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">Stufe</div>
            <Input value={stufe} onChange={(e) => setStufe(e.target.value)} placeholder="Sek I" />
          </label>
        </div>
        <label className="block">
          <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">Notizen</div>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
    </Dialog>
  );
}
