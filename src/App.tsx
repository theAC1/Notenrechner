import { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  BookOpen,
  GraduationCap,
  LogOut,
  Moon,
  Printer,
  Redo2,
  Sun,
  Undo2,
  Users,
} from 'lucide-react';
import { calculateStats } from '@/domain/stats';
import { useAppStore, useActiveExam } from '@/state/useAppStore';
import { useAuthStore } from '@/state/useAuthStore';
import { useLibraryStore } from '@/state/useLibraryStore';
import { Button } from '@/components/ui/Button';
import { StatsPanel } from '@/features/stats/StatsPanel';
import { ConfigPanel } from '@/features/config/ConfigPanel';
import { StudentTable } from '@/features/students/StudentTable';
import { DistributionChart } from '@/features/charts/DistributionChart';
import { CurveChart } from '@/features/charts/CurveChart';
import { BoxPlot } from '@/features/charts/BoxPlot';
import { WhatIfSolver } from '@/features/whatif/WhatIfSolver';
import { ExamSelector } from '@/features/exams/ExamSelector';
import { ExamActions } from '@/features/exams/ExamActions';
import {
  CreateExamModal,
  DeleteExamDialog,
  EditExamModal,
} from '@/features/exams/ExamModals';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { LibraryPage } from '@/features/library/LibraryPage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

type Tab = 'exams' | 'library';
type ExamView = 'edit' | 'report';

export function App() {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);
  const loadAuth = useAuthStore((s) => s.load);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    void loadAuth();
  }, [loadAuth]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--color-fg-muted)]">
        Laden…
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  return <AuthedApp userDisplayName={user.displayName ?? user.email} onLogout={logout} />;
}

interface AuthedAppProps {
  userDisplayName: string;
  onLogout: () => void;
}

