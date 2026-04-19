import { AnimatePresence, motion } from 'framer-motion';
import { Download, Users } from 'lucide-react';
import type { ExamStudentView, ExamView } from '@/state/useAppStore';
import { useAppStore } from '@/state/useAppStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { studentsToCsv } from '@/domain/csv';
import { downloadText } from '@/lib/download';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

interface StudentTableProps {
  exam: ExamView;
  onEditRoster: () => void;
}

export function StudentTable({ exam, onEditRoster }: StudentTableProps) {
  const updateStudentPoints = useAppStore((s) => s.updateStudentPoints);

  const handleExport = (): void => {
    downloadText(`${exam.name || 'grades'}.csv`, studentsToCsv(exam.students as unknown as ExamStudentView[]));
    toast.success('Exportiert');
  };

  return (
    <Card>
      <CardHeader
        title={`Schüler in dieser Prüfung (${exam.students.length})`}
        subtitle="Punkte eintragen — Noten werden live berechnet."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onEditRoster}>
              <Users size={14} /> Schüler wählen
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exam.students.length === 0}>
              <Download size={14} /> CSV
            </Button>
          </div>
        }
      />

      {exam.students.length === 0 ? (
        <div className="text-center py-12 text-sm text-[var(--color-fg-muted)]">
          Wähle Schüler aus der Bibliothek, um loszulegen.
        </div>
      ) : (
        <div className="overflow-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[var(--color-fg-muted)] uppercase tracking-wider">
                <th className="text-left font-medium pb-2">Name</th>
                <th className="text-left font-medium pb-2 w-24">Klasse</th>
                <th className="text-right font-medium pb-2 w-28">
                  Punkte
                  <span className="text-[var(--color-fg-subtle)] ml-1">/ {exam.config.maxPossiblePoints}</span>
                </th>
                <th className="text-right font-medium pb-2 w-20">Note</th>
                <th className="text-right font-medium pb-2 w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {exam.students.map((student) => (
                  <motion.tr
                    key={student.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-[var(--color-border)]"
                  >
                    <td className="py-1.5 pr-2">
                      <div className="text-sm font-medium">{student.name}</div>
                      {student.stufe && (
                        <div className="text-[11px] text-[var(--color-fg-muted)]">{student.stufe}</div>
                      )}
                    </td>
                    <td className="py-1.5 pr-2 text-xs text-[var(--color-fg-muted)]">
                      {student.klasse ?? '—'}
                    </td>
                    <td className="py-1.5 pr-2">
                      <Input
                        type="number"
                        min={0}
                        max={exam.config.maxPossiblePoints}
                        step={0.5}
                        value={student.points}
                        onChange={(e) =>
                          void updateStudentPoints(student.id, Number(e.target.value) || 0)
                        }
                        className="text-right tabular-nums border-transparent hover:border-[var(--color-border)] bg-transparent"
                        aria-label={`Punkte für ${student.name}`}
                      />
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      <span
                        className={cn(
                          'tabular-nums font-semibold text-base',
                          student.isPassing ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]',
                        )}
                      >
                        {student.grade.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      <span className={cn('chip', student.isPassing ? 'chip-success' : 'chip-danger')}>
                        {student.isPassing ? 'Bestanden' : 'Nicht bestanden'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
