import { Plus } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n/useTranslation';
import { useAppStore } from '@/state/useAppStore';

interface ExamSelectorProps {
  onCreateNew: () => void;
}

export function ExamSelector({ onCreateNew }: ExamSelectorProps) {
  const t = useTranslation();
  const exams = useAppStore((s) => s.exams);
  const activeExamId = useAppStore((s) => s.activeExamId);
  const setActiveExam = useAppStore((s) => s.setActiveExam);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={activeExamId ?? ''}
        onValueChange={(v) => void setActiveExam(v)}
        options={exams.map((e) => ({
          value: e.id,
          label: e.name,
          ...(e.subject ? { description: e.subject } : {}),
        }))}
        placeholder="Prüfung wählen"
        aria-label={t.exam.name}
        className="min-w-[200px]"
      />
      <Button variant="primary" size="sm" onClick={onCreateNew}>
        <Plus size={14} /> {t.exam.new}
      </Button>
    </div>
  );
}
