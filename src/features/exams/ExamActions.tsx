import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Copy, Edit2, MoreHorizontal, Trash2 } from 'lucide-react';
import type { ExamView } from '@/state/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { useAppStore } from '@/state/useAppStore';
import toast from 'react-hot-toast';

interface ExamActionsProps {
  exam: ExamView;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExamActions({ exam, onEdit, onDelete }: ExamActionsProps) {
  const t = useTranslation();
  const duplicateExam = useAppStore((s) => s.duplicateExam);

  const handleDuplicate = async (): Promise<void> => {
    const copy = await duplicateExam(exam.id);
    if (copy) toast.success(t.toasts.examDuplicated);
  };

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button className="btn btn-outline p-2" aria-label={t.exam.edit}>
          <MoreHorizontal size={16} />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content align="end" className="glass p-1.5 min-w-[180px] z-50" sideOffset={4}>
          <DropdownItem icon={<Edit2 size={14} />} onClick={onEdit}>
            {t.exam.edit}
          </DropdownItem>
          <DropdownItem icon={<Copy size={14} />} onClick={() => void handleDuplicate()}>
            {t.exam.duplicate}
          </DropdownItem>
          <Dropdown.Separator className="my-1 h-px bg-[var(--color-border)]" />
          <DropdownItem icon={<Trash2 size={14} />} onClick={onDelete} danger>
            {t.exam.delete}
          </DropdownItem>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

function DropdownItem({
  icon,
  children,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <Dropdown.Item
      onSelect={onClick}
      className={`flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md cursor-pointer outline-none data-[highlighted]:bg-[var(--color-bg-subtle)] ${danger ? 'text-[var(--color-danger)]' : ''}`}
    >
      {icon}
      {children}
    </Dropdown.Item>
  );
}