function AuthedApp({ userDisplayName, onLogout }: AuthedAppProps) {
  const loadExams = useAppStore((s) => s.load);
  const resetExams = useAppStore((s) => s.reset);
  const loadLibrary = useLibraryStore((s) => s.load);
  const resetLibrary = useLibraryStore((s) => s.reset);
  const examsLoaded = useAppStore((s) => s.isLoaded);
  const darkMode = useAppStore((s) => s.settings.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const activeExam = useActiveExam();
  const updateActiveConfig = useAppStore((s) => s.updateActiveConfig);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const history = useAppStore((s) => s.history);
  const future = useAppStore((s) => s.future);

  const [tab, setTab] = useState<Tab>('exams');
  const [examView, setExamView] = useState<ExamView>('edit');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    void loadExams();
    void loadLibrary();
  }, [loadExams, loadLibrary]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useKeyboardShortcuts({
    'mod+n': () => {
      setTab('exams');
      setCreateOpen(true);
    },
    'mod+z': () => void undo(),
    'mod+shift+z': () => void redo(),
    'mod+p': (e) => {
      e.preventDefault();
      window.print();
    },
  });

  const handleLogout = (): void => {
    resetExams();
    resetLibrary();
    onLogout();
  };

  const stats = useMemo(
    () => (activeExam ? calculateStats(activeExam.students) : null),
    [activeExam],
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-fg-base)]">
      <Toaster position="top-right" toastOptions={{ className: '!text-sm' }} />

      <header className="print-hidden sticky top-0 z-30 backdrop-blur-xl bg-[color-mix(in_oklab,var(--color-bg-base)_75%,transparent)] border-b border-[var(--color-border)]">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[oklch(0.55_0.22_310)] text-white flex items-center justify-center shadow-lg">
                <GraduationCap size={20} />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight leading-none">Notenrechner</h1>
                <p className="text-[11px] text-[var(--color-fg-muted)] mt-0.5">{userDisplayName}</p>
              </div>
            </div>

            <div className="hidden md:flex rounded-lg bg-[var(--color-bg-subtle)] p-0.5 ml-2">
              <TabBtn active={tab === 'exams'} onClick={() => setTab('exams')} icon={<BookOpen size={14} />}>
                Prüfungen
              </TabBtn>
              <TabBtn active={tab === 'library'} onClick={() => setTab('library')} icon={<Users size={14} />}>
                Bibliothek
              </TabBtn>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {tab === 'exams' && examsLoaded && (
              <>
                <ExamSelector onCreateNew={() => setCreateOpen(true)} />
                {activeExam && (
                  <ExamActions
                    exam={activeExam}
                    onEdit={() => setEditOpen(true)}
                    onDelete={() => setDeleteOpen(true)}
                  />
                )}

                <div className="h-6 w-px bg-[var(--color-border)] mx-1" />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void undo()}
                  disabled={history.length === 0}
                  aria-label="Undo"
                >
                  <Undo2 size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void redo()}
                  disabled={future.length === 0}
                  aria-label="Redo"
                >
                  <Redo2 size={16} />
                </Button>

                <div className="h-6 w-px bg-[var(--color-border)] mx-1" />

                <div className="flex rounded-lg bg-[var(--color-bg-subtle)] p-0.5">
                  <ViewTab active={examView === 'edit'} onClick={() => setExamView('edit')}>
                    Bearbeiten
                  </ViewTab>
                  <ViewTab active={examView === 'report'} onClick={() => setExamView('report')}>
                    Report
                  </ViewTab>
                </div>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Theme"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
              <LogOut size={16} />
            </Button>

            {tab === 'exams' && examView === 'report' && (
              <Button variant="primary" size="sm" onClick={() => window.print()}>
                <Printer size={14} /> Drucken
              </Button>
            )}
          </div>
        </div>

        <div className="md:hidden px-4 pb-3 flex rounded-lg bg-[var(--color-bg-subtle)] p-0.5 max-w-md mx-auto">
          <TabBtn active={tab === 'exams'} onClick={() => setTab('exams')} icon={<BookOpen size={14} />}>
            Prüfungen
          </TabBtn>
          <TabBtn active={tab === 'library'} onClick={() => setTab('library')} icon={<Users size={14} />}>
            Bibliothek
          </TabBtn>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {tab === 'library' ? (
          <LibraryPage />
        ) : !examsLoaded ? (
          <div className="text-center py-20 text-[var(--color-fg-muted)]">Laden…</div>
        ) : !activeExam || !stats ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-3">Noch keine Prüfung</h2>
            <p className="text-sm text-[var(--color-fg-muted)] mb-6">
              Lege zuerst Schüler in der Bibliothek an, dann erstelle deine erste Prüfung.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => setTab('library')}>
                <Users size={14} /> Zur Bibliothek
              </Button>
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                Erste Prüfung
              </Button>
            </div>
          </div>
        ) : examView === 'report' ? (
          <div className="space-y-6">
            <div className="hidden print:block text-center mb-6">
              <h1 className="text-2xl font-bold">{activeExam.name}</h1>
              {activeExam.subject && (
                <p className="text-base text-[var(--color-fg-muted)]">{activeExam.subject}</p>
              )}
              <p className="text-sm text-[var(--color-fg-muted)]">
                {new Date(activeExam.date).toLocaleDateString()}
              </p>
            </div>
            <StatsPanel stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DistributionChart stats={stats} />
              <CurveChart config={activeExam.config} />
              <BoxPlot
                students={activeExam.students}
                gradeMin={activeExam.config.gradeMin}
                gradeMax={activeExam.config.gradeMax}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <StatsPanel stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-6">
                <ConfigPanel config={activeExam.config} onChange={(c) => void updateActiveConfig(c)} />
                <WhatIfSolver config={activeExam.config} students={activeExam.students} />
              </div>
              <div className="lg:col-span-8 space-y-6">
                <StudentTable exam={activeExam} onEditRoster={() => setEditOpen(true)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DistributionChart stats={stats} />
                  <CurveChart config={activeExam.config} />
                </div>
                <BoxPlot
                  students={activeExam.students}
                  gradeMin={activeExam.config.gradeMin}
                  gradeMax={activeExam.config.gradeMax}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="print-hidden max-w-[1600px] mx-auto px-4 md:px-6 py-8 text-xs text-[var(--color-fg-muted)] text-center">
        Notenrechner V2 · ⌘N neue Prüfung · ⌘Z rückgängig · ⌘P drucken
      </footer>

      <CreateExamModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {activeExam && (
        <>
          <EditExamModal open={editOpen} onClose={() => setEditOpen(false)} exam={activeExam} />
          <DeleteExamDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} exam={activeExam} />
        </>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg-base)] shadow-sm'
          : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-base)]'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg-base)] shadow-sm'
          : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-base)]'
      }`}
    >
      {children}
    </button>
  );
}
