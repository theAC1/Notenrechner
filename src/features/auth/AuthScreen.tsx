import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/state/useAuthStore';
import type { ApiError } from '@/services/api/client';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('Willkommen zurück!');
      } else {
        await register({
          email,
          password,
          ...(displayName ? { displayName } : {}),
          ...(inviteCode ? { inviteCode } : {}),
        });
        toast.success('Konto erstellt');
      }
    } catch (err) {
      const apiErr = err as ApiError;
      const detail =
        typeof apiErr.body === 'object' && apiErr.body && 'error' in apiErr.body
          ? String((apiErr.body as { error: unknown }).error)
          : apiErr.message;
      toast.error(
        apiErr.status === 401
          ? 'E-Mail oder Passwort falsch'
          : apiErr.status === 403
            ? 'Ungültiger Einladungs-Code'
            : apiErr.status === 409
              ? 'E-Mail bereits registriert'
              : apiErr.status === 429
                ? 'Zu viele Versuche. Bitte warte ein paar Minuten.'
                : detail || 'Fehler',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg-base)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass w-full max-w-md p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[oklch(0.55_0.22_310)] text-white flex items-center justify-center shadow-lg mb-3">
            <GraduationCap size={26} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Notenrechner</h1>
          <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
            {mode === 'login' ? 'Melde dich an' : 'Konto erstellen'}
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Field label="E-Mail">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              autoFocus
              placeholder="name@domain.ch"
            />
          </Field>

          {mode === 'register' && (
            <>
              <Field label="Anzeigename (optional)">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </Field>
              <Field label="Einladungs-Code">
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  autoComplete="one-time-code"
                  placeholder="Vom Admin erhalten"
                  required
                />
              </Field>
            </>
          )}

          <Field label="Passwort">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'register' ? 10 : 1}
            />
            {mode === 'register' && (
              <p className="text-[11px] text-[var(--color-fg-muted)] mt-1">
                Mind. 10 Zeichen, Buchstaben + Zahlen
              </p>
            )}
          </Field>

          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {mode === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
            {submitting ? '…' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
          className="mt-4 w-full text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg-base)] transition-colors"
        >
          {mode === 'login' ? 'Noch kein Konto? Jetzt registrieren' : 'Bereits registriert? Anmelden'}
        </button>
      </motion.div>
    </div>
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
