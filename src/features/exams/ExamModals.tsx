import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExamView } from '@/state/useAppStore';
import { useAppStore } from '@/state/useAppStore';
import { useLibraryStore } from '@/state/useLibraryStore';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RosterPicker } from './RosterPicker';

interface CreateExamModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateExamModal({ open, onClose }: CreateExamModalProps) {
  const createExam = useAppStore((s) => s.createExam);
  const libraryStudents = useLibraryStore((s) => s.students);
  const loadLibrary = useLibraryStore((s) => s.load);
  const libraryLoaded = useLibraryStore((s) => s.isLoaded);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setSubject('');
      setDate(new Date().toISOString().slice(0, 10));
      setSelectedIds(new Set());
      if (!libraryLoaded) void loadLibrary();
    }
  }, [open, libraryLoaded, loadLibrary]);

  const toggleOne = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (ids: ReadonlyArray<string>, select: boolean): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleCreate = async (): Promise<void> => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createExam({
        name: name.trim(),
        ...(subject.trim() ? { subject: subject.trim() } : {}),
        date,
        studentIds: Array.from(selectedIds),
      });
      toast.success('Prüfung erstellt');
      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'Fehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Neue Prüfung"
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={() => void handleCreate()} disabled={!name.trim() || saving}>
            Erstellen ({selectedIds.size})
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Mathematik Test 1"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fach">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Mathematik"
              />
            </Field>
            <Field label="Datum">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-2">
            Schüler aus Bibliothek wählen
          </div>
          {libraryStudents.length === 0 ? (
            <div className="text-sm text-[var(--color-fg-muted)] text-center py-6 glass-subtle">
              Die Bibliothek ist leer. Lege zuerst Schüler in der Bibliothek an.
            </div>
          ) : (
            <RosterPicker
              students={libraryStudents}
              selectedIds={selectedIds}
              onToggle={toggleOne}
              onToggleGroup={toggleGroup}
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}

interface EditExamModalProps {
  open: boolean;
  onClose: () => void;
  exam: ExamView;
}

export function EditExamModal({ open, onClose, exam }: EditExamModalProps) {
  const updateExamMeta = useAppStore((s) => s.updateExamMeta);
  const setStudents = useAppStore((s) => s.setStudents);
  const libraryStudents = useLibraryStore((s) => s.students);
  const loadLibrary = useLibraryStore((s) => s.load);

  const [name, setName] = useState(exam.name);
  const [subject, setSubject] = useState(exam.subject ?? '');
  const [date, setDate] = useState(exam.date);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(exam.students.map((s) => s.id)),
  );

  useEffect(() => {
    if (open) {
      setName(exam.name);
      setSubject(exam.subject ?? '');
      setDate(exam.date);
      setSelectedIds(new Set(exam.students.map((s) => s.id)));
      void loadLibrary();
    }
  }, [open, exam, loadLibrary]);

  const toggleOne = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (ids: ReadonlyArray<string>, select: boolean): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleSave = async (): Promise<void> => {
    await updateExamMeta(exam.id, {
      name: name.trim(),
      subject: subject.trim() || null,
      date,
    });
    const existing = new Set(exam.students.map((s) => s.id));
    const changed = existing.size !== selectedIds.size ||
      [...selectedIds].some((id) => !existing.has(id));
    if (changed) {
      await setStudents(Array.from(selectedIds));
    }
    toast.success('Prüfung aktualisiert');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Prüfung bearbeiten"
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={() => void handleSave()}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fach">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
            <Field label="Datum">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-2">
            Schüler in dieser Prüfung
          </div>
          <RosterPicker
            students={libraryStudents}
            selectedIds={selectedIds}
            onToggle={toggleOne}
            onToggleGroup={toggleGroup}
          />
        </div>
      </div>
    </Dialog>
  );
}

interface DeleteExamDialogProps {
  open: boolean;
  onClose: () => void;
  exam: ExamView;
}

export function DeleteExamDialog({ open, onClose, exam }: DeleteExamDialogProps) {
  const deleteExam = useAppStore((s) => s.deleteExam);

  const handleDelete = async (): Promise<void> => {
    await deleteExam(exam.id);
    toast.success('Prüfung gelöscht');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Prüfung löschen?"
      description={`"${exam.name}" — diese Aktion kann nicht rückgängig gemacht werden.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={() => void handleDelete()}>
            Löschen
          </Button>
        </>
      }
    >
      <div />
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">{label}</div>
      {children}
    </label>
  );
}
